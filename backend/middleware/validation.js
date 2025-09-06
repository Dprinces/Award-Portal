const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Common validation rules
const commonValidations = {
  // MongoDB ObjectId validation
  objectId: (field) => [
    param(field)
      .isMongoId()
      .withMessage(`Invalid ${field} format`)
  ],

  // Email validation
  email: (field = 'email') => [
    body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],

  // Password validation
  password: (field = 'password') => [
    body(field)
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],

  // Student ID validation
  studentId: (field = 'studentId') => [
    body(field)
      .matches(/^S0\d{5}$/)
      .withMessage('Student ID must be in format S0***** (S followed by 0 and 5 digits)')
  ],

  // Phone number validation
  phone: (field = 'phone') => [
    body(field)
      .isMobilePhone('en-NG')
      .withMessage('Please provide a valid Nigerian phone number')
  ],

  // Name validation
  name: (field, minLength = 2, maxLength = 50) => [
    body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`)
  ],

  // Amount validation
  amount: (field = 'amount', min = 50, max = 10000) => [
    body(field)
      .isNumeric()
      .withMessage('Amount must be a number')
      .isFloat({ min, max })
      .withMessage(`Amount must be between ₦${min} and ₦${max}`)
      .custom((value) => {
        if (value % 50 !== 0) {
          throw new Error('Amount must be in multiples of ₦50');
        }
        return true;
      })
  ],

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Search validation
  search: (field = 'search') => [
    query(field)
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term must not exceed 100 characters')
      .escape()
  ]
};

// User validation rules
const userValidation = {
  register: [
    ...commonValidations.email(),
    ...commonValidations.password(),
    ...commonValidations.name('firstName'),
    ...commonValidations.name('lastName'),
    ...commonValidations.studentId(),
    ...commonValidations.phone(),
    body('department')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Department must be between 2 and 100 characters'),
    body('level')
      .isIn(['100', '200', '300', '400', '500', 'Graduate'])
      .withMessage('Invalid academic level'),
    handleValidationErrors
  ],

  login: [
    ...commonValidations.email(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    ...commonValidations.name('firstName'),
    ...commonValidations.name('lastName'),
    ...commonValidations.phone(),
    body('department')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Department must be between 2 and 100 characters'),
    body('level')
      .optional()
      .isIn(['100', '200', '300', '400', '500', 'Graduate'])
      .withMessage('Invalid academic level'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    ...commonValidations.password('newPassword'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Category validation rules
const categoryValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('icon')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Icon name must not exceed 50 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Color must be a valid hex color code'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    body('votingStartDate')
      .optional()
      .isISO8601()
      .withMessage('Voting start date must be a valid date'),
    body('votingEndDate')
      .optional()
      .isISO8601()
      .withMessage('Voting end date must be a valid date')
      .custom((value, { req }) => {
        if (req.body.votingStartDate && value <= req.body.votingStartDate) {
          throw new Error('Voting end date must be after start date');
        }
        return true;
      }),
    handleValidationErrors
  ],

  update: [
    ...commonValidations.objectId('id'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('icon')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Icon name must not exceed 50 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Color must be a valid hex color code'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    body('votingStartDate')
      .optional()
      .isISO8601()
      .withMessage('Voting start date must be a valid date'),
    body('votingEndDate')
      .optional()
      .isISO8601()
      .withMessage('Voting end date must be a valid date'),
    handleValidationErrors
  ],

  list: [
    ...commonValidations.pagination(),
    ...commonValidations.search(),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    handleValidationErrors
  ]
};

// Nominee validation rules
const nomineeValidation = {
  create: [
    body('studentId')
      .isMongoId()
      .withMessage('Invalid student ID'),
    body('categoryId')
      .isMongoId()
      .withMessage('Invalid category ID'),
    body('reason')
      .trim()
      .isLength({ min: 50, max: 1000 })
      .withMessage('Nomination reason must be between 50 and 1000 characters'),
    body('achievements')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Achievements must not exceed 2000 characters'),
    body('campaignStatement')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Campaign statement must not exceed 1000 characters'),
    body('socialMedia')
      .optional()
      .isObject()
      .withMessage('Social media must be an object'),
    body('socialMedia.instagram')
      .optional()
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage('Invalid Instagram username'),
    body('socialMedia.twitter')
      .optional()
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage('Invalid Twitter username'),
    body('socialMedia.facebook')
      .optional()
      .isURL()
      .withMessage('Invalid Facebook URL'),
    handleValidationErrors
  ],

  update: [
    ...commonValidations.objectId('id'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 50, max: 1000 })
      .withMessage('Nomination reason must be between 50 and 1000 characters'),
    body('achievements')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Achievements must not exceed 2000 characters'),
    body('campaignStatement')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Campaign statement must not exceed 1000 characters'),
    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ],

  list: [
    ...commonValidations.pagination(),
    ...commonValidations.search(),
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ]
};

// Vote validation rules
const voteValidation = {
  create: [
    body('nomineeId')
      .isMongoId()
      .withMessage('Invalid nominee ID'),
    ...commonValidations.amount(),
    handleValidationErrors
  ],

  list: [
    ...commonValidations.pagination(),
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('nominee')
      .optional()
      .isMongoId()
      .withMessage('Invalid nominee ID'),
    handleValidationErrors
  ]
};

// Payment validation rules
const paymentValidation = {
  initialize: [
    body('nomineeId')
      .isMongoId()
      .withMessage('Invalid nominee ID'),
    ...commonValidations.amount(),
    handleValidationErrors
  ],

  verify: [
    body('reference')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment reference is required'),
    handleValidationErrors
  ],

  list: [
    ...commonValidations.pagination(),
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid payment status'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  userValidation,
  categoryValidation,
  nomineeValidation,
  voteValidation,
  paymentValidation
};