const Message = require('../models/Message');
const Match = require('../models/Match');

const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    const userId = req.user._id.toString();
    const isParty = match.owner_id.toString() === userId || match.finder_id.toString() === userId;
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isParty && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    await Message.updateMany({ match_id: matchId, sender_id: { $ne: req.user._id }, is_read: false }, { is_read: true });
    const messages = await Message.find({ match_id: matchId }).populate('sender_id', 'name student_id profile_image').sort('createdAt').lean();
    res.json({ success: true, messages });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get messages.' }); }
};

const sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    const userId = req.user._id.toString();
    if (match.owner_id.toString() !== userId && match.finder_id.toString() !== userId) return res.status(403).json({ success: false, message: 'Not authorized.' });
    const message = await Message.create({ match_id: matchId, sender_id: req.user._id, content: content.trim() });
    const populated = await message.populate('sender_id', 'name student_id profile_image');
    res.status(201).json({ success: true, message: populated });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to send message.' }); }
};

const getMatchConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const matches = await Match.find({
      $or: [{ owner_id: userId }, { finder_id: userId }],
      status: { $in: ['contact_accepted', 'handover_scheduled', 'returned'] }
    })
      .populate('lost_item_id', 'item_name category')
      .populate('found_item_id', 'item_name')
      .populate('owner_id', 'name student_id')
      .populate('finder_id', 'name student_id')
      .sort('-updatedAt').lean();
    res.json({ success: true, matches });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get conversations.' }); }
};

module.exports = { getMessages, sendMessage, getMatchConversations };
