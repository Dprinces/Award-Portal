const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for request ID (for tracking)
morgan.token('request-id', (req) => {
  return req.id || 'unknown';
});

// Custom token for response time in a more readable format
morgan.token('response-time-formatted', (req, res) => {
  const responseTime = morgan['response-time'](req, res);
  return responseTime ? `${responseTime}ms` : 'unknown';
});

// Security events logger
class SecurityLogger {
  constructor() {
    this.securityLogFile = path.join(logsDir, 'security.log');
    this.errorLogFile = path.join(logsDir, 'error.log');
    this.accessLogFile = path.join(logsDir, 'access.log');
  }

  log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata
    };

    const logString = JSON.stringify(logEntry) + '\n';

    // Write to appropriate log file
    let logFile;
    switch (level) {
      case 'security':
        logFile = this.securityLogFile;
        break;
      case 'error':
        logFile = this.errorLogFile;
        break;
      default:
        logFile = this.accessLogFile;
    }

    fs.appendFile(logFile, logString, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, metadata);
    }
  }

  logSecurityEvent(event, req, additionalData = {}) {
    this.log('security', event, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.originalUrl,
      method: req.method,
      ...additionalData
    });
  }

  logError(error, req, additionalData = {}) {
    this.log('error', error.message, {
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.originalUrl,
      method: req.method,
      ...additionalData
    });
  }

  logAccess(message, req, additionalData = {}) {
    this.log('access', message, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.originalUrl,
      method: req.method,
      ...additionalData
    });
  }
}

const securityLogger = new SecurityLogger();

// Request ID middleware
const addRequestId = (req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Security event logging middleware
const logSecurityEvents = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log failed authentication attempts
    if (res.statusCode === 401) {
      securityLogger.logSecurityEvent('Authentication failed', req, {
        statusCode: res.statusCode
      });
    }
    
    // Log authorization failures
    if (res.statusCode === 403) {
      securityLogger.logSecurityEvent('Authorization failed', req, {
        statusCode: res.statusCode
      });
    }
    
    // Log rate limit violations
    if (res.statusCode === 429) {
      securityLogger.logSecurityEvent('Rate limit exceeded', req, {
        statusCode: res.statusCode
      });
    }
    
    // Log suspicious activity (multiple failed attempts)
    if (req.suspiciousActivity) {
      securityLogger.logSecurityEvent('Suspicious activity detected', req, {
        reason: 'Multiple IP addresses for same user'
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Vote activity logging middleware
const logVoteActivity = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log successful votes
    if (req.originalUrl.includes('/votes') && req.method === 'POST' && res.statusCode === 201) {
      securityLogger.logAccess('Vote cast successfully', req, {
        nomineeId: req.body.nomineeId,
        amount: req.body.amount,
        statusCode: res.statusCode
      });
    }
    
    // Log payment attempts
    if (req.originalUrl.includes('/payments') && req.method === 'POST') {
      securityLogger.logAccess('Payment initiated', req, {
        nomineeId: req.body.nomineeId,
        amount: req.body.amount,
        statusCode: res.statusCode
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Admin activity logging middleware
const logAdminActivity = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    const originalSend = res.send;
    
    res.send = function(data) {
      securityLogger.logAccess('Admin action performed', req, {
        action: `${req.method} ${req.originalUrl}`,
        statusCode: res.statusCode,
        adminId: req.user.id
      });
      
      return originalSend.call(this, data);
    };
  }
  
  next();
};

// Morgan configuration for different environments
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

const morganFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : ':method :url :status :res[content-length] - :response-time ms :user-id';

const morganLogger = morgan(morganFormat, {
  stream: process.env.NODE_ENV === 'production' ? accessLogStream : process.stdout,
  skip: (req, res) => {
    // Skip logging for health checks in production
    return process.env.NODE_ENV === 'production' && req.originalUrl === '/health';
  }
});

// Error logging middleware
const logErrors = (err, req, res, next) => {
  securityLogger.logError(err, req);
  next(err);
};

// Log rotation utility
const rotateLogFiles = () => {
  const logFiles = ['access.log', 'error.log', 'security.log'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  logFiles.forEach(filename => {
    const filepath = path.join(logsDir, filename);
    
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      
      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().split('T')[0];
        const rotatedFilename = `${filename}.${timestamp}`;
        const rotatedFilepath = path.join(logsDir, rotatedFilename);
        
        fs.renameSync(filepath, rotatedFilepath);
        console.log(`Log file rotated: ${filename} -> ${rotatedFilename}`);
      }
    }
  });
};

// Schedule log rotation (run daily)
if (process.env.NODE_ENV === 'production') {
  setInterval(rotateLogFiles, 24 * 60 * 60 * 1000); // 24 hours
}

module.exports = {
  securityLogger,
  addRequestId,
  logSecurityEvents,
  logVoteActivity,
  logAdminActivity,
  morganLogger,
  logErrors,
  rotateLogFiles
};