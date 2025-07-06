const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfile, deleteImage, extractPublicId } = require('../config/cloudinary');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine profile image URL
    let profileImageUrl = null;
    if (user.isGoogleUser && user.googleProfileImageUrl) {
      profileImageUrl = user.googleProfileImageUrl;
    } else if (user.profileImageUrl) {
      profileImageUrl = user.profileImageUrl;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isGoogleUser: user.isGoogleUser,
        profileImageUrl,
        googleProfileImageUrl: user.googleProfileImageUrl,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// @route   PUT /api/profile/name
// @desc    Update user name
// @access  Private
router.put('/name', [
  authenticateToken,
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine profile image URL
    let profileImageUrl = null;
    if (user.isGoogleUser && user.googleProfileImageUrl) {
      profileImageUrl = user.googleProfileImageUrl;
    } else if (user.profileImageUrl) {
      profileImageUrl = user.profileImageUrl;
    }

    res.json({
      message: 'Name updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isGoogleUser: user.isGoogleUser,
        profileImageUrl,
        googleProfileImageUrl: user.googleProfileImageUrl,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ message: 'Server error while updating name' });
  }
});

// @route   POST /api/profile/upload-image
// @desc    Upload profile image to Cloudinary
// @access  Private
router.post('/upload-image', authenticateToken, (req, res) => {
  // Use multer middleware for file upload
  uploadProfile.single('profileImage')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        message: err.message || 'Error uploading image'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided'
      });
    }

    try {
      const userId = req.user._id;
      const imageUrl = req.file.path; // Cloudinary URL

      // Get current user to check for existing profile image
      const currentUser = await User.findById(userId);
      
      // Delete old profile image if it exists (but not Google images)
      if (currentUser.profileImageUrl && !currentUser.isGoogleUser) {
        try {
          const oldPublicId = extractPublicId(currentUser.profileImageUrl);
          if (oldPublicId) {
            await deleteImage(oldPublicId);
          }
        } catch (deleteError) {
          console.warn('Warning: Could not delete old profile image:', deleteError);
        }
      }

      // Update user with new profile image URL
      const user = await User.findByIdAndUpdate(
        userId,
        { profileImageUrl: imageUrl },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Determine final profile image URL
      let profileImageUrl = null;
      if (user.isGoogleUser && user.googleProfileImageUrl) {
        profileImageUrl = user.googleProfileImageUrl;
      } else if (user.profileImageUrl) {
        profileImageUrl = user.profileImageUrl;
      }

      res.json({
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrl,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isGoogleUser: user.isGoogleUser,
          profileImageUrl,
          googleProfileImageUrl: user.googleProfileImageUrl,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Database update error:', error);
      res.status(500).json({ message: 'Server error while updating profile image' });
    }
  });
});

// @route   DELETE /api/profile/remove-image
// @desc    Remove profile image
// @access  Private
router.delete('/remove-image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow removing uploaded images, not Google profile images
    if (user.profileImageUrl && !user.isGoogleUser) {
      try {
        const publicId = extractPublicId(user.profileImageUrl);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (deleteError) {
        console.warn('Warning: Could not delete profile image from Cloudinary:', deleteError);
      }
    }

    // Clear profile image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImageUrl: null },
      { new: true, runValidators: true }
    ).select('-password');

    // Determine final profile image URL (fallback to Google if available)
    let profileImageUrl = null;
    if (updatedUser.isGoogleUser && updatedUser.googleProfileImageUrl) {
      profileImageUrl = updatedUser.googleProfileImageUrl;
    }

    res.json({
      message: 'Profile image removed successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        isGoogleUser: updatedUser.isGoogleUser,
        profileImageUrl,
        googleProfileImageUrl: updatedUser.googleProfileImageUrl,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({ message: 'Server error while removing profile image' });
  }
});

module.exports = router;
