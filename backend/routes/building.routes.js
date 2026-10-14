const router = require('express').Router();
const { query } = require('../config/database');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET /api/buildings
router.get('/', async (req, res) => {
  try {
    const buildings = await query(`SELECT b.*, COUNT(r.id) AS room_count FROM buildings b LEFT JOIN rooms r ON b.id=r.building_id WHERE b.status='active' GROUP BY b.id ORDER BY b.building_name`);
    res.json({ success: true, buildings: buildings.rows });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// GET /api/buildings/:id/rooms
router.get('/:id/rooms', async (req, res) => {
  try {
    const rooms = await query(`SELECT * FROM rooms WHERE building_id=$1 AND status='active' ORDER BY room_number`, [req.params.id]);
    res.json({ success: true, rooms: rooms.rows });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// POST /api/buildings
router.post('/', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const { building_name, description } = req.body;
    const r = await query(`INSERT INTO buildings (building_name, description) VALUES ($1,$2) RETURNING *`, [building_name, description]);
    res.status(201).json({ success: true, building: r.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'Building already exists.' });
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

// POST /api/buildings/:id/rooms
router.post('/:id/rooms', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const { room_number, floor } = req.body;
    const r = await query(`INSERT INTO rooms (building_id, room_number, floor) VALUES ($1,$2,$3) RETURNING *`, [req.params.id, room_number, floor]);
    res.status(201).json({ success: true, room: r.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// PUT /api/buildings/:id
router.put('/:id', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const { building_name, description, status } = req.body;
    const r = await query(`UPDATE buildings SET building_name=COALESCE($1,building_name), description=COALESCE($2,description), status=COALESCE($3,status) WHERE id=$4 RETURNING *`, [building_name, description, status, req.params.id]);
    res.json({ success: true, building: r.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

module.exports = router;
