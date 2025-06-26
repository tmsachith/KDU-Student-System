const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { authenticateToken, authorize, requireEmailVerification } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'club', 'admin'])
    .withMessage('Role must be student, club, or admin')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user (email not verified yet)
    const user = new User({
      name,
      email,
      password,
      role: role || 'student',
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires
    });

    await user.save();

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      email,
      name,
      emailVerificationToken
    );

    if (!emailSent) {
      console.warn('Failed to send verification email, but user was created');
    }    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      requiresEmailVerification: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }    // Check if email is verified (block dashboard access)
    if (!user.isEmailVerified && !user.isGoogleUser) {
      return res.status(403).json({ 
        message: 'Please verify your email before accessing the system. Check your inbox for verification link.',
        requiresEmailVerification: true,
        email: user.email
      });
    }

    // Generate token
    const token = generateToken(user._id);    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isGoogleUser: user.isGoogleUser,
        createdAt: user.createdAt,
        joinedDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        message: 'Verification token is required',
        verified: false 
      });
    }

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Check if user exists with expired token
      const expiredUser = await User.findOne({
        emailVerificationToken: token
      });

      if (expiredUser) {
        return res.status(400).json({ 
          message: 'Verification token has expired. Please request a new verification email.',
          verified: false,
          expired: true,
          email: expiredUser.email
        });
      }

      return res.status(400).json({ 
        message: 'Invalid verification token. Please request a new verification email.',
        verified: false
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        message: 'Email is already verified. You can now log in.',
        verified: true,
        alreadyVerified: true
      });
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name, user.role);
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError);
    }

    // Generate login token
    const loginToken = generateToken(user._id);

    res.json({
      message: 'Email verified successfully! You can now log in and access the dashboard.',
      verified: true,
      token: loginToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        joinedDate: user.createdAt
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      message: 'Server error during email verification',
      verified: false 
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      email,
      user.name,
      emailVerificationToken
    );

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error during resend verification' });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', [  body('idToken')
    .notEmpty()
    .withMessage('Google ID token is required'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { idToken, email, name, role } = req.body;

    try {
      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const googleEmail = payload.email;

      // Verify email matches
      if (googleEmail !== email) {
        return res.status(400).json({ message: 'Email mismatch with Google account' });
      }

      // Check if user already exists
      let user = await User.findOne({ email: googleEmail });      if (user) {
        // User exists, log them in
        const token = generateToken(user._id);
          return res.json({
          message: 'Google login successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isGoogleUser: user.isGoogleUser,
            createdAt: user.createdAt,
            joinedDate: user.createdAt
          }
        });
      } else {
        // User doesn't exist, create new account with verified email
        user = new User({
          name: name || payload.name,
          email: googleEmail,
          password: Math.random().toString(36).slice(-8), // Random password for Google users
          role: role || 'student', // Default to student for mobile app
          isGoogleUser: true,
          isEmailVerified: true, // Google emails are pre-verified
          emailVerificationToken: null,
          emailVerificationExpires: null
        });

        await user.save();

        // Send welcome email
        await emailService.sendWelcomeEmail(user.email, user.name, user.role);

        const token = generateToken(user._id);        return res.status(201).json({
          message: 'Google account registered successfully',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isGoogleUser: user.isGoogleUser,
            createdAt: user.createdAt,
            joinedDate: user.createdAt
          }
        });
      }

    } catch (googleError) {
      console.error('Google token verification error:', googleError);
      return res.status(400).json({ message: 'Invalid Google token' });
    }

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Check if email is verified (block dashboard access)
    if (!req.user.isEmailVerified && !req.user.isGoogleUser) {
      return res.status(403).json({ 
        message: 'Please verify your email before accessing the dashboard.',
        requiresEmailVerification: true,
        user: {
          id: req.user._id,
          email: req.user.email,
          isEmailVerified: req.user.isEmailVerified
        }
      });
    }

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        isGoogleUser: req.user.isGoogleUser,
        createdAt: req.user.createdAt,
        joinedDate: req.user.createdAt,
        memberSince: req.user.createdAt,
        accountStatus: req.user.isEmailVerified ? 'Active' : 'Pending Verification'
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify token validity
// @access  Private
router.get('/verify', authenticateToken, (req, res) => {
  // Check if email is verified (for dashboard access)
  const canAccessDashboard = req.user.isEmailVerified || req.user.isGoogleUser;
  
  res.json({
    valid: true,
    canAccessDashboard,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
      isGoogleUser: req.user.isGoogleUser,
      createdAt: req.user.createdAt,
      joinedDate: req.user.createdAt
    }
  });
});

// @route   GET /api/auth/verification-status
// @desc    Check email verification status
// @access  Private
router.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      isEmailVerified: user.isEmailVerified,
      isGoogleUser: user.isGoogleUser,
      canAccessDashboard: user.isEmailVerified || user.isGoogleUser,
      email: user.email,
      tokenExpired: user.emailVerificationExpires && user.emailVerificationExpires < Date.now()
    });
  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({ message: 'Server error checking verification status' });
  }
});

// @route   GET /api/auth/admin-only
// @desc    Admin only route example
// @access  Private (Admin only, Email verified)
router.get('/admin-only', authenticateToken, requireEmailVerification, authorize('admin'), (req, res) => {
  res.json({ message: 'Welcome admin!', user: req.user });
});

// @route   GET /api/auth/club-or-admin
// @desc    Club or Admin only route example
// @access  Private (Club or Admin only, Email verified)
router.get('/club-or-admin', authenticateToken, requireEmailVerification, authorize('club', 'admin'), (req, res) => {
  res.json({ message: 'Welcome club member or admin!', user: req.user });
});

module.exports = router;
