const Building = require('../models/Building');

const getBuildings = async (req, res) => {
  try {
    const buildings = await Building.find({ is_active: true }).sort('name').lean();
    res.json({ success: true, buildings });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get buildings.' }); }
};

const getBuilding = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) return res.status(404).json({ success: false, message: 'Building not found.' });
    res.json({ success: true, building });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get building.' }); }
};

const createBuilding = async (req, res) => {
  try {
    const { name, code, rooms } = req.body;
    const building = await Building.create({ name, code, rooms: rooms || [] });
    res.status(201).json({ success: true, message: 'Building created.', building });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to create building.' }); }
};

const updateBuilding = async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!building) return res.status(404).json({ success: false, message: 'Building not found.' });
    res.json({ success: true, message: 'Building updated.', building });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update building.' }); }
};

const addRoom = async (req, res) => {
  try {
    const { room } = req.body;
    const building = await Building.findByIdAndUpdate(req.params.id, { $addToSet: { rooms: room } }, { new: true });
    res.json({ success: true, message: 'Room added.', building });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to add room.' }); }
};

module.exports = { getBuildings, getBuilding, createBuilding, updateBuilding, addRoom };
