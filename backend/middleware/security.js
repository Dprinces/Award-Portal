const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Vote = require('../models/Vote');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Vote-specific rate limiting
const voteRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 vote attempts per minute
  message: {
    success: false,
    message: 'Too many vote attempts. Please wait before voting again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use combination of IP and user ID for more precise limiting
    return `${req.ip}-${req.user?.id || 'anonymous'}`;
  }
});

// Payment-specific rate limiting
const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 payment attempts per minute
  message: {
    success: false,
    message: 'Too many payment attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Prevent duplicate votes middleware
const preventDuplicateVotes = async (req, res, next) => {
  try {
    const { nomineeId } = req.body;
    const userId = req.user.id;

    // Check if user has already voted for this nominee
    const existingVote = await Vote.findOne({
      user: userId,
      nominee: nomineeId,
      status: 'completed'
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this nominee'
      });
    }

    // Check for pending payments for the same nominee
    const pendingPayment = await Payment.findOne({
      user: userId,
      nominee: nomineeId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // 15 minutes
    });

    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        message: 'You have a pending payment for this nominee. Please complete or cancel it first.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in preventDuplicateVotes middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking vote eligibility'
    });
  }
};

// IP and device tracking middleware
const trackVoteAttempt = async (req, res, next) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;
    const userId = req.user?.id;

    // Log vote attempt for security monitoring
    console.log('Vote attempt:', {
      userId,
      ip,
      userAgent: userAgent.substring(0, 200), // Limit length
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl
    });

    // Check for suspicious patterns (multiple IPs for same user)
    if (userId) {
      const recentVotes = await Vote.find({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).select('ipAddress');

      const uniqueIPs = [...new Set(recentVotes.map(vote => vote.ipAddress))];
      
      if (uniqueIPs.length > 3) {
        console.warn('Suspicious activity detected:', {
          userId,
          uniqueIPs: uniqueIPs.length,
          currentIP: ip
        });
        
        // Don't block immediately, but flag for review
        req.suspiciousActivity = true;
      }
    }

    // Add tracking data to request
    req.trackingData = {
      ip,
      userAgent,
      timestamp: new Date()
    };

    next();
  } catch (error) {
    console.error('Error in trackVoteAttempt middleware:', error);
    next(); // Continue even if tracking fails
  }
};

// Validate vote amount middleware
const validateVoteAmount = (req, res, next) => {
  const { amount } = req.body;
  const minAmount = parseInt(process.env.MIN_VOTE_AMOUNT) || 100;
  const maxAmount = parseInt(process.env.MAX_VOTE_AMOUNT) || 1000000; // Increased to ₦1,000,000

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Valid vote amount is required'
    });
  }

  if (amount < minAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum vote amount is ₦${minAmount}`
    });
  }

  if (amount > maxAmount) {
    return res.status(400).json({
      success: false,
      message: `Maximum vote amount is ₦${maxAmount.toLocaleString()}`
    });
  }

  // Ensure amount is in valid increments (multiples of 50)
  if (amount % 50 !== 0) {
    return res.status(400).json({
      success: false,
      message: 'Vote amount must be in multiples of ₦50'
    });
  }

  next();
};

// Check voting period middleware
const checkVotingPeriod = async (req, res, next) => {
  try {
    const { nomineeId } = req.body;
    
    // Get the nominee and their category
    const nominee = await mongoose.model('Nominee').findById(nomineeId).populate('category');
    
    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
    }

    const category = nominee.category;
    const now = new Date();

    // Check if voting is active for this category
    if (!category.votingActive) {
      return res.status(400).json({
        success: false,
        message: 'Voting is not currently active for this category'
      });
    }

    // Check voting start date
    if (category.votingStartDate && now < category.votingStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Voting has not started yet for this category'
      });
    }

    // Check voting end date
    if (category.votingEndDate && now > category.votingEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Voting has ended for this category'
      });
    }

    // Check if nominee is approved
    if (nominee.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This nominee is not available for voting'
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkVotingPeriod middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating voting period'
    });
  }
};

// Sanitize input middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potential script tags or malicious content
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Verify user eligibility middleware
const verifyUserEligibility = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before voting'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

    // Check if user is a student (has student ID)
    if (!user.studentId) {
      return res.status(403).json({
        success: false,
        message: 'Only verified students can vote'
      });
    }

    next();
  } catch (error) {
    console.error('Error in verifyUserEligibility middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user eligibility'
    });
  }
};

// Request signature validation for webhooks
const validateWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-paystack-signature'];
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized webhook request'
    });
  }
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(401).json({
      success: false,
      message: 'Invalid webhook signature'
    });
  }
  
  next();
};

// Anti-fraud detection middleware
const antifraudDetection = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!userId) {
      return next();
    }
    
    // Check for suspicious voting patterns
    if (req.path.includes('/vote') || req.path.includes('/payment')) {
      const recentVotes = await Vote.find({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });
      
      // Flag if user has voted more than 20 times in 24 hours
      if (recentVotes.length > 20) {
        console.warn(`Suspicious voting activity detected for user ${userId}: ${recentVotes.length} votes in 24 hours`);
        return res.status(429).json({
          success: false,
          message: 'Voting limit exceeded. Please contact support if you believe this is an error.'
        });
      }
      
      // Check for rapid successive votes (less than 30 seconds apart)
      const lastVote = await Vote.findOne({ user: userId }).sort({ createdAt: -1 });
      if (lastVote && (Date.now() - lastVote.createdAt.getTime()) < 30000) {
        return res.status(429).json({
          success: false,
          message: 'Please wait at least 30 seconds between votes.'
        });
      }
    }
    
    // Log suspicious activity
    const suspiciousIndicators = [];
    
    // Check for unusual user agent
    if (!userAgent || userAgent.length < 10) {
      suspiciousIndicators.push('unusual_user_agent');
    }
    
    // Check for rapid requests from same IP
    const recentRequests = await Payment.find({
      'metadata.ip': ip,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });
    
    if (recentRequests.length > 10) {
      suspiciousIndicators.push('rapid_requests');
    }
    
    if (suspiciousIndicators.length > 0) {
      console.warn(`Suspicious activity detected:`, {
        userId,
        ip,
        indicators: suspiciousIndicators,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  } catch (error) {
    console.error('Anti-fraud detection error:', error);
    next(); // Continue even if fraud detection fails
  }
};

// Content Security Policy headers
const setSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// IP whitelist for admin operations (optional)
const adminIPWhitelist = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
    const clientIP = req.ip;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      console.warn(`Unauthorized admin access attempt from IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
  }
  next();
};

module.exports = {
  voteRateLimit,
  paymentRateLimit,
  preventDuplicateVotes,
  trackVoteAttempt,
  validateVoteAmount,
  checkVotingPeriod,
  sanitizeInput,
  verifyUserEligibility,
  validateWebhookSignature,
  antifraudDetection,
  setSecurityHeaders,
  adminIPWhitelist
};