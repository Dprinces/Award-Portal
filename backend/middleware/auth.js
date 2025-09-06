const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token is not valid, user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account has been deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error in authentication' 
    });
  }
};

// Check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error in admin authentication' 
    });
  }
};

// Check if user is a verified student
const studentAuth = async (req, res, next) => {
  try {
    if (!req.user.isStudent) {
      return res.status(403).json({ 
        message: 'Access denied. Student privileges required.' 
      });
    }
    
    if (!req.user.isVerified) {
      return res.status(403).json({ 
        message: 'Account not verified. Please verify your student status.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Student auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error in student authentication' 
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOpAuth = async (req, res, next) => {
  try {
    // Check if user has made too many requests recently
    const recentActions = await User.findById(req.user.id)
      .select('lastLogin totalVotesCast')
      .lean();
    
    // Add custom rate limiting logic here if needed
    next();
  } catch (error) {
    console.error('Sensitive operation auth error:', error);
    res.status(500).json({ 
      message: 'Server error in sensitive operation authentication' 
    });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify token without middleware (for utilities)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  auth,
  adminAuth,
  studentAuth,
  optionalAuth,
  sensitiveOpAuth,
  generateToken,
  verifyToken
};