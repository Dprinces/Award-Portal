const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const Vote = require('../models/Vote');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', [
  [query('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Invalid status'),
    query('votingActive')
      .optional()
      .isBoolean()
      .withMessage('Voting active must be boolean'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
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

    const { status, votingActive, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (status) {
      // Map status values to isActive field
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive' || status === 'archived') {
        query.isActive = false;
      }
    } else {
      // Default to active categories for public access
      query.isActive = true;
    }

    if (votingActive !== undefined) {
      query.isVotingActive = votingActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get categories with nominee and vote counts
    const categories = await Category.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'nominees',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$status', 'approved'] }
                  ]
                }
              }
            }
          ],
          as: 'nominees'
        }
      },
      {
        $lookup: {
          from: 'votes',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$isVerified', true] }
                  ]
                }
              }
            }
          ],
          as: 'votes'
        }
      },
      {
        $addFields: {
          nomineeCount: { $size: '$nominees' },
          voteCount: { $size: '$votes' },
          totalRevenue: {
            $sum: '$votes.amount'
          }
        }
      },
      {
        $project: {
          nominees: 0,
          votes: 0
        }
      },
      {
        $sort: { displayOrder: 1, createdAt: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Get total count for pagination
    const totalCount = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        categories,
        total: totalCount,
        pagination: {
          current: page,
          pages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category with detailed information
 * @access  Public
 */
router.get('/:id', [
  [
    param('id')
      .isMongoId()
      .withMessage('Valid category ID is required')
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

    // Get category with detailed statistics
    const categoryData = await Category.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'nominees',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$status', 'approved'] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'student',
                foreignField: '_id',
                as: 'student'
              }
            },
            {
              $unwind: '$student'
            },
            {
              $lookup: {
                from: 'votes',
                let: { nomineeId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$nominee', '$$nomineeId'] },
                          { $eq: ['$status', 'verified'] }
                        ]
                      }
                    }
                  }
                ],
                as: 'votes'
              }
            },
            {
              $addFields: {
                voteCount: { $size: '$votes' },
                totalRevenue: { $sum: '$votes.amount' }
              }
            },
            {
              $project: {
                student: {
                  _id: '$student._id',
                  firstName: '$student.firstName',
                  lastName: '$student.lastName',
                  profilePicture: '$student.profilePicture',
                  academicDetails: '$student.academicDetails'
                },
                reason: 1,
                achievements: 1,
                campaignStatement: 1,
                socialMediaLinks: 1,
                voteCount: 1,
                totalRevenue: 1,
                createdAt: 1
              }
            },
            {
              $sort: { voteCount: -1, totalRevenue: -1 }
            }
          ],
          as: 'nominees'
        }
      },
      {
        $lookup: {
          from: 'votes',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$status', 'verified'] }
                  ]
                }
              }
            }
          ],
          as: 'votes'
        }
      },
      {
        $addFields: {
          statistics: {
            nomineeCount: { $size: '$nominees' },
            totalVotes: { $size: '$votes' },
            totalRevenue: { $sum: '$votes.amount' },
            averageVoteValue: {
              $cond: {
                if: { $gt: [{ $size: '$votes' }, 0] },
                then: { $avg: '$votes.amount' },
                else: 0
              }
            }
          }
        }
      },
      {
        $project: {
          votes: 0
        }
      }
    ]);

    if (!categoryData.length) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = categoryData[0];

    res.json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          isVotingActive: category.isVotingActive,
          votingStartDate: category.votingStartDate,
          votingEndDate: category.votingEndDate,
          status: category.status,
          displayOrder: category.displayOrder,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        },
        nominees: category.nominees,
        statistics: category.statistics
      }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new category (admin only)
 * @access  Private (Admin)
 */
router.post('/', [
  auth,
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
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color'),
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

    const {
      name,
      description,
      icon,
      color,
      displayOrder,
      votingStartDate,
      votingEndDate
    } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Validate date range if both dates are provided
    if (votingStartDate && votingEndDate) {
      const startDate = new Date(votingStartDate);
      const endDate = new Date(votingEndDate);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'Voting end date must be after start date'
        });
      }
    }

    // Set display order if not provided
    let finalDisplayOrder = displayOrder;
    if (finalDisplayOrder === undefined) {
      const lastCategory = await Category.findOne({}, {}, { sort: { displayOrder: -1 } });
      finalDisplayOrder = lastCategory ? lastCategory.displayOrder + 1 : 1;
    }

    // Create category
    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      icon: icon?.trim(),
      color: color || '#3B82F6',
      displayOrder: finalDisplayOrder,
      votingStartDate: votingStartDate ? new Date(votingStartDate) : undefined,
      votingEndDate: votingEndDate ? new Date(votingEndDate) : undefined,
      createdBy: req.user.id
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category (admin only)
 * @access  Private (Admin)
 */
router.put('/:id', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid category ID is required'),
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
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    body('isVotingActive')
      .optional()
      .isBoolean()
      .withMessage('Voting active must be boolean'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'archived'])
      .withMessage('Invalid status'),
    body('votingStartDate')
      .optional()
      .isISO8601()
      .withMessage('Voting start date must be a valid date'),
    body('votingEndDate')
      .optional()
      .isISO8601()
      .withMessage('Voting end date must be a valid date')
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
    const updateData = req.body;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Validate date range if dates are being updated
    if (updateData.votingStartDate || updateData.votingEndDate) {
      const startDate = new Date(updateData.votingStartDate || category.votingStartDate);
      const endDate = new Date(updateData.votingEndDate || category.votingEndDate);
      
      if (startDate && endDate && startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'Voting end date must be after start date'
        });
      }
    }

    // Update category
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'votingStartDate' || key === 'votingEndDate') {
          category[key] = updateData[key] ? new Date(updateData[key]) : null;
        } else {
          category[key] = updateData[key];
        }
      }
    });

    category.updatedBy = req.user.id;
    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid category ID is required')
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

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has nominees
    const nomineeCount = await Nominee.countDocuments({ category: id });
    if (nomineeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${nomineeCount} nominee(s). Please remove all nominees first or archive the category instead.`
      });
    }

    // Check if category has votes
    const voteCount = await Vote.countDocuments({ category: id });
    if (voteCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${voteCount} vote(s). Please archive the category instead.`
      });
    }

    // Delete category
    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

/**
 * @route   PUT /api/categories/:id/toggle-voting
 * @desc    Toggle voting status for category (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/toggle-voting', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid category ID is required')
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

    // Find and update category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Toggle voting status
    category.isVotingActive = !category.isVotingActive;
    category.updatedBy = req.user.id;
    await category.save();

    res.json({
      success: true,
      message: `Voting ${category.isVotingActive ? 'enabled' : 'disabled'} for category`,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          isVotingActive: category.isVotingActive
        }
      }
    });

  } catch (error) {
    console.error('Toggle voting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle voting status'
    });
  }
});

/**
 * @route   PUT /api/categories/reorder
 * @desc    Reorder categories (admin only)
 * @access  Private (Admin)
 */
router.put('/reorder', [
  auth,
  [
    body('categories')
      .isArray({ min: 1 })
      .withMessage('Categories array is required'),
    body('categories.*')
      .isObject()
      .withMessage('Each category must be an object'),
    body('categories.*.id')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('categories.*.displayOrder')
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer')
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

    const { categories } = req.body;

    // Validate all category IDs exist
    const categoryIds = categories.map(cat => cat.id);
    const existingCategories = await Category.find({ _id: { $in: categoryIds } });
    
    if (existingCategories.length !== categories.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more category IDs are invalid'
      });
    }

    // Update display orders
    const updatePromises = categories.map(cat => 
      Category.findByIdAndUpdate(
        cat.id,
        { 
          displayOrder: cat.displayOrder,
          updatedBy: req.user.id
        },
        { new: true }
      )
    );

    const updatedCategories = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Categories reordered successfully',
      data: {
        categories: updatedCategories.sort((a, b) => a.displayOrder - b.displayOrder)
      }
    });

  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder categories'
    });
  }
});

module.exports = router;