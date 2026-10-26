const FoundItem = require('../models/FoundItem');
const ActivityLog = require('../models/ActivityLog');

const getFoundItems = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, status, building, search, sort = '-createdAt' } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'active';
    if (building) filter.building = new RegExp(building, 'i');
    if (search) filter.$or = [{ item_name: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }, { brand: new RegExp(search, 'i') }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      FoundItem.find(filter).populate('user_id', 'name student_id department').sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      FoundItem.countDocuments(filter)
    ]);
    res.json({ success: true, items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch found items.' }); }
};

const getFoundItem = async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id).populate('user_id', 'name student_id department phone email');
    if (!item) return res.status(404).json({ success: false, message: 'Found item not found.' });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch item.' }); }
};

const createFoundItem = async (req, res) => {
  try {
    const { item_name, category, colour, brand, description, found_date, found_time, building, room_number, area_description, storage_location } = req.body;
    const image_url = req.file ? `/uploads/items/${req.file.filename}` : null;
    const item = await FoundItem.create({ user_id: req.user._id, item_name, category, colour: colour || null, brand: brand || null, description: description || null, found_date, found_time: found_time || null, building, room_number: room_number || null, area_description: area_description || null, storage_location: storage_location || null, image_url });
    await ActivityLog.create({ user_id: req.user._id, action: 'FOUND_ITEM_REPORTED', description: `Found item: ${item_name}`, ip_address: req.ip });
    res.status(201).json({ success: true, message: 'Found item reported successfully!', item });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to report found item.' }); }
};

const updateFoundItem = async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Found item not found.' });
    const isOwner = item.user_id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    const fields = ['item_name','category','colour','brand','description','found_date','found_time','building','room_number','area_description','storage_location','status'];
    fields.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
    if (req.file) item.image_url = `/uploads/items/${req.file.filename}`;
    await item.save();
    res.json({ success: true, message: 'Found item updated.', item });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update item.' }); }
};

const deleteFoundItem = async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Found item not found.' });
    const isOwner = item.user_id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    await item.deleteOne();
    res.json({ success: true, message: 'Found item deleted.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete item.' }); }
};

const getMyFoundItems = async (req, res) => {
  try {
    const items = await FoundItem.find({ user_id: req.user._id }).sort('-createdAt').lean();
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch your items.' }); }
};

const updateFoundItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Found item not found.' });
    const isOwner = item.user_id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    item.status = status;
    await item.save();
    res.json({ success: true, message: 'Status updated successfully.', item });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update status.' }); }
};

module.exports = { getFoundItems, getFoundItem, createFoundItem, updateFoundItem, deleteFoundItem, getMyFoundItems, updateFoundItemStatus };
