const Match = require('../models/Match');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const { notifyPossibleMatch, notifyContactRequest, notifyContactAccepted } = require('../utils/notification.helper');

const getMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const matches = await Match.find({
      $or: [{ owner_id: userId }, { finder_id: userId }],
      status: { $nin: ['false_match', 'closed'] }
    })
      .populate('lost_item_id', 'item_name lost_id category colour building image_url')
      .populate('found_item_id', 'item_name found_id category colour building image_url')
      .populate('owner_id', 'name student_id')
      .populate('finder_id', 'name student_id')
      .sort('-createdAt').lean();
    res.json({ success: true, matches });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch matches.' }); }
};

const getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lost_item_id')
      .populate('found_item_id')
      .populate('owner_id', 'name student_id email phone department')
      .populate('finder_id', 'name student_id email phone department');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    const userId = req.user._id.toString();
    const isOwner = match.owner_id._id.toString() === userId;
    const isFinder = match.finder_id._id.toString() === userId;
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isFinder && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    res.json({ success: true, match });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch match.' }); }
};

const requestContact = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    if (match.owner_id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the owner can request contact.' });
    match.contact_requested = true;
    match.status = 'contact_requested';
    await match.save();
    const lostItem = await LostItem.findById(match.lost_item_id);
    await notifyContactRequest(match.finder_id, lostItem?.item_name || 'item', match._id);
    res.json({ success: true, message: 'Contact request sent to finder.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to request contact.' }); }
};

const acceptContact = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    if (match.finder_id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the finder can accept.' });
    match.contact_accepted = true;
    match.status = 'contact_accepted';
    await match.save();
    const lostItem = await LostItem.findById(match.lost_item_id);
    await notifyContactAccepted(match.owner_id, lostItem?.item_name || 'item', match._id);
    res.json({ success: true, message: 'Contact accepted. You can now message each other.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to accept contact.' }); }
};

const rejectMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    match.status = 'false_match';
    await match.save();
    res.json({ success: true, message: 'Match marked as false match.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to reject match.' }); }
};

const scheduleHandover = async (req, res) => {
  try {
    const { handover_location, handover_date, handover_time, handover_notes } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    match.handover_location = handover_location;
    match.handover_date = handover_date;
    match.handover_time = handover_time;
    match.handover_notes = handover_notes;
    match.status = 'handover_scheduled';
    await match.save();
    res.json({ success: true, message: 'Handover scheduled successfully!' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to schedule handover.' }); }
};

const confirmReturn = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    match.status = 'returned';
    match.returned_at = new Date();
    await match.save();
    await LostItem.findByIdAndUpdate(match.lost_item_id, { status: 'returned' });
    await FoundItem.findByIdAndUpdate(match.found_item_id, { status: 'returned' });
    res.json({ success: true, message: 'Item return confirmed! 🎉' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to confirm return.' }); }
};

module.exports = { getMatches, getMatch, requestContact, acceptContact, rejectMatch, scheduleHandover, confirmReturn };
