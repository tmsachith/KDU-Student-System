const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const { authenticateToken, optionalAuthenticate } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/discussions - Get all discussions with filtering and pagination
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'recent',
      page = 1,
      limit = 10,
      author,
      tags
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = { isDeleted: false };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (author) {
      query.author = author;
    }

    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagsArray };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { isPinned: -1, createdAt: -1 };
        break;
      case 'popular':
        sortOption = { isPinned: -1, viewCount: -1, createdAt: -1 };
        break;
      case 'mostLiked':
        sortOption = { isPinned: -1, 'likes.length': -1, createdAt: -1 };
        break;
      case 'mostCommented':
        sortOption = { isPinned: -1, 'comments.length': -1, createdAt: -1 };
        break;
      default:
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    const discussions = await Discussion.find(query)
      .populate('author', 'name email profileImageUrl')
      .populate('comments.author', 'name email profileImageUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Add computed fields
    const discussionsWithExtras = discussions.map(discussion => ({
      ...discussion,
      likeCount: discussion.likes?.length || 0,
      commentCount: discussion.comments?.filter(comment => !comment.isDeleted).length || 0,
      isLikedByUser: req.user ? discussion.likes?.some(like => like.user.toString() === req.user.id) || false : false
    }));

    const total = await Discussion.countDocuments(query);

    res.json({
      discussions: discussionsWithExtras,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Error fetching discussions' });
  }
});

// GET /api/discussions/:id - Get specific discussion
router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'name email profileImageUrl')
      .populate('comments.author', 'name email profileImageUrl')
      .populate('comments.replies.author', 'name email profileImageUrl')
      .populate('comments.replies.replies.author', 'name email profileImageUrl')
      .populate('comments.replies.replies.replies.author', 'name email profileImageUrl');

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Increment view count
    await discussion.incrementViewCount();

    // Helper function to add computed fields to comments recursively
    const addCommentFields = (comment, userId) => {
      return {
        ...comment.toObject(),
        likeCount: comment.likes?.length || 0,
        isLikedByUser: userId ? comment.likes?.some(like => like.user.toString() === userId) || false : false,
        replies: comment.replies ? comment.replies.map(reply => addCommentFields(reply, userId)) : []
      };
    };

    // Add computed fields
    const discussionWithExtras = {
      ...discussion.toObject(),
      likeCount: discussion.likes?.length || 0,
      commentCount: discussion.comments?.filter(comment => !comment.isDeleted).length || 0,
      isLikedByUser: req.user ? discussion.likes?.some(like => like.user.toString() === req.user.id) || false : false,
      comments: discussion.comments.map(comment => addCommentFields(comment, req.user?.id))
    };

    res.json(discussionWithExtras);
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({ message: 'Error fetching discussion' });
  }
});

// POST /api/discussions - Create new discussion
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const discussion = new Discussion({
      title: title.trim(),
      content: content.trim(),
      author: req.user.id,
      category: category || 'general',
      tags: tags ? tags.map(tag => tag.trim()).filter(tag => tag) : []
    });

    const savedDiscussion = await discussion.save();
    const populatedDiscussion = await Discussion.findById(savedDiscussion._id)
      .populate('author', 'name email profileImageUrl');

    res.status(201).json({
      ...populatedDiscussion.toObject(),
      likeCount: 0,
      commentCount: 0,
      isLikedByUser: false
    });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ message: 'Error creating discussion' });
  }
});

// PUT /api/discussions/:id - Update discussion
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if user is the author
    if (discussion.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own discussions' });
    }

    // Update fields
    if (title) discussion.title = title.trim();
    if (content) discussion.content = content.trim();
    if (category) discussion.category = category;
    if (tags) discussion.tags = tags.map(tag => tag.trim()).filter(tag => tag);

    const updatedDiscussion = await discussion.save();
    const populatedDiscussion = await Discussion.findById(updatedDiscussion._id)
      .populate('author', 'name email profileImageUrl');

    res.json({
      ...populatedDiscussion.toObject(),
      likeCount: populatedDiscussion.likes?.length || 0,
      commentCount: populatedDiscussion.comments?.filter(comment => !comment.isDeleted).length || 0,
      isLikedByUser: populatedDiscussion.likes?.some(like => like.user.toString() === req.user.id) || false
    });
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({ message: 'Error updating discussion' });
  }
});

// DELETE /api/discussions/:id - Delete discussion
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if user is the author or admin
    const user = await User.findById(req.user.id);
    if (discussion.author.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own discussions' });
    }

    discussion.isDeleted = true;
    await discussion.save();

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ message: 'Error deleting discussion' });
  }
});

// POST /api/discussions/:id/like - Toggle like on discussion
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    await discussion.toggleLike(req.user.id);

    res.json({
      likeCount: discussion.likes.length,
      isLiked: discussion.likes.some(like => like.user.toString() === req.user.id)
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
});

// POST /api/discussions/:id/comments - Add comment to discussion
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    console.log(`Adding comment to discussion ${req.params.id}`);
    console.log(`Content: ${content}`);
    console.log(`Parent comment: ${parentComment}`);

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.isLocked) {
      return res.status(403).json({ message: 'This discussion is locked' });
    }

    const commentData = {
      content: content.trim(),
      author: req.user.id,
      parentComment: parentComment || null
    };

    console.log('Calling addComment with data:', commentData);
    await discussion.addComment(commentData);
    console.log('Comment added successfully');

    const updatedDiscussion = await Discussion.findById(req.params.id)
      .populate('comments.author', 'name email profileImageUrl')
      .populate('comments.replies.author', 'name email profileImageUrl')
      .populate('comments.replies.replies.author', 'name email profileImageUrl')
      .populate('comments.replies.replies.replies.author', 'name email profileImageUrl');

    // For replies, we need to find the newly added comment in the nested structure
    let newComment;
    if (parentComment) {
      // This is a reply, find it in the nested structure
      newComment = updatedDiscussion.comments
        .flatMap(comment => [comment, ...comment.replies || []])
        .find(c => c.author._id.toString() === req.user.id && 
                   c.content === content.trim() && 
                   c.parentComment?.toString() === parentComment);
    } else {
      // This is a top-level comment
      newComment = updatedDiscussion.comments[updatedDiscussion.comments.length - 1];
    }

    if (!newComment) {
      console.error('Could not find newly added comment');
      return res.status(500).json({ message: 'Error finding new comment' });
    }

    res.status(201).json({
      comment: {
        ...newComment.toObject(),
        likeCount: newComment.likes?.length || 0,
        isLikedByUser: false
      },
      totalComments: updatedDiscussion.comments.filter(comment => !comment.isDeleted).length
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// PUT /api/discussions/:id/comments/:commentId - Update comment
router.put('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const comment = discussion.getCommentById(req.params.commentId);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.content = content.trim();
    comment.updatedAt = Date.now();

    await discussion.save();

    res.json({
      comment: {
        ...comment.toObject(),
        likeCount: comment.likes?.length || 0,
        isLikedByUser: comment.likes?.some(like => like.user.toString() === req.user.id) || false
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Error updating comment' });
  }
});

// DELETE /api/discussions/:id/comments/:commentId - Delete comment
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const comment = discussion.getCommentById(req.params.commentId);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or admin
    const user = await User.findById(req.user.id);
    if (comment.author.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    comment.isDeleted = true;
    await discussion.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

// POST /api/discussions/:id/comments/:commentId/like - Toggle like on comment
router.post('/:id/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const comment = discussion.getCommentById(req.params.commentId);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingLike = comment.likes.find(like => like.user.toString() === req.user.id);

    if (existingLike) {
      comment.likes.pull(existingLike._id);
    } else {
      comment.likes.push({ user: req.user.id });
    }

    await discussion.save();

    res.json({
      likeCount: comment.likes.length,
      isLiked: comment.likes.some(like => like.user.toString() === req.user.id)
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ message: 'Error toggling comment like' });
  }
});

// POST /api/discussions/:id/report - Report discussion
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if user already reported this discussion
    const existingReport = discussion.reportedBy.find(
      report => report.user.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this discussion' });
    }

    discussion.reportedBy.push({
      user: req.user.id,
      reason: reason.trim()
    });

    discussion.isReported = true;
    await discussion.save();

    res.json({ message: 'Discussion reported successfully' });
  } catch (error) {
    console.error('Error reporting discussion:', error);
    res.status(500).json({ message: 'Error reporting discussion' });
  }
});

// POST /api/discussions/:id/comments/:commentId/report - Report comment
router.post('/:id/comments/:commentId/report', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const comment = discussion.getCommentById(req.params.commentId);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already reported this comment
    const existingReport = comment.reportedBy.find(
      report => report.user.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this comment' });
    }

    comment.reportedBy.push({
      user: req.user.id,
      reason: reason.trim()
    });

    comment.isReported = true;
    await discussion.save();

    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    console.error('Error reporting comment:', error);
    res.status(500).json({ message: 'Error reporting comment' });
  }
});

// GET /api/discussions/stats - Get discussion statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalDiscussions = await Discussion.countDocuments({ isDeleted: false });
    const totalComments = await Discussion.aggregate([
      { $match: { isDeleted: false } },
      { $project: { commentCount: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$commentCount' } } }
    ]);

    const categoryStats = await Discussion.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalDiscussions,
      totalComments: totalComments[0]?.total || 0,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;
