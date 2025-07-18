const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

// Middleware to check email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Google users are automatically verified
  if (req.user.isGoogleUser) {
    return next();
  }

  // Check if email is verified
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      message: 'Email verification required to access this resource',
      requiresEmailVerification: true,
      email: req.user.email
    });
  }

  next();
};

// Optional middleware to verify JWT token (doesn't reject if no token)
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided, continue without setting req.user
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      // Invalid token, continue without setting req.user
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // Token verification failed, continue without setting req.user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  requireEmailVerification,
  optionalAuthenticate
};
