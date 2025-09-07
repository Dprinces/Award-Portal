const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Vote = require('../models/Vote');
const Nominee = require('../models/Nominee');
const Category = require('../models/Category');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   POST /api/votes
 * @desc    Create a new vote
 * @access  Private
 */
router.post('/', [
  auth,
  [
    body('nominee')
      .isMongoId()
      .withMessage('Valid nominee ID is required'),
    body('category')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nominee, category, amount } = req.body;
    const userId = req.user.id;

    // Check if category exists and is active
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!categoryDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not active for this category'
      });
    }

    // Check if nominee exists and belongs to the category
    const nomineeDoc = await Nominee.findById(nominee);
    if (!nomineeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    if (nomineeDoc.category.toString() !== category) {
      return res.status(400).json({
        success: false,
        message: 'Nominee does not belong to the specified category'
      });
    }

    if (nomineeDoc.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Nominee is not approved for voting'
      });
    }

    // Check if user has already voted in this category
    const existingVote = await Vote.findOne({
      voter: userId,
      category: category,
      status: { $in: ['pending', 'verified'] }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this category'
      });
    }

    // Create the vote
    const vote = new Vote({
      voter: userId,
      nominee: nominee,
      category: category,
      amount: amount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await vote.save();

    // Populate the vote with nominee and category details
    await vote.populate([
      { path: 'nominee', select: 'student reason' },
      { path: 'category', select: 'name description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Vote created successfully',
      data: vote
    });

  } catch (error) {
    console.error('Create vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vote'
    });
  }
});

/**
 * @route   GET /api/votes/my-votes
 * @desc    Get current user's votes
 * @access  Private
 */
router.get('/my-votes', [
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
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Category must be a valid ID'),
    query('status')
      .optional()
      .isIn(['pending', 'verified', 'suspicious', 'refunded'])
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
    const { category, status } = req.query;

    // Build query
    const query = { voter: req.user.id };
    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }

    // Get votes with pagination
    const votes = await Vote.find(query)
      .populate({
        path: 'nominee',
        select: 'student reason achievements statistics',
        populate: {
          path: 'student',
          select: 'firstName lastName profilePicture academicDetails'
        }
      })
      .populate('category', 'name description icon color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Vote.countDocuments(query);

    // Get vote summary
    const summary = await Vote.aggregate([
      { $match: { voter: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        votes,
        summary,
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
    console.error('My votes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch votes'
    });
  }
});

/**
 * @route   GET /api/votes/category/:categoryId/counts
 * @desc    Get vote counts for nominees in a category
 * @access  Public
 */
router.get('/category/:categoryId/counts', [
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Valid category ID is required')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { categoryId } = req.params;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get vote counts for each nominee in this category
    const voteCounts = await Vote.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$nominee',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'nominees',
          localField: '_id',
          foreignField: '_id',
          as: 'nominee'
        }
      },
      {
        $unwind: '$nominee'
      },
      {
        $project: {
          nomineeId: '$_id',
          count: 1,
          totalAmount: 1,
          nominee: {
            _id: '$nominee._id',
            student: '$nominee.student'
          }
        }
      }
    ]);

    // Convert to object format for easy lookup
    const countsMap = {};
    voteCounts.forEach(item => {
      countsMap[item.nomineeId] = {
        count: item.count,
        totalAmount: item.totalAmount
      };
    });

    res.json({
      success: true,
      message: 'Vote counts retrieved successfully',
      data: countsMap
    });

  } catch (error) {
    console.error('Error fetching vote counts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/votes/category/:categoryId/results
 * @desc    Get voting results for a category
 * @access  Public
 */
router.get('/category/:categoryId/results', [
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Valid category ID is required'),
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

    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get voting results
    const results = await Vote.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$nominee',
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' },
          averageVoteValue: { $avg: '$amount' },
          lastVoteAt: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'nominees',
          localField: '_id',
          foreignField: '_id',
          as: 'nominee'
        }
      },
      {
        $unwind: '$nominee'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'nominee.student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $project: {
          nominee: {
            _id: '$nominee._id',
            reason: '$nominee.reason',
            achievements: '$nominee.achievements',
            campaignStatement: '$nominee.campaignStatement',
            socialMediaLinks: '$nominee.socialMediaLinks',
            status: '$nominee.status'
          },
          student: {
            _id: '$student._id',
            firstName: '$student.firstName',
            lastName: '$student.lastName',
            profilePicture: '$student.profilePicture',
            academicDetails: '$student.academicDetails'
          },
          totalVotes: 1,
          totalRevenue: 1,
          uniqueVoters: { $size: '$uniqueVoters' },
          averageVoteValue: { $round: ['$averageVoteValue', 2] },
          lastVoteAt: 1
        }
      },
      {
        $sort: { totalVotes: -1, totalRevenue: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Add ranking
    const rankedResults = results.map((result, index) => ({
      ...result,
      rank: index + 1
    }));

    // Get category statistics
    const categoryStats = await Vote.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' },
          uniqueNominees: { $addToSet: '$nominee' },
          averageVoteValue: { $avg: '$amount' }
        }
      }
    ]);

    const stats = categoryStats.length > 0 ? {
      totalVotes: categoryStats[0].totalVotes,
      totalRevenue: categoryStats[0].totalRevenue,
      uniqueVoters: categoryStats[0].uniqueVoters.length,
      uniqueNominees: categoryStats[0].uniqueNominees.length,
      averageVoteValue: Math.round(categoryStats[0].averageVoteValue * 100) / 100
    } : {
      totalVotes: 0,
      totalRevenue: 0,
      uniqueVoters: 0,
      uniqueNominees: 0,
      averageVoteValue: 0
    };

    res.json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          isVotingActive: category.isVotingActive
        },
        results: rankedResults,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Category results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category results'
    });
  }
});

/**
 * @route   GET /api/votes/nominee/:nomineeId/stats
 * @desc    Get voting statistics for a specific nominee
 * @access  Public
 */
router.get('/nominee/:nomineeId/stats', [
  [
    param('nomineeId')
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

    const { nomineeId } = req.params;

    // Check if nominee exists
    const nominee = await Nominee.findById(nomineeId)
      .populate('student', 'firstName lastName profilePicture')
      .populate('category', 'name description');

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    // Get detailed voting statistics
    const stats = await Vote.aggregate([
      {
        $match: {
          nominee: new mongoose.Types.ObjectId(nomineeId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' },
          averageVoteValue: { $avg: '$amount' },
          minVoteValue: { $min: '$amount' },
          maxVoteValue: { $max: '$amount' },
          firstVoteAt: { $min: '$createdAt' },
          lastVoteAt: { $max: '$createdAt' }
        }
      }
    ]);

    // Get vote distribution by amount
    const voteDistribution = await Vote.aggregate([
      {
        $match: {
          nominee: new mongoose.Types.ObjectId(nomineeId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: '$amount',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get votes over time (daily)
    const votesOverTime = await Vote.aggregate([
      {
        $match: {
          nominee: new mongoose.Types.ObjectId(nomineeId),
          status: 'verified'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          votes: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

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
      item => item._id.toString() === nomineeId
    ) + 1;

    const nomineeStats = stats.length > 0 ? {
      totalVotes: stats[0].totalVotes,
      totalRevenue: stats[0].totalRevenue,
      uniqueVoters: stats[0].uniqueVoters.length,
      averageVoteValue: Math.round(stats[0].averageVoteValue * 100) / 100,
      minVoteValue: stats[0].minVoteValue,
      maxVoteValue: stats[0].maxVoteValue,
      firstVoteAt: stats[0].firstVoteAt,
      lastVoteAt: stats[0].lastVoteAt,
      rank: nomineeRank || null,
      totalNomineesInCategory: categoryRanking.length
    } : {
      totalVotes: 0,
      totalRevenue: 0,
      uniqueVoters: 0,
      averageVoteValue: 0,
      minVoteValue: 0,
      maxVoteValue: 0,
      firstVoteAt: null,
      lastVoteAt: null,
      rank: null,
      totalNomineesInCategory: categoryRanking.length
    };

    res.json({
      success: true,
      data: {
        nominee: {
          _id: nominee._id,
          student: nominee.student,
          category: nominee.category,
          reason: nominee.reason,
          achievements: nominee.achievements
        },
        statistics: nomineeStats,
        voteDistribution,
        votesOverTime
      }
    });

  } catch (error) {
    console.error('Nominee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominee statistics'
    });
  }
});

/**
 * @route   GET /api/votes/leaderboard
 * @desc    Get overall leaderboard across all categories
 * @access  Public
 */
router.get('/leaderboard', [
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Category must be a valid ID')
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

    const limit = parseInt(req.query.limit) || 50;
    const { category } = req.query;

    // Build match stage
    const matchStage = {
      status: 'verified'
    };

    if (category) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }

    // Get leaderboard
    const leaderboard = await Vote.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            nominee: '$nominee',
            category: '$category'
          },
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' },
          averageVoteValue: { $avg: '$amount' },
          lastVoteAt: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'nominees',
          localField: '_id.nominee',
          foreignField: '_id',
          as: 'nominee'
        }
      },
      {
        $unwind: '$nominee'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'nominee.student',
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
          localField: '_id.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          nominee: {
            _id: '$nominee._id',
            reason: '$nominee.reason',
            achievements: '$nominee.achievements'
          },
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
          totalVotes: 1,
          totalRevenue: 1,
          uniqueVoters: { $size: '$uniqueVoters' },
          averageVoteValue: { $round: ['$averageVoteValue', 2] },
          lastVoteAt: 1
        }
      },
      {
        $sort: { totalVotes: -1, totalRevenue: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Add ranking
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        totalEntries: leaderboard.length
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * @route   GET /api/votes/stats
 * @desc    Get general voting statistics
 * @access  Public
 */
router.get('/stats', [
  [
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Category must be a valid ID')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category } = req.query;
    const matchCondition = { status: 'verified' };
    
    if (category) {
      matchCondition.category = new mongoose.Types.ObjectId(category);
    }

    // Get overall statistics
    const [totalStats, categoryStats, nomineeStats] = await Promise.all([
      // Total votes and revenue
      Vote.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalVotes: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            uniqueVoters: { $addToSet: '$voter' },
            averageVoteValue: { $avg: '$amount' }
          }
        }
      ]),

      // Category-wise statistics
      Vote.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$category',
            totalVotes: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            uniqueVoters: { $addToSet: '$voter' }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $project: {
            categoryId: '$_id',
            categoryName: '$category.name',
            totalVotes: 1,
            totalRevenue: 1,
            uniqueVoters: { $size: '$uniqueVoters' }
          }
        }
      ]),

      // Nominee-wise vote counts
      Vote.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$nominee',
            voteCount: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Format nominee votes as an object for easy lookup
    const nomineeVotes = {};
    nomineeStats.forEach(stat => {
      nomineeVotes[stat._id.toString()] = stat.voteCount;
    });

    const stats = totalStats[0] || {
      totalVotes: 0,
      totalRevenue: 0,
      uniqueVoters: [],
      averageVoteValue: 0
    };

    res.json({
      success: true,
      data: {
        totalVotes: stats.totalVotes,
        totalRevenue: stats.totalRevenue,
        uniqueVoters: stats.uniqueVoters.length,
        averageVoteValue: stats.averageVoteValue || 0,
        categoryStats,
        nomineeVotes
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting statistics'
    });
  }
});

/**
 * @route   GET /api/votes/stats/admin
 * @desc    Get comprehensive voting statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats/admin', [
  auth,
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date')
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

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get overall statistics
    const overallStats = await Vote.aggregate([
      { $match: { status: 'verified', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' },
          uniqueNominees: { $addToSet: '$nominee' },
          uniqueCategories: { $addToSet: '$category' },
          averageVoteValue: { $avg: '$amount' }
        }
      }
    ]);

    // Get statistics by category
    const categoryStats = await Vote.aggregate([
      { $match: { status: 'verified', ...dateFilter } },
      {
        $group: {
          _id: '$category',
          totalVotes: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' },
          uniqueNominees: { $addToSet: '$nominee' },
          averageVoteValue: { $avg: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          category: {
            _id: '$category._id',
            name: '$category.name',
            icon: '$category.icon'
          },
          totalVotes: 1,
          totalRevenue: 1,
          uniqueVoters: { $size: '$uniqueVoters' },
          uniqueNominees: { $size: '$uniqueNominees' },
          averageVoteValue: { $round: ['$averageVoteValue', 2] }
        }
      },
      {
        $sort: { totalVotes: -1 }
      }
    ]);

    // Get votes over time
    const votesOverTime = await Vote.aggregate([
      { $match: { status: 'verified', ...dateFilter } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          votes: { $sum: 1 },
          revenue: { $sum: '$amount' },
          uniqueVoters: { $addToSet: '$voter' }
        }
      },
      {
        $project: {
          date: '$_id',
          votes: 1,
          revenue: 1,
          uniqueVoters: { $size: '$uniqueVoters' }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    const stats = overallStats.length > 0 ? {
      totalVotes: overallStats[0].totalVotes,
      totalRevenue: overallStats[0].totalRevenue,
      uniqueVoters: overallStats[0].uniqueVoters.length,
      uniqueNominees: overallStats[0].uniqueNominees.length,
      uniqueCategories: overallStats[0].uniqueCategories.length,
      averageVoteValue: Math.round(overallStats[0].averageVoteValue * 100) / 100
    } : {
      totalVotes: 0,
      totalRevenue: 0,
      uniqueVoters: 0,
      uniqueNominees: 0,
      uniqueCategories: 0,
      averageVoteValue: 0
    };

    res.json({
      success: true,
      data: {
        overall: stats,
        byCategory: categoryStats,
        overTime: votesOverTime
      }
    });

  } catch (error) {
    console.error('Admin vote stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting statistics'
    });
  }
});

module.exports = router;