const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kdu-events', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        format: 'auto'
      }
    ],
    public_id: (req, file) => {
      // Generate unique public ID
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      return `event-${timestamp}-${random}`;
    },
  },
});

// Configure Cloudinary storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kdu-profiles', // Folder name for profile images
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'thumb',
        gravity: 'face',
        quality: 'auto:good',
        format: 'auto'
      }
    ],
    public_id: (req, file) => {
      // Generate unique public ID for profile image
      const timestamp = Date.now();
      const userId = req.user ? req.user._id : 'user';
      return `profile_${userId}_${timestamp}`;
    },
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Single file upload
  }
});

// Create multer upload for profile images
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  if (!url) return null;
  
  // Extract public ID from Cloudinary URL
  // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
  const regex = /\/v\d+\/(.+)\.(.+)$/;
  const match = url.match(regex);
  
  if (match) {
    return match[1]; // This includes the folder path
  }
  
  return null;
};

// Upload error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "eventImage" as the field name.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'An error occurred during file upload.'
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadProfile,
  storage,
  profileStorage,
  deleteImage,
  extractPublicId,
  handleUploadError
};
