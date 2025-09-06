const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  studentId: {
    type: String,
    sparse: true,
    unique: true,
    match: [/^S0\d{5}$/, 'Student ID must be in format S0***** (S followed by 0 and 5 digits)']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+234|0)[789]\d{9}$/, 'Please provide a valid Nigerian phone number']
  },
  role: {
    type: String,
    enum: ['student', 'voter', 'admin'],
    default: 'voter'
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    required: function() {
      return this.isStudent;
    },
    enum: [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English Language',
      'History',
      'Political Science',
      'Economics',
      'Sociology',
      'Psychology',
      'Education',
      'Business Administration',
      'Accounting',
      'Banking and Finance',
      'Marketing',
      'Mass Communication',
      'Law',
      'Medicine',
      'Nursing',
      'Engineering',
      'Agriculture',
      'Environmental Science'
    ]
  },
  faculty: {
    type: String,
    required: function() {
      return this.isStudent;
    },
    enum: [
      'Science',
      'Computer Science',
      'Arts',
      'Social Sciences',
      'Education',
      'Management Sciences',
      'Law',
      'Medicine',
      'Engineering',
      'Agriculture'
    ]
  },
  level: {
    type: String,
    required: function() {
      return this.isStudent;
    },
    enum: ['100', '200', '300', '400', '500']
  },
  profileImage: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  totalVotesCast: {
    type: Number,
    default: 0
  },
  totalAmountSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isStudent: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);