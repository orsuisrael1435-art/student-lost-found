const express = require('express');
const router = express.Router();
const { getBuildings, getBuilding, createBuilding, updateBuilding, addRoom } = require('../controllers/building.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getBuildings);
router.get('/:id', getBuilding);
router.post('/', protect, authorize('admin', 'superadmin'), createBuilding);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateBuilding);
router.post('/:id/rooms', protect, authorize('admin', 'superadmin'), addRoom);

module.exports = router;
