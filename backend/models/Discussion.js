const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  replies: [], // Initialize as empty array, will be populated with nested comments
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isReported: {
    type: Boolean,
    default: false,
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
});

// Set up self-reference for replies after initial schema creation
commentSchema.add({
  replies: [commentSchema]
});

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['general', 'academic', 'events', 'technical', 'announcements', 'help'],
    default: 'general',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [commentSchema],
  viewCount: {
    type: Number,
    default: 0,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for comment count
discussionSchema.virtual('commentCount').get(function() {
  return this.comments.filter(comment => !comment.isDeleted).length;
});

// Virtual for like count
discussionSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Index for better performance
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ category: 1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ 'comments.author': 1 });

// Pre-save middleware to update timestamps
discussionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
discussionSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

discussionSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes.pull(existingLike._id);
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

discussionSchema.methods.addComment = function(commentData) {
  // For now, let's add all comments to the main array and handle nesting on the frontend
  // This ensures comments are always saved, and we can implement proper nesting later
  
  // Create the comment with a unique ID
  const newComment = {
    ...commentData,
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    replies: [],
    likes: [],
    isReported: false,
    reportedBy: [],
    isDeleted: false
  };
  
  if (commentData.parentComment) {
    console.log(`Adding reply to parent: ${commentData.parentComment}`);
    // Try to find parent and add to its replies
    const parentComment = this.getCommentById(commentData.parentComment);
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = [];
      }
      parentComment.replies.push(newComment);
      console.log(`Successfully added reply to parent comment`);
    } else {
      console.log(`Parent not found, adding as top-level comment`);
      // If parent not found, add as top-level comment but keep parentComment reference
      this.comments.push(newComment);
    }
  } else {
    console.log('Adding top-level comment');
    this.comments.push(newComment);
  }
  
  return this.save();
};

discussionSchema.methods.getCommentById = function(commentId) {
  console.log(`Searching for comment ID: ${commentId}`);
  
  // Search in top-level comments first
  for (const comment of this.comments) {
    if (comment._id.toString() === commentId.toString()) {
      console.log(`Found comment at top level`);
      return comment;
    }
  }
  
  // Search in replies recursively
  for (const topComment of this.comments) {
    const found = this.getCommentByIdRecursive(topComment, commentId);
    if (found) {
      console.log(`Found comment in replies`);
      return found;
    }
  }
  
  console.log(`Comment ${commentId} not found`);
  return null;
};

discussionSchema.methods.getCommentByIdRecursive = function(comment, commentId) {
  if (comment._id.toString() === commentId.toString()) {
    return comment;
  }
  
  // Search in replies
  if (comment.replies && comment.replies.length > 0) {
    for (const reply of comment.replies) {
      const found = this.getCommentByIdRecursive(reply, commentId);
      if (found) return found;
    }
  }
  
  return null;
};

// Static methods
discussionSchema.statics.findByCategory = function(category) {
  return this.find({ category, isDeleted: false });
};

discussionSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId, isDeleted: false });
};

discussionSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { isDeleted: false },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  });
};

module.exports = mongoose.model('Discussion', discussionSchema);
