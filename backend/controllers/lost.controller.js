const LostItem = require('../models/LostItem');
const ActivityLog = require('../models/ActivityLog');

const getLostItems = async (req, res) => {
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
      LostItem.find(filter).populate('user_id', 'name student_id department').sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      LostItem.countDocuments(filter)
    ]);
    res.json({ success: true, items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to fetch lost items.' }); }
};

const getLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id).populate('user_id', 'name student_id department phone email');
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found.' });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch item.' }); }
};

const createLostItem = async (req, res) => {
  try {
    const { item_name, category, colour, brand, description, lost_date, lost_time, building, room_number, area_description } = req.body;
    const image_url = req.file ? `/uploads/items/${req.file.filename}` : null;
    const item = await LostItem.create({ user_id: req.user._id, item_name, category, colour: colour || null, brand: brand || null, description: description || null, lost_date, lost_time: lost_time || null, building, room_number: room_number || null, area_description: area_description || null, image_url });
    await ActivityLog.create({ user_id: req.user._id, action: 'LOST_ITEM_REPORTED', description: `Lost item: ${item_name}`, ip_address: req.ip });
    res.status(201).json({ success: true, message: 'Lost item reported successfully!', item });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to report lost item.' }); }
};

const updateLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found.' });
    const isOwner = item.user_id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    const fields = ['item_name','category','colour','brand','description','lost_date','lost_time','building','room_number','area_description','status'];
    fields.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
    if (req.file) item.image_url = `/uploads/items/${req.file.filename}`;
    await item.save();
    res.json({ success: true, message: 'Lost item updated.', item });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update item.' }); }
};

const deleteLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found.' });
    const isOwner = item.user_id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    await item.deleteOne();
    res.json({ success: true, message: 'Lost item deleted.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete item.' }); }
};

const getMyLostItems = async (req, res) => {
  try {
    const items = await LostItem.find({ user_id: req.user._id }).sort('-createdAt').lean();
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch your items.' }); }
};

module.exports = { getLostItems, getLostItem, createLostItem, updateLostItem, deleteLostItem, getMyLostItems };
