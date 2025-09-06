const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Nominee = require('../models/Nominee');
const Category = require('../models/Category');
const User = require('../models/User');
const Vote = require('../models/Vote');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /api/nominees
 * @desc    Get all nominees with filtering and pagination
 * @access  Public
 */
router.get('/', [
  [
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Category must be a valid ID'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('sortBy')
      .optional()
      .isIn(['votes', 'revenue', 'recent', 'alphabetical'])
      .withMessage('Invalid sort option')
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

    const {
      category,
      status = 'approved',
      page = 1,
      limit = 20,
      search,
      sortBy = 'votes'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match stage
    const matchStage = { status };
    
    if (category) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchStage },
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
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
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
          totalRevenue: { $sum: '$votes.amount' },
          uniqueVoters: {
            $size: {
              $setUnion: ['$votes.voter', []]
            }
          },
          averageVoteValue: {
            $cond: {
              if: { $gt: [{ $size: '$votes' }, 0] },
              then: { $avg: '$votes.amount' },
              else: 0
            }
          },
          lastVoteAt: { $max: '$votes.createdAt' }
        }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'student.firstName': { $regex: search, $options: 'i' } },
            { 'student.lastName': { $regex: search, $options: 'i' } },
            { reason: { $regex: search, $options: 'i' } },
            { achievements: { $regex: search, $options: 'i' } },
            { 'category.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting
    let sortStage = {};
    switch (sortBy) {
      case 'votes':
        sortStage = { voteCount: -1, totalRevenue: -1 };
        break;
      case 'revenue':
        sortStage = { totalRevenue: -1, voteCount: -1 };
        break;
      case 'recent':
        sortStage = { createdAt: -1 };
        break;
      case 'alphabetical':
        sortStage = { 'student.firstName': 1, 'student.lastName': 1 };
        break;
      default:
        sortStage = { voteCount: -1, totalRevenue: -1 };
    }
    pipeline.push({ $sort: sortStage });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Project final fields
    pipeline.push({
      $project: {
        student: {
          _id: '$student._id',
          firstName: '$student.firstName',
          lastName: '$student.lastName',
          profilePicture: '$student.profilePicture',
          academicDetails: '$student.academicDetails'
        },
        category: {
          _id: '$category._id',
          name: '$category.name',
          icon: '$category.icon',
          color: '$category.color'
        },
        reason: 1,
        achievements: 1,
        campaignStatement: 1,
        socialMediaLinks: 1,
        status: 1,
        voteCount: 1,
        totalRevenue: 1,
        uniqueVoters: 1,
        averageVoteValue: { $round: ['$averageVoteValue', 2] },
        lastVoteAt: 1,
        createdAt: 1,
        updatedAt: 1
      }
    });

    // Execute aggregation
    const nominees = await Nominee.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
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
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      }
    ];

    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { 'student.firstName': { $regex: search, $options: 'i' } },
            { 'student.lastName': { $regex: search, $options: 'i' } },
            { reason: { $regex: search, $options: 'i' } },
            { achievements: { $regex: search, $options: 'i' } },
            { 'category.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    countPipeline.push({ $count: 'total' });
    const countResult = await Nominee.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add ranking to nominees
    const rankedNominees = nominees.map((nominee, index) => ({
      ...nominee,
      rank: skip + index + 1
    }));

    res.json({
      success: true,
      data: {
        nominees: rankedNominees,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get nominees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominees'
    });
  }
});

/**
 * @route   GET /api/nominees/:id
 * @desc    Get single nominee with detailed information
 * @access  Public
 */
router.get('/:id', [
  [
    param('id')
      .isMongoId()
      .withMessage('Valid nominee ID is required')
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

    // Get nominee with detailed information
    const nomineeData = await Nominee.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
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
            },
            {
              $lookup: {
                from: 'users',
                localField: 'voter',
                foreignField: '_id',
                as: 'voter'
              }
            },
            {
              $unwind: '$voter'
            },
            {
              $project: {
                amount: 1,
                createdAt: 1,
                voter: {
                  _id: '$voter._id',
                  firstName: '$voter.firstName',
                  lastName: '$voter.lastName',
                  profilePicture: '$voter.profilePicture'
                }
              }
            },
            {
              $sort: { createdAt: -1 }
            },
            {
              $limit: 10 // Latest 10 votes
            }
          ],
          as: 'recentVotes'
        }
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
          as: 'allVotes'
        }
      },
      {
        $addFields: {
          statistics: {
            totalVotes: { $size: '$allVotes' },
            totalRevenue: { $sum: '$allVotes.amount' },
            uniqueVoters: {
              $size: {
                $setUnion: ['$allVotes.voter', []]
              }
            },
            averageVoteValue: {
              $cond: {
                if: { $gt: [{ $size: '$allVotes' }, 0] },
                then: { $avg: '$allVotes.amount' },
                else: 0
              }
            },
            minVoteValue: {
              $cond: {
                if: { $gt: [{ $size: '$allVotes' }, 0] },
                then: { $min: '$allVotes.amount' },
                else: 0
              }
            },
            maxVoteValue: {
              $cond: {
                if: { $gt: [{ $size: '$allVotes' }, 0] },
                then: { $max: '$allVotes.amount' },
                else: 0
              }
            },
            firstVoteAt: { $min: '$allVotes.createdAt' },
            lastVoteAt: { $max: '$allVotes.createdAt' }
          }
        }
      },
      {
        $project: {
          student: {
            _id: '$student._id',
            firstName: '$student.firstName',
            lastName: '$student.lastName',
            email: '$student.email',
            profilePicture: '$student.profilePicture',
            academicDetails: '$student.academicDetails',
            socialMediaLinks: '$student.socialMediaLinks'
          },
          category: {
            _id: '$category._id',
            name: '$category.name',
            description: '$category.description',
            icon: '$category.icon',
            color: '$category.color',
            isVotingActive: '$category.isVotingActive'
          },
          reason: 1,
          achievements: 1,
          campaignStatement: 1,
          socialMediaLinks: 1,
          status: 1,
          statistics: 1,
          recentVotes: 1,
          createdAt: 1,
          updatedAt: 1,
          allVotes: 0
        }
      }
    ]);

    if (!nomineeData.length) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    const nominee = nomineeData[0];

    // Get nominee's rank in category
    const categoryRanking = await Vote.aggregate([
      {
        $match: {
          category: nominee.category._id,
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$nominee',
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalVotes: -1, totalRevenue: -1 }
      }
    ]);

    const nomineeRank = categoryRanking.findIndex(
      item => item._id.toString() === id
    ) + 1;

    nominee.statistics.rank = nomineeRank || null;
    nominee.statistics.totalNomineesInCategory = categoryRanking.length;

    res.json({
      success: true,
      data: {
        nominee
      }
    });

  } catch (error) {
    console.error('Get nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominee'
    });
  }
});

/**
 * @route   POST /api/nominees
 * @desc    Create new nomination
 * @access  Private
 */
router.post('/', [
  auth,
  [
    body('student')
      .isMongoId()
      .withMessage('Valid student ID is required'),
    body('category')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('reason')
      .trim()
      .isLength({ min: 50, max: 1000 })
      .withMessage('Reason must be between 50 and 1000 characters'),
    body('achievements')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Achievements must not exceed 2000 characters'),
    body('campaignStatement')
      .optional()
      .trim()
      .isLength({ max: 1500 })
      .withMessage('Campaign statement must not exceed 1500 characters'),
    body('socialMediaLinks')
      .optional()
      .isObject()
      .withMessage('Social media links must be an object'),
    body('socialMediaLinks.facebook')
      .optional()
      .isURL()
      .withMessage('Facebook link must be a valid URL'),
    body('socialMediaLinks.twitter')
      .optional()
      .isURL()
      .withMessage('Twitter link must be a valid URL'),
    body('socialMediaLinks.instagram')
      .optional()
      .isURL()
      .withMessage('Instagram link must be a valid URL'),
    body('socialMediaLinks.linkedin')
      .optional()
      .isURL()
      .withMessage('LinkedIn link must be a valid URL')
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

    const {
      student,
      category,
      reason,
      achievements,
      campaignStatement,
      socialMediaLinks
    } = req.body;

    // Check if student exists and is verified
    const studentUser = await User.findById(student);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!studentUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Student email must be verified before nomination'
      });
    }

    if (studentUser.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can be nominated'
      });
    }

    // Check if category exists and is active
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (categoryDoc.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Category is not active for nominations'
      });
    }

    // Check if student is already nominated in this category
    const existingNomination = await Nominee.findOne({
      student,
      category,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingNomination) {
      return res.status(400).json({
        success: false,
        message: 'Student is already nominated in this category'
      });
    }

    // Check if user can nominate (self-nomination or admin)
    const canNominate = req.user.id === student || req.user.role === 'admin';
    if (!canNominate) {
      return res.status(403).json({
        success: false,
        message: 'You can only nominate yourself or you must be an admin'
      });
    }

    // Create nomination
    const nominee = new Nominee({
      student,
      category,
      reason: reason.trim(),
      achievements: achievements?.trim(),
      campaignStatement: campaignStatement?.trim(),
      socialMediaLinks,
      nominatedBy: req.user.id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    await nominee.save();

    // Populate the nominee for response
    await nominee.populate([
      {
        path: 'student',
        select: 'firstName lastName profilePicture academicDetails'
      },
      {
        path: 'category',
        select: 'name description icon color'
      },
      {
        path: 'nominatedBy',
        select: 'firstName lastName'
      }
    ]);

    res.status(201).json({
      success: true,
      message: `Nomination ${nominee.status === 'approved' ? 'approved' : 'submitted for review'} successfully`,
      data: {
        nominee
      }
    });

  } catch (error) {
    console.error('Create nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create nomination'
    });
  }
});

/**
 * @route   PUT /api/nominees/:id
 * @desc    Update nomination (nominee or admin only)
 * @access  Private
 */
router.put('/:id', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid nominee ID is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 50, max: 1000 })
      .withMessage('Reason must be between 50 and 1000 characters'),
    body('achievements')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Achievements must not exceed 2000 characters'),
    body('campaignStatement')
      .optional()
      .trim()
      .isLength({ max: 1500 })
      .withMessage('Campaign statement must not exceed 1500 characters'),
    body('socialMediaLinks')
      .optional()
      .isObject()
      .withMessage('Social media links must be an object'),
    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
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

    const { id } = req.params;
    const updateData = req.body;

    // Find nominee
    const nominee = await Nominee.findById(id).populate('student');
    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check permissions
    const isOwner = nominee.student._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own nomination.'
      });
    }

    // Only admin can change status
    if (updateData.status && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change nomination status'
      });
    }

    // If nomination is approved and has votes, restrict updates
    if (nominee.status === 'approved' && !isAdmin) {
      const voteCount = await Vote.countDocuments({ nominee: id });
      if (voteCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update nomination that already has votes. Contact admin for assistance.'
        });
      }
    }

    // Update nominee
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        nominee[key] = updateData[key];
      }
    });

    nominee.updatedBy = req.user.id;
    await nominee.save();

    // Populate for response
    await nominee.populate([
      {
        path: 'student',
        select: 'firstName lastName profilePicture academicDetails'
      },
      {
        path: 'category',
        select: 'name description icon color'
      }
    ]);

    res.json({
      success: true,
      message: 'Nomination updated successfully',
      data: {
        nominee
      }
    });

  } catch (error) {
    console.error('Update nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update nomination'
    });
  }
});

/**
 * @route   DELETE /api/nominees/:id
 * @desc    Delete nomination (admin only or nominee with no votes)
 * @access  Private
 */
router.delete('/:id', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid nominee ID is required')
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

    // Find nominee
    const nominee = await Nominee.findById(id).populate('student');
    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Check permissions
    const isOwner = nominee.student._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own nomination.'
      });
    }

    // Check if nominee has votes
    const voteCount = await Vote.countDocuments({ nominee: id });
    if (voteCount > 0 && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete nomination with ${voteCount} vote(s). Contact admin for assistance.`
      });
    }

    if (voteCount > 0 && isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete nomination with ${voteCount} vote(s). Consider rejecting the nomination instead.`
      });
    }

    // Delete nominee
    await Nominee.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Nomination deleted successfully'
    });

  } catch (error) {
    console.error('Delete nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete nomination'
    });
  }
});

/**
 * @route   GET /api/nominees/my-nominations
 * @desc    Get current user's nominations
 * @access  Private
 */
router.get('/my-nominations', [
  auth,
  [
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
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

    const { status } = req.query;

    // Build query
    const query = { student: req.user.id };
    if (status) {
      query.status = status;
    }

    // Get user's nominations
    const nominations = await Nominee.find(query)
      .populate('category', 'name description icon color isVotingActive')
      .populate('nominatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get vote counts for each nomination
    const nominationsWithStats = await Promise.all(
      nominations.map(async (nomination) => {
        const voteStats = await Vote.aggregate([
          {
            $match: {
              nominee: nomination._id,
              status: 'verified'
            }
          },
          {
            $group: {
              _id: null,
              totalVotes: { $sum: 1 },
              totalRevenue: { $sum: '$amount' },
              uniqueVoters: { $addToSet: '$voter' }
            }
          }
        ]);

        const stats = voteStats.length > 0 ? {
          totalVotes: voteStats[0].totalVotes,
          totalRevenue: voteStats[0].totalRevenue,
          uniqueVoters: voteStats[0].uniqueVoters.length
        } : {
          totalVotes: 0,
          totalRevenue: 0,
          uniqueVoters: 0
        };

        return {
          ...nomination.toObject(),
          statistics: stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        nominations: nominationsWithStats,
        total: nominations.length
      }
    });

  } catch (error) {
    console.error('My nominations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominations'
    });
  }
});

/**
 * @route   PUT /api/nominees/:id/approve
 * @desc    Approve nomination (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/approve', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid nominee ID is required')
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

    // Find and update nominee
    const nominee = await Nominee.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        updatedBy: req.user.id
      },
      { new: true }
    ).populate([
      {
        path: 'student',
        select: 'firstName lastName email profilePicture'
      },
      {
        path: 'category',
        select: 'name description'
      }
    ]);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    res.json({
      success: true,
      message: 'Nomination approved successfully',
      data: {
        nominee
      }
    });

  } catch (error) {
    console.error('Approve nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve nomination'
    });
  }
});

/**
 * @route   PUT /api/nominees/:id/reject
 * @desc    Reject nomination (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/reject', [
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Valid nominee ID is required'),
    body('rejectionReason')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters')
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
    const { rejectionReason } = req.body;

    // Find and update nominee
    const nominee = await Nominee.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejectionReason: rejectionReason?.trim(),
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        updatedBy: req.user.id
      },
      { new: true }
    ).populate([
      {
        path: 'student',
        select: 'firstName lastName email profilePicture'
      },
      {
        path: 'category',
        select: 'name description'
      }
    ]);

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    res.json({
      success: true,
      message: 'Nomination rejected successfully',
      data: {
        nominee
      }
    });

  } catch (error) {
    console.error('Reject nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject nomination'
    });
  }
});

module.exports = router;