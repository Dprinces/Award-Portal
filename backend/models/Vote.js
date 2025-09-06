const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Voter reference is required']
  },
  nominee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nominee',
    required: [true, 'Nominee reference is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category reference is required']
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: [true, 'Payment reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Vote amount is required'],
    min: [50, 'Vote amount must be at least ₦50']
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['paystack', 'flutterwave', 'bank_transfer', 'card', 'ussd', 'bank'],
    required: [true, 'Payment method is required']
  },
  transactionReference: {
    type: String,
    required: [true, 'Transaction reference is required'],
    unique: true
  },
  paymentReference: {
    type: String,
    required: [true, 'Payment reference is required']
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required']
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required']
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'mobile'
    },
    browser: String,
    os: String,
    fingerprint: String
  },
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verificationMethod: {
    type: String,
    enum: ['webhook', 'manual', 'api_check']
  },
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  refundReason: {
    type: String,
    maxlength: [500, 'Refund reason cannot exceed 500 characters']
  },
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  processingFee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  metadata: {
    campaignSource: String,
    referrer: String,
    customFields: mongoose.Schema.Types.Mixed
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    maxlength: [200, 'Flag reason cannot exceed 200 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
voteSchema.index({ voter: 1, nominee: 1, createdAt: -1 });
voteSchema.index({ category: 1, status: 1, createdAt: -1 });
voteSchema.index({ nominee: 1, status: 1 });
voteSchema.index({ payment: 1 });
voteSchema.index({ transactionReference: 1 }, { unique: true });
voteSchema.index({ status: 1, isVerified: 1 });
voteSchema.index({ createdAt: -1 });
voteSchema.index({ isFlagged: 1, fraudScore: -1 });

// Pre-save middleware to calculate net amount
voteSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('processingFee')) {
    this.netAmount = this.amount - this.processingFee;
  }
  next();
});

// Pre-save middleware to set verification timestamp
voteSchema.pre('save', function(next) {
  if (this.isModified('isVerified') && this.isVerified && !this.verifiedAt) {
    this.verifiedAt = new Date();
  }
  next();
});

// Virtual for checking if vote is valid
voteSchema.virtual('isValid').get(function() {
  return this.status === 'confirmed' && this.isVerified && !this.isFlagged;
});

// Virtual for vote age in hours
voteSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Method to mark vote as verified
voteSchema.methods.markAsVerified = async function(method = 'webhook') {
  this.isVerified = true;
  this.verifiedAt = new Date();
  this.verificationMethod = method;
  this.status = 'confirmed';
  await this.save();
};

// Method to flag vote as suspicious
voteSchema.methods.flagAsSuspicious = async function(reason, score = 75) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.fraudScore = score;
  await this.save();
};

// Static method to get vote statistics for a nominee
voteSchema.statics.getStatisticsForNominee = async function(nomineeId) {
  const stats = await this.aggregate([
    {
      $match: {
        nominee: mongoose.Types.ObjectId(nomineeId),
        status: 'confirmed',
        isVerified: true,
        isFlagged: false
      }
    },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        uniqueVoters: { $addToSet: '$voter' },
        lastVoteAt: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0,
        totalVotes: 1,
        totalAmount: 1,
        averageAmount: { $round: ['$averageAmount', 2] },
        uniqueVoters: { $size: '$uniqueVoters' },
        lastVoteAt: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalVotes: 0,
    totalAmount: 0,
    averageAmount: 0,
    uniqueVoters: 0,
    lastVoteAt: null
  };
};

// Static method to get vote statistics for a category
voteSchema.statics.getStatisticsForCategory = async function(categoryId) {
  const stats = await this.aggregate([
    {
      $match: {
        category: mongoose.Types.ObjectId(categoryId),
        status: 'confirmed',
        isVerified: true,
        isFlagged: false
      }
    },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        uniqueVoters: { $addToSet: '$voter' },
        uniqueNominees: { $addToSet: '$nominee' }
      }
    },
    {
      $project: {
        _id: 0,
        totalVotes: 1,
        totalAmount: 1,
        uniqueVoters: { $size: '$uniqueVoters' },
        uniqueNominees: { $size: '$uniqueNominees' }
      }
    }
  ]);
  
  return stats[0] || {
    totalVotes: 0,
    totalAmount: 0,
    uniqueVoters: 0,
    uniqueNominees: 0
  };
};

// Ensure virtual fields are serialized
voteSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive information from JSON output
    delete ret.gatewayResponse;
    delete ret.ipAddress;
    delete ret.userAgent;
    delete ret.deviceInfo;
    return ret;
  }
});

module.exports = mongoose.model('Vote', voteSchema);