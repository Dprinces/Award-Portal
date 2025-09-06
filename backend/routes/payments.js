const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const Vote = require('../models/Vote');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for payment endpoints
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 payment requests per windowMs
  message: {
    error: 'Too many payment requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more webhook requests
  message: {
    error: 'Too many webhook requests'
  }
});

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize a payment for voting
 * @access  Private
 */
router.post('/initialize', [
  auth,
  paymentRateLimit,
  [
    body('nomineeId')
      .isMongoId()
      .withMessage('Valid nominee ID is required'),
    body('categoryId')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nomineeId, categoryId, amount, email } = req.body;
    const userId = req.user.id;

    // Validate category and nominee
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const nominee = await Nominee.findById(nomineeId);
    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check if nominee belongs to category
    if (nominee.category.toString() !== categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Nominee does not belong to the specified category'
      });
    }

    // Check if voting is active
    if (!category.isVotingActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not currently active for this category'
      });
    }

    // Check if amount matches category price
    if (amount !== category.votingSettings.votePrice) {
      return res.status(400).json({
        success: false,
        message: `Vote price for this category is ₦${category.votingSettings.votePrice}`
      });
    }

    // Initialize payment
    const result = await paymentService.initializePayment({
      userId,
      nomineeId,
      categoryId,
      amount,
      email: email || req.user.email,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Payment initialized successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment'
    });
  }
});

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify a payment transaction
 * @access  Private
 */
router.get('/verify/:reference', [
  auth,
  [
    param('reference')
      .notEmpty()
      .withMessage('Payment reference is required')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reference } = req.params;

    // Verify payment
    const result = await paymentService.verifyPayment(reference);

    // Check if payment belongs to current user
    if (result.data.payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment: result.data.payment,
        status: result.data.payment.status,
        alreadyVerified: result.data.alreadyVerified || false
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Paystack webhook
 * @access  Public (but verified)
 */
router.post('/webhook', [
  webhookRateLimit,
  express.raw({ type: 'application/json' })
], async (req, res) => {
  try {
    const signature = req.get('x-paystack-signature');
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing signature'
      });
    }

    // Parse the payload
    const payload = JSON.parse(req.body.toString());

    // Handle webhook
    await paymentService.handleWebhook(payload, signature);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/history', [
  auth,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'successful', 'failed', 'cancelled'])
      .withMessage('Invalid status')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    // Build query
    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    // Get payments with pagination
    const payments = await Payment.find(query)
      .populate({
        path: 'metadata.nominee',
        select: 'student reason achievements',
        populate: {
          path: 'student',
          select: 'firstName lastName profilePicture'
        }
      })
      .populate({
        path: 'metadata.category',
        select: 'name description icon'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', [
  auth,
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Category must be a valid ID')
  ]
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate, category } = req.query;

    // Get payment statistics
    const stats = await paymentService.getPaymentStats({
      startDate,
      endDate,
      category
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process a refund (admin only)
 * @access  Private (Admin)
 */
router.post('/:id/refund', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid payment ID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Refund reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters')
  ]
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Process refund
    const result = await paymentService.processRefund(id, reason);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
});

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details
 * @access  Private
 */
router.get('/:id', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid payment ID is required')
  ]
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    // Find payment
    const payment = await Payment.findById(id)
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'metadata.nominee',
        select: 'student reason achievements',
        populate: {
          path: 'student',
          select: 'firstName lastName profilePicture'
        }
      })
      .populate({
        path: 'metadata.category',
        select: 'name description icon'
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check access permissions
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
});

module.exports = router;