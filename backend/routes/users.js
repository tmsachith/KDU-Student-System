const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, authorize, requireEmailVerification } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only, Email verified)
router.get('/', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, verified } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    let filter = {};
    
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    if (verified !== undefined) {
      filter.isEmailVerified = verified === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Transform _id to id for frontend compatibility
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isGoogleUser: user.isGoogleUser,
      createdAt: user.createdAt
    }));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalAdmins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          totalClubs: { $sum: { $cond: [{ $eq: ['$role', 'club'] }, 1, 0] } },
          totalStudents: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
          googleUsers: { $sum: { $cond: ['$isGoogleUser', 1, 0] } }
        }
      }
    ]);    res.json({
      users: transformedUsers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      statistics: stats[0] || {
        totalUsers: 0,
        totalAdmins: 0,
        totalClubs: 0,
        totalStudents: 0,
        verifiedUsers: 0,
        googleUsers: 0
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin only, Email verified)
router.get('/:id', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isGoogleUser: user.isGoogleUser,
      createdAt: user.createdAt
    };

    res.json({ user: transformedUser });
  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin only, Email verified)
router.put('/:id', [
  authenticateToken,
  requireEmailVerification,
  authorize('admin'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('role').optional().isIn(['student', 'club', 'admin']).withMessage('Role must be student, club, or admin'),
  body('isEmailVerified').optional().isBoolean().withMessage('Email verification status must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, role, isEmailVerified } = req.body;
    const userId = req.params.id;

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString() && role && role !== req.user.role) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken by another user' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isEmailVerified !== undefined) updateData.isEmailVerified = isEmailVerified;    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isGoogleUser: user.isGoogleUser,
      createdAt: user.createdAt
    };

    res.json({
      message: 'User updated successfully',
      user: transformedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin only, Email verified)
router.delete('/:id', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin only, Email verified)
router.post('/', [
  authenticateToken,
  requireEmailVerification,
  authorize('admin'),
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'club', 'admin']).withMessage('Role must be student, club, or admin'),
  body('isEmailVerified').optional().isBoolean().withMessage('Email verification status must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, isEmailVerified = false } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      isEmailVerified,
      isGoogleUser: false
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isGoogleUser: user.isGoogleUser,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error while creating user' });
  }
});

// @route   PUT /api/users/:id/toggle-verification
// @desc    Toggle user email verification status (Admin only)
// @access  Private (Admin only, Email verified)
router.put('/:id/toggle-verification', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle verification status
    user.isEmailVerified = !user.isEmailVerified;
    
    // Clear verification token if verifying manually
    if (user.isEmailVerified) {
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
    }

    await user.save();

    res.json({
      message: `User ${user.isEmailVerified ? 'verified' : 'unverified'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isGoogleUser: user.isGoogleUser,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Toggle verification error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while updating verification status' });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview (Admin only)
// @access  Private (Admin only, Email verified)
router.get('/stats/overview', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalAdmins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          totalClubs: { $sum: { $cond: [{ $eq: ['$role', 'club'] }, 1, 0] } },
          totalStudents: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
          unverifiedUsers: { $sum: { $cond: [{ $not: '$isEmailVerified' }, 1, 0] } },
          googleUsers: { $sum: { $cond: ['$isGoogleUser', 1, 0] } }
        }
      }
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get role distribution over time
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalUsers: 0,
        totalAdmins: 0,
        totalClubs: 0,
        totalStudents: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        googleUsers: 0
      },
      recentRegistrations,
      roleDistribution
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;
