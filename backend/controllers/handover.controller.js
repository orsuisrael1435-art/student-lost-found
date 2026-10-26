const Match = require('../models/Match');
const { notifyHandoverScheduled, notifyItemReturned } = require('../utils/notification.helper');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

const scheduleHandover = async (req, res) => {
  try {
    const { handover_location, handover_date, handover_time, notes } = req.body;
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    match.handover_location = handover_location;
    match.handover_date = handover_date;
    match.handover_time = handover_time;
    match.handover_notes = notes;
    match.status = 'handover_scheduled';
    await match.save();
    await notifyHandoverScheduled(match.owner_id, handover_location, handover_date, match._id);
    await notifyHandoverScheduled(match.finder_id, handover_location, handover_date, match._id);
    res.json({ success: true, message: 'Handover scheduled!' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to schedule handover.' }); }
};

const confirmHandover = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    match.status = 'returned';
    match.returned_at = new Date();
    await match.save();
    const lostItem = await LostItem.findByIdAndUpdate(match.lost_item_id, { status: 'returned' }, { new: true });
    await FoundItem.findByIdAndUpdate(match.found_item_id, { status: 'returned' });
    await notifyItemReturned(match.owner_id, lostItem?.item_name || 'item');
    await notifyItemReturned(match.finder_id, lostItem?.item_name || 'item');
    res.json({ success: true, message: 'Handover confirmed! Item marked as returned. 🎉' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to confirm handover.' }); }
};

module.exports = { scheduleHandover, confirmHandover };
