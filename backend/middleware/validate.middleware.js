// ============================================================
// Input Validation Middleware (express-validator)
// ============================================================
const { validationResult, body } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('student_id').trim().notEmpty().withMessage('Student ID is required').isLength({ min: 3, max: 20 }),
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('phone').optional().trim().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty if provided'),
  body('year').optional().isInt({ min: 1, max: 6 }).withMessage('Year must be 1-6'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  handleValidationErrors
];

const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email or Student ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateLostItem = [
  body('item_name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 150 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('colour').optional().trim().isLength({ max: 50 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('lost_date').notEmpty().withMessage('Lost date is required').isDate().withMessage('Invalid date'),
  body('building').trim().notEmpty().withMessage('Building is required'),
  handleValidationErrors
];

const validateFoundItem = [
  body('item_name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 150 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('colour').optional().trim().isLength({ max: 50 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('found_date').notEmpty().withMessage('Found date is required').isDate().withMessage('Invalid date'),
  body('building').trim().notEmpty().withMessage('Building is required'),
  handleValidationErrors
];

module.exports = { validateRegister, validateLogin, validateLostItem, validateFoundItem, handleValidationErrors };
