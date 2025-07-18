const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking admin status' });
  }
};

// GET /api/admin/discussions/reported - Get reported discussions
router.get('/discussions/reported', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const discussions = await Discussion.find({
      isReported: true,
      isDeleted: false
    })
      .populate('author', 'name email profileImageUrl')
      .populate('reportedBy.user', 'name email')
      .sort({ 'reportedBy.reportedAt': -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Discussion.countDocuments({
      isReported: true,
      isDeleted: false
    });

    res.json({
      discussions,
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
    console.error('Error fetching reported discussions:', error);
    res.status(500).json({ message: 'Error fetching reported discussions' });
  }
});

// GET /api/admin/discussions/reported-comments - Get reported comments
router.get('/discussions/reported-comments', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const discussions = await Discussion.find({
      'comments.isReported': true,
      isDeleted: false
    })
      .populate('author', 'name email profileImageUrl')
      .populate('comments.author', 'name email profileImageUrl')
      .populate('comments.reportedBy.user', 'name email')
      .sort({ 'comments.reportedBy.reportedAt': -1 });

    // Extract reported comments with discussion context
    const reportedComments = [];
    discussions.forEach(discussion => {
      discussion.comments.forEach(comment => {
        if (comment.isReported && !comment.isDeleted) {
          reportedComments.push({
            _id: comment._id,
            content: comment.content,
            author: comment.author,
            createdAt: comment.createdAt,
            reportedBy: comment.reportedBy,
            discussion: {
              _id: discussion._id,
              title: discussion.title,
              author: discussion.author
            }
          });
        }
      });
    });

    // Sort by most recent report
    reportedComments.sort((a, b) => {
      const aLatestReport = Math.max(...a.reportedBy.map(r => new Date(r.reportedAt)));
      const bLatestReport = Math.max(...b.reportedBy.map(r => new Date(r.reportedAt)));
      return bLatestReport - aLatestReport;
    });

    // Apply pagination
    const paginatedComments = reportedComments.slice(skip, skip + limitNum);

    res.json({
      comments: paginatedComments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(reportedComments.length / limitNum),
        totalItems: reportedComments.length,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(reportedComments.length / limitNum),
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching reported comments:', error);
    res.status(500).json({ message: 'Error fetching reported comments' });
  }
});

// PUT /api/admin/discussions/:id/moderate - Moderate discussion
router.put('/discussions/:id/moderate', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve', 'delete', 'pin', 'unpin', 'lock', 'unlock'

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    switch (action) {
      case 'approve':
        discussion.isReported = false;
        discussion.reportedBy = [];
        break;
      case 'delete':
        discussion.isDeleted = true;
        break;
      case 'pin':
        discussion.isPinned = true;
        break;
      case 'unpin':
        discussion.isPinned = false;
        break;
      case 'lock':
        discussion.isLocked = true;
        break;
      case 'unlock':
        discussion.isLocked = false;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await discussion.save();

    res.json({
      message: `Discussion ${action}d successfully`,
      discussion: {
        _id: discussion._id,
        title: discussion.title,
        isReported: discussion.isReported,
        isDeleted: discussion.isDeleted,
        isPinned: discussion.isPinned,
        isLocked: discussion.isLocked
      }
    });
  } catch (error) {
    console.error('Error moderating discussion:', error);
    res.status(500).json({ message: 'Error moderating discussion' });
  }
});

// PUT /api/admin/discussions/:id/comments/:commentId/moderate - Moderate comment
router.put('/discussions/:id/comments/:commentId/moderate', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve', 'delete'

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const comment = discussion.getCommentById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    switch (action) {
      case 'approve':
        comment.isReported = false;
        comment.reportedBy = [];
        break;
      case 'delete':
        comment.isDeleted = true;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await discussion.save();

    res.json({
      message: `Comment ${action}d successfully`,
      comment: {
        _id: comment._id,
        content: comment.content,
        isReported: comment.isReported,
        isDeleted: comment.isDeleted
      }
    });
  } catch (error) {
    console.error('Error moderating comment:', error);
    res.status(500).json({ message: 'Error moderating comment' });
  }
});

// GET /api/admin/discussions/stats - Get admin statistics
router.get('/discussions/stats', authenticateToken, adminAuth, async (req, res) => {
  try {
    const totalDiscussions = await Discussion.countDocuments({ isDeleted: false });
    const reportedDiscussions = await Discussion.countDocuments({ isReported: true, isDeleted: false });
    const pinnedDiscussions = await Discussion.countDocuments({ isPinned: true, isDeleted: false });
    const lockedDiscussions = await Discussion.countDocuments({ isLocked: true, isDeleted: false });

    // Get reported comments count
    const discussionsWithReportedComments = await Discussion.find({
      'comments.isReported': true,
      isDeleted: false
    });

    let reportedCommentsCount = 0;
    discussionsWithReportedComments.forEach(discussion => {
      reportedCommentsCount += discussion.comments.filter(comment => comment.isReported && !comment.isDeleted).length;
    });

    // Get category distribution
    const categoryStats = await Discussion.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentDiscussions = await Discussion.countDocuments({
      createdAt: { $gte: weekAgo },
      isDeleted: false
    });

    const recentComments = await Discussion.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$comments' },
      { $match: { 'comments.createdAt': { $gte: weekAgo }, 'comments.isDeleted': false } },
      { $count: 'total' }
    ]);

    res.json({
      totalDiscussions,
      reportedDiscussions,
      pinnedDiscussions,
      lockedDiscussions,
      reportedCommentsCount,
      categoryStats,
      recentActivity: {
        discussions: recentDiscussions,
        comments: recentComments[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

// GET /api/admin/discussions/users/:userId - Get user's discussions and comments
router.get('/discussions/users/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(userId).select('name email profileImageUrl');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const discussions = await Discussion.find({
      author: userId,
      isDeleted: false
    })
      .populate('author', 'name email profileImageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalDiscussions = await Discussion.countDocuments({
      author: userId,
      isDeleted: false
    });

    // Get user's comments across all discussions
    const userComments = await Discussion.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$comments' },
      { $match: { 'comments.author': userId, 'comments.isDeleted': false } },
      { $sort: { 'comments.createdAt': -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.author',
          foreignField: '_id',
          as: 'comments.author'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          comment: '$comments',
          discussionId: '$_id'
        }
      }
    ]);

    const totalComments = await Discussion.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$comments' },
      { $match: { 'comments.author': userId, 'comments.isDeleted': false } },
      { $count: 'total' }
    ]);

    res.json({
      user,
      discussions,
      comments: userComments,
      stats: {
        totalDiscussions,
        totalComments: totalComments[0]?.total || 0
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalDiscussions / limitNum),
        totalItems: totalDiscussions,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalDiscussions / limitNum),
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user discussions:', error);
    res.status(500).json({ message: 'Error fetching user discussions' });
  }
});

module.exports = router;
