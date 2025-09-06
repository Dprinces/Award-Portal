const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { logAdminActivity } = require('../middleware/logging');
const User = require('../models/User');
const Category = require('../models/Category');
const Nominee = require('../models/Nominee');
const Vote = require('../models/Vote');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// Apply authentication and admin authorization to all routes
router.use(auth);
router.use(adminAuth);
router.use(logAdminActivity);

// @desc    Get nominees for admin management
// @route   GET /api/admin/nominees
// @access  Private/Admin
router.get('/nominees', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'pending',
      category,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build match conditions
    const matchConditions = {};
    if (status && status !== 'all') {
      matchConditions.status = status;
    }
    if (category) {
      matchConditions.category = new mongoose.Types.ObjectId(category);
    }

    // Build aggregation pipeline
    let pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'users',
          localField: 'nominatedBy',
          foreignField: '_id',
          as: 'nominatedBy'
        }
      },
      { $unwind: '$nominatedBy' }
    ];

    // Add search conditions if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'student.firstName': { $regex: search, $options: 'i' } },
            { 'student.lastName': { $regex: search, $options: 'i' } },
            { reason: { $regex: search, $options: 'i' } },
            { 'category.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Nominee.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination and sorting
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          reason: 1,
          achievements: 1,
          campaignStatement: 1,
          socialMediaLinks: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          student: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            profilePicture: 1,
            academicDetails: 1
          },
          category: {
            _id: 1,
            name: 1,
            description: 1,
            icon: 1,
            color: 1
          },
          nominatedBy: {
            _id: 1,
            firstName: 1,
            lastName: 1
          }
        }
      }
    );

    const nominees = await Nominee.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        nominees,
        totalCount,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          total: totalCount,
          hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Admin get nominees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominees'
    });
  }
});

// @desc    Approve nominee
// @route   PATCH /api/admin/nominees/:id/approve
// @access  Private/Admin
router.patch('/nominees/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

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
      message: 'Nominee approved successfully',
      data: { nominee }
    });

  } catch (error) {
    console.error('Admin approve nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve nominee'
    });
  }
});

// @desc    Reject nominee
// @route   PATCH /api/admin/nominees/:id/reject
// @access  Private/Admin
router.patch('/nominees/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

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
      message: 'Nominee rejected successfully',
      data: { nominee }
    });

  } catch (error) {
    console.error('Admin reject nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject nominee'
    });
  }
});

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get current date for time-based queries
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for better performance
    const [stats, recentActivity, topCategories, systemAlerts] = await Promise.all([
      // Basic statistics
      Promise.all([
        User.countDocuments({ role: 'student' }),
        Category.countDocuments(),
        Nominee.countDocuments(),
        Vote.countDocuments(),
        Payment.aggregate([
          { $match: { status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Nominee.countDocuments({ status: 'pending' }),
        // Growth statistics
        User.countDocuments({ role: 'student', createdAt: { $gte: lastMonth } }),
        Category.countDocuments({ createdAt: { $gte: lastMonth } }),
        Nominee.countDocuments({ createdAt: { $gte: lastMonth } }),
        Vote.countDocuments({ createdAt: { $gte: lastMonth } }),
        Payment.aggregate([
          { 
            $match: { 
              status: 'success', 
              createdAt: { $gte: lastMonth } 
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]),

      // Recent activity (last 10 activities)
      Promise.all([
        Vote.find()
          .populate('user', 'firstName lastName')
          .populate('nominee', 'student')
          .populate('category', 'name')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Nominee.find({ status: { $in: ['approved', 'rejected'] } })
          .populate('student', 'firstName lastName')
          .populate('category', 'name')
          .sort({ updatedAt: -1 })
          .limit(5)
          .lean()
      ]),

      // Top categories by vote count
      Vote.aggregate([
        {
          $group: {
            _id: '$category',
            voteCount: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
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
            _id: '$category._id',
            name: '$category.name',
            voteCount: 1,
            totalAmount: 1
          }
        },
        { $sort: { voteCount: -1 } },
        { $limit: 5 }
      ]),

      // System alerts
      generateSystemAlerts()
    ]);

    const [
      totalUsers, totalCategories, totalNominees, totalVotes, 
      revenueResult, pendingNominees, newUsers, newCategories, 
      newNominees, newVotes, newRevenueResult
    ] = stats;

    const [recentVotes, recentNominees] = recentActivity;

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalRevenue = revenueResult[0]?.total || 0;
    const newRevenue = newRevenueResult[0]?.total || 0;
    const previousRevenue = totalRevenue - newRevenue;

    // Format recent activity
    const formattedActivity = [
      ...recentVotes.map(vote => ({
        action: `${vote.user?.firstName} ${vote.user?.lastName} voted for ${vote.nominee?.student?.firstName} ${vote.nominee?.student?.lastName}`,
        user: `${vote.user?.firstName} ${vote.user?.lastName}`,
        timestamp: vote.createdAt,
        type: 'vote'
      })),
      ...recentNominees.map(nominee => ({
        action: `${nominee.student?.firstName} ${nominee.student?.lastName} was ${nominee.status} for ${nominee.category?.name}`,
        user: 'Admin',
        timestamp: nominee.updatedAt,
        type: 'nominee'
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCategories,
          totalNominees,
          totalVotes,
          totalRevenue,
          pendingNominees,
          userGrowth: calculateGrowth(totalUsers, totalUsers - newUsers),
          categoryGrowth: calculateGrowth(totalCategories, totalCategories - newCategories),
          nomineeGrowth: calculateGrowth(totalNominees, totalNominees - newNominees),
          voteGrowth: calculateGrowth(totalVotes, totalVotes - newVotes),
          revenueGrowth: calculateGrowth(totalRevenue, previousRevenue)
        },
        recentActivity: formattedActivity,
        topCategories,
        systemAlerts
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment analytics
// @route   GET /api/admin/payments
// @access  Private/Admin
router.get('/payments', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [payments, total, analytics] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('vote')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        analytics,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res, next) => {
  try {
    const period = req.query.period || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Promise.all([
      // Daily vote counts
      Vote.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Category performance
      Vote.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$category',
            voteCount: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
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
            name: '$category.name',
            voteCount: 1,
            totalRevenue: 1
          }
        },
        { $sort: { voteCount: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyVotes: stats[0],
        categoryPerformance: stats[1]
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate system alerts
async function generateSystemAlerts() {
  const alerts = [];
  
  try {
    // Check for pending nominees
    const pendingCount = await Nominee.countDocuments({ status: 'pending' });
    if (pendingCount > 0) {
      alerts.push({
        severity: 'warning',
        message: `${pendingCount} nominee${pendingCount > 1 ? 's' : ''} pending approval`
      });
    }

    // Check for failed payments in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedPayments = await Payment.countDocuments({
      status: 'failed',
      createdAt: { $gte: yesterday }
    });
    if (failedPayments > 0) {
      alerts.push({
        severity: 'error',
        message: `${failedPayments} payment${failedPayments > 1 ? 's' : ''} failed in the last 24 hours`
      });
    }

    // Check for categories with no nominees
    const categoriesWithoutNominees = await Category.aggregate([
      {
        $lookup: {
          from: 'nominees',
          localField: '_id',
          foreignField: 'category',
          as: 'nominees'
        }
      },
      {
        $match: {
          nominees: { $size: 0 },
          votingActive: true
        }
      },
      { $count: 'count' }
    ]);
    
    const emptyCategories = categoriesWithoutNominees[0]?.count || 0;
    if (emptyCategories > 0) {
      alerts.push({
        severity: 'info',
        message: `${emptyCategories} active categor${emptyCategories > 1 ? 'ies have' : 'y has'} no nominees`
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error generating system alerts:', error);
    return [];
  }
}

module.exports = router;