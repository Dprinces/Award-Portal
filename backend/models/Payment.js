const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [50, 'Payment amount must be at least ₦50']
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  gateway: {
    type: String,
    enum: ['paystack', 'flutterwave', 'bank_transfer'],
    required: [true, 'Payment gateway is required']
  },
  gatewayReference: {
    type: String,
    required: [true, 'Gateway reference is required'],
    unique: true
  },
  internalReference: {
    type: String,
    required: [true, 'Internal reference is required'],
    unique: true
  },
  authorizationUrl: {
    type: String
  },
  accessCode: {
    type: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
  },
  channel: {
    type: String
  },
  cardDetails: {
    last4: String,
    expMonth: String,
    expYear: String,
    brand: String,
    bank: String,
    cardType: String,
    countryCode: String
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    bankCode: String
  },
  customerDetails: {
    email: {
      type: String,
      required: true
    },
    firstName: String,
    lastName: String,
    phone: String
  },
  fees: {
    gatewayFee: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  netAmount: {
    type: Number,
    required: true
  },
  paidAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  refundDetails: {
    refundedAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: String,
    refundReference: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    purpose: {
      type: String,
      default: 'vote_payment'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    nominee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nominee'
    },
    ipAddress: String,
    userAgent: String,
    source: String,
    customFields: mongoose.Schema.Types.Mixed
  },
  webhookData: {
    received: {
      type: Boolean,
      default: false
    },
    receivedAt: Date,
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: Date,
    verified: {
      type: Boolean,
      default: false
    },
    signature: String,
    rawData: mongoose.Schema.Types.Mixed
  },
  reconciliation: {
    isReconciled: {
      type: Boolean,
      default: false
    },
    reconciledAt: Date,
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    discrepancies: [String]
  },
  fraudCheck: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    checkedAt: Date,
    checkedBy: String
  },
  retryAttempts: {
    type: Number,
    default: 0,
    max: 3
  },
  lastRetryAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ gatewayReference: 1 }, { unique: true });
paymentSchema.index({ internalReference: 1 }, { unique: true });
paymentSchema.index({ status: 1, gateway: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
paymentSchema.index({ 'metadata.category': 1, status: 1 });
paymentSchema.index({ 'fraudCheck.isFlagged': 1, 'fraudCheck.score': -1 });

// Pre-save middleware to calculate net amount
paymentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('fees')) {
    this.fees.totalFees = this.fees.gatewayFee + this.fees.platformFee;
    this.netAmount = this.amount - this.fees.totalFees;
  }
  next();
});

// Pre-save middleware to set payment timestamps
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'success' && !this.paidAt) {
      this.paidAt = new Date();
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = new Date();
    }
  }
  next();
});

// Virtual for checking if payment is expired
paymentSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for payment age in minutes
paymentSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60));
});

// Virtual for checking if payment is successful
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'success' && this.webhookData.verified;
});

// Method to mark payment as successful
paymentSchema.methods.markAsSuccessful = async function(gatewayData = {}) {
  this.status = 'success';
  this.paidAt = new Date();
  this.gatewayResponse = { ...this.gatewayResponse, ...gatewayData };
  
  // Extract payment method and channel from gateway data
  if (gatewayData.channel) {
    this.channel = gatewayData.channel;
  }
  if (gatewayData.authorization && gatewayData.authorization.channel) {
    this.paymentMethod = gatewayData.authorization.channel;
  }
  
  await this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = async function(reason, gatewayData = {}) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.gatewayResponse = { ...this.gatewayResponse, ...gatewayData };
  await this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(amount, reason, refundedBy) {
  this.status = 'refunded';
  this.refundDetails = {
    refundedAt: new Date(),
    refundAmount: amount || this.amount,
    refundReason: reason,
    refundedBy: refundedBy
  };
  await this.save();
};

// Method to update webhook data
paymentSchema.methods.updateWebhookData = async function(webhookPayload, signature) {
  this.webhookData.received = true;
  this.webhookData.receivedAt = new Date();
  this.webhookData.attempts += 1;
  this.webhookData.lastAttemptAt = new Date();
  this.webhookData.signature = signature;
  this.webhookData.rawData = webhookPayload;
  await this.save();
};

// Static method to generate internal reference
paymentSchema.statics.generateInternalReference = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `EKSU_${timestamp}_${random}`.toUpperCase();
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {
    status: 'success',
    ...filters
  };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalFees: { $sum: '$fees.totalFees' },
        averageAmount: { $avg: '$amount' },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        _id: 0,
        totalPayments: 1,
        totalAmount: 1,
        totalNetAmount: 1,
        totalFees: 1,
        averageAmount: { $round: ['$averageAmount', 2] },
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    totalNetAmount: 0,
    totalFees: 0,
    averageAmount: 0,
    uniqueUsers: 0
  };
};

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive information from JSON output
    delete ret.gatewayResponse;
    delete ret.webhookData.rawData;
    delete ret.webhookData.signature;
    return ret;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);