const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  icon: {
    type: String,
    default: 'trophy'
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowSelfNomination: {
    type: Boolean,
    default: true
  },
  maxNominees: {
    type: Number,
    default: 50,
    min: [1, 'Maximum nominees must be at least 1'],
    max: [200, 'Maximum nominees cannot exceed 200']
  },
  eligibilityCriteria: {
    faculties: [{
      type: String,
      enum: [
        'Science',
        'Arts',
        'Social Sciences',
        'Education',
        'Management Sciences',
        'Law',
        'Medicine',
        'Engineering',
        'Agriculture'
      ]
    }],
    departments: [{
      type: String
    }],
    levels: [{
      type: String,
      enum: ['100', '200', '300', '400', '500']
    }],
    minLevel: {
      type: String,
      enum: ['100', '200', '300', '400', '500'],
      default: '100'
    },
    maxLevel: {
      type: String,
      enum: ['100', '200', '300', '400', '500'],
      default: '500'
    }
  },
  votingSettings: {
    startDate: {
      type: Date,
      required: [true, 'Voting start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Voting end date is required']
    },
    votePrice: {
      type: Number,
      required: [true, 'Vote price is required'],
      min: [50, 'Vote price must be at least ₦50'],
      max: [1000, 'Vote price cannot exceed ₦1000'],
      default: 100
    },
    maxVotesPerUser: {
      type: Number,
      default: null // null means unlimited
    },
    requirePayment: {
      type: Boolean,
      default: true
    }
  },
  statistics: {
    totalNominees: {
      type: Number,
      default: 0
    },
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
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  bannerImage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Validate voting dates
categorySchema.pre('save', function(next) {
  if (this.votingSettings.endDate <= this.votingSettings.startDate) {
    next(new Error('Voting end date must be after start date'));
  }
  next();
});

// Index for better query performance
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ featured: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ 'votingSettings.startDate': 1, 'votingSettings.endDate': 1 });

// Virtual for checking if voting is active
categorySchema.virtual('isVotingActive').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.votingSettings.startDate && 
         now <= this.votingSettings.endDate;
});

// Virtual for checking if nominations are open
categorySchema.virtual('isNominationOpen').get(function() {
  const now = new Date();
  const nominationDeadline = new Date(this.votingSettings.startDate);
  nominationDeadline.setDate(nominationDeadline.getDate() - 7); // Close nominations 7 days before voting
  
  return this.isActive && now < nominationDeadline;
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Category', categorySchema);