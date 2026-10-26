const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getCategories);
router.post('/', protect, authorize('admin', 'superadmin'), createCategory);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteCategory);

module.exports = router;
