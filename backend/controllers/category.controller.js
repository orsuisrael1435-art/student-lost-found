const Category = require('../models/Category');

const getCategories = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { is_active: true };
    const categories = await Category.find(filter).sort('name').lean();
    res.json({ success: true, categories });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get categories.' }); }
};

const createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const exists = await Category.findOne({ name });
    if (exists) return res.status(409).json({ success: false, message: 'Category already exists.' });
    const category = await Category.create({ name, icon: icon || '📦', description });
    res.status(201).json({ success: true, message: 'Category created.', category });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to create category.' }); }
};

const updateCategory = async (req, res) => {
  try {
    const { name, icon, description, is_active } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { name, icon, description, is_active }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category updated.', category });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update category.' }); }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete category.' }); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
