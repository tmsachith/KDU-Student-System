const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/events');
fs.ensureDirSync(uploadDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = 'event-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
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

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per upload
  }
});

// Middleware to handle single image upload
const uploadEventImage = upload.single('eventImage');

// Custom middleware to handle multer errors
const handleUploadError = (req, res, next) => {
  uploadEventImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File too large. Maximum size is 5MB.' 
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          message: 'Too many files. Only one image is allowed.' 
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          message: 'Unexpected field. Use "eventImage" as the field name.' 
        });
      }
      return res.status(400).json({ 
        message: 'File upload error: ' + err.message 
      });
    } else if (err) {
      return res.status(400).json({ 
        message: err.message 
      });
    }
    next();
  });
};

// Function to delete uploaded file
const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Function to get file URL
const getFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/events/${filename}`;
};

module.exports = {
  uploadEventImage,
  handleUploadError,
  deleteUploadedFile,
  getFileUrl,
  uploadDir
};
