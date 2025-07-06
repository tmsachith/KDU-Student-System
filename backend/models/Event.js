const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  organizer: {
    type: String,
    required: [true, 'Organizer is required'],
    trim: true,
    maxlength: [100, 'Organizer name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  startDateTime: {
    type: Date,
    required: [true, 'Start date and time is required']
  },
  endDateTime: {
    type: Date,
    required: [true, 'End date and time is required']
  },
  category: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'other'],
    default: 'other'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1'],
    max: [10000, 'Maximum attendees cannot exceed 10000']
  },
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationDeadline: {
    type: Date
  },
  eventType: {
    type: String,
    enum: ['university', 'club'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  imageUrl: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    platform: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'mobile'
    }
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  adminFeedback: [{
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Feedback message cannot exceed 1000 characters']
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Validate that endDateTime is after startDateTime
eventSchema.pre('save', function(next) {
  if (this.endDateTime <= this.startDateTime) {
    return next(new Error('End date and time must be after start date and time'));
  }
  
  // If registration is required, ensure registration deadline is before event start
  if (this.registrationRequired && this.registrationDeadline) {
    if (this.registrationDeadline >= this.startDateTime) {
      return next(new Error('Registration deadline must be before event start time'));
    }
  }
  
  // Update viewCount based on views array length
  if (this.views) {
    this.viewCount = this.views.length;
  }
  
  next();
});

// Transform _id to id in JSON output
eventSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Index for efficient queries
eventSchema.index({ isApproved: 1, startDateTime: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ eventType: 1 });

module.exports = mongoose.model('Event', eventSchema);
