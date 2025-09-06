const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category reference is required']
  },
  nominatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Nominator reference is required']
  },
  nominationReason: {
    type: String,
    required: [true, 'Nomination reason is required'],
    maxlength: [1000, 'Nomination reason cannot exceed 1000 characters']
  },
  achievements: [{
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Achievement title cannot exceed 200 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Achievement description cannot exceed 500 characters']
    },
    date: {
      type: Date
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  supportingDocuments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'pdf', 'document'],
      required: true
    },
    size: {
      type: Number
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  campaignStatement: {
    type: String,
    maxlength: [2000, 'Campaign statement cannot exceed 2000 characters']
  },
  socialMedia: {
    instagram: {
      type: String,
      match: [/^@?[a-zA-Z0-9._]+$/, 'Please provide a valid Instagram username']
    },
    twitter: {
      type: String,
      match: [/^@?[a-zA-Z0-9_]+$/, 'Please provide a valid Twitter username']
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    }
  },
  statistics: {
    totalVotes: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    uniqueVoters: {
      type: Number,
      default: 0
    },
    averageVoteValue: {
      type: Number,
      default: 0
    },
    lastVoteAt: {
      type: Date
    },
    rank: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  endorsements: [{
    endorser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Endorsement message cannot exceed 500 characters']
    },
    title: {
      type: String,
      maxlength: [100, 'Endorser title cannot exceed 100 characters']
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  disqualificationReason: {
    type: String,
    maxlength: [500, 'Disqualification reason cannot exceed 500 characters']
  },
  isDisqualified: {
    type: Boolean,
    default: false
  },
  disqualifiedAt: {
    type: Date
  },
  disqualifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
nomineeSchema.index({ category: 1, status: 1 });
nomineeSchema.index({ student: 1, category: 1 }, { unique: true }); // Prevent duplicate nominations
nomineeSchema.index({ status: 1, isActive: 1 });
nomineeSchema.index({ 'statistics.totalVotes': -1 });
nomineeSchema.index({ 'statistics.rank': 1 });
nomineeSchema.index({ isFeatured: 1, displayOrder: 1 });

// Pre-save middleware to update approval timestamp
nomineeSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

// Virtual for checking if nominee is eligible for voting
nomineeSchema.virtual('isEligibleForVoting').get(function() {
  return this.status === 'approved' && 
         this.isActive && 
         !this.isDisqualified;
});

// Virtual for vote percentage (requires category total votes)
nomineeSchema.virtual('votePercentage').get(function() {
  if (!this.populated('category') || !this.category.statistics.totalVotes) {
    return 0;
  }
  return ((this.statistics.totalVotes / this.category.statistics.totalVotes) * 100).toFixed(2);
});

// Method to calculate average vote value
nomineeSchema.methods.calculateAverageVoteValue = function() {
  if (this.statistics.totalVotes === 0) {
    return 0;
  }
  return (this.statistics.totalRevenue / this.statistics.totalVotes).toFixed(2);
};

// Method to update statistics
nomineeSchema.methods.updateStatistics = async function(voteAmount, isNewVoter = false) {
  this.statistics.totalVotes += 1;
  this.statistics.totalRevenue += voteAmount;
  this.statistics.lastVoteAt = new Date();
  
  if (isNewVoter) {
    this.statistics.uniqueVoters += 1;
  }
  
  this.statistics.averageVoteValue = this.calculateAverageVoteValue();
  
  await this.save();
};

// Ensure virtual fields are serialized
nomineeSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Nominee', nomineeSchema);