const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { authenticateToken, authorize, requireEmailVerification } = require('../middleware/auth');
const { upload, deleteImage, extractPublicId, handleUploadError } = require('../config/cloudinary');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all approved events (Public for mobile app)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      eventType, 
      search,
      upcoming = true,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    let filter = { isApproved: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (eventType && eventType !== 'all') {
      filter.eventType = eventType;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Date filters
    if (upcoming === 'true') {
      filter.startDateTime = { $gte: new Date() };
    }

    if (startDate) {
      filter.startDateTime = { 
        ...filter.startDateTime,
        $gte: new Date(startDate)
      };
    }

    if (endDate) {
      filter.endDateTime = { $lte: new Date(endDate) };
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalEvents: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error while fetching event' });
  }
});

// @route   POST /api/events
// @desc    Create new event (Club members only)
// @access  Private (Club/Admin only, Email verified)
router.post('/', [
  authenticateToken,
  requireEmailVerification,
  authorize('club', 'admin'),
  upload.single('eventImage'), // Add image upload middleware
  handleUploadError, // Handle file upload
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be between 1 and 1000 characters'),
  body('organizer').trim().isLength({ min: 1, max: 100 }).withMessage('Organizer must be between 1 and 100 characters'),
  body('location').trim().isLength({ min: 1, max: 200 }).withMessage('Location must be between 1 and 200 characters'),
  body('startDateTime').isISO8601().withMessage('Start date must be a valid date'),
  body('endDateTime').isISO8601().withMessage('End date must be a valid date'),
  body('category').optional().isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'other']).withMessage('Invalid category'),
  body('eventType').isIn(['university', 'club']).withMessage('Event type must be university or club'),
  body('maxAttendees').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 10000) {
      throw new Error('Max attendees must be between 1 and 10000');
    }
    return true;
  }),
  body('registrationRequired').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (value === 'true' || value === true || value === 'false' || value === false) return true;
    throw new Error('Registration required must be boolean');
  }),
  body('registrationDeadline').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (!new Date(value).getTime()) {
      throw new Error('Registration deadline must be a valid date');
    }
    return true;
  }),
  body('contactEmail').optional().isEmail().withMessage('Contact email must be valid'),
  body('contactPhone').optional().isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters'),
  body('isPublic').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (value === 'true' || value === true || value === 'false' || value === false) return true;
    throw new Error('Is public must be boolean');
  }),
  body('tags').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    // If it's a string (from FormData), try to parse it
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('Tags must be an array');
        }
        return true;
      } catch (e) {
        throw new Error('Tags must be a valid JSON array');
      }
    }
    // If it's already an array
    if (Array.isArray(value)) return true;
    throw new Error('Tags must be an array');
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Convert FormData string values to proper types
    let {
      title,
      description,
      organizer,
      location,
      startDateTime,
      endDateTime,
      category = 'other',
      eventType,
      maxAttendees,
      registrationRequired = false,
      registrationDeadline,
      contactEmail,
      contactPhone,
      isPublic = true,
      tags = []
    } = req.body;

    // Convert string booleans to actual booleans (from FormData)
    if (typeof registrationRequired === 'string') {
      registrationRequired = registrationRequired === 'true';
    }
    if (typeof isPublic === 'string') {
      isPublic = isPublic === 'true';
    }

    // Convert maxAttendees to number if it exists
    if (maxAttendees && typeof maxAttendees === 'string') {
      maxAttendees = parseInt(maxAttendees);
      if (isNaN(maxAttendees)) {
        maxAttendees = undefined;
      }
    }

    // Parse tags if it's a JSON string (from FormData)
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = [];
      }
    }

    // Handle uploaded image
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary returns URL in req.file.path
    }

    // Validate dates
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End date and time must be after start date and time' });
    }

    if (startDate <= new Date()) {
      return res.status(400).json({ message: 'Event start date must be in the future' });
    }

    // Validate registration deadline if provided
    if (registrationRequired && registrationDeadline) {
      const regDeadline = new Date(registrationDeadline);
      if (regDeadline >= startDate) {
        return res.status(400).json({ message: 'Registration deadline must be before event start time' });
      }
    }

    const event = new Event({
      title,
      description,
      organizer,
      location,
      startDateTime: startDate,
      endDateTime: endDate,
      category,
      eventType,
      maxAttendees,
      registrationRequired,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      contactEmail,
      contactPhone,
      isPublic,
      tags: parsedTags.filter(tag => tag.trim().length > 0),
      imageUrl,
      createdBy: req.user._id,
      isApproved: false
    });

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email role');

    res.status(201).json({
      message: 'Event created successfully and submitted for approval',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event (Creator or Admin only)
// @access  Private (Creator/Admin only, Email verified)
router.put('/:id', [
  authenticateToken,
  requireEmailVerification,
  upload.single('eventImage'), // Add image upload middleware
  handleUploadError, // Handle file upload
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be between 1 and 1000 characters'),
  body('organizer').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Organizer must be between 1 and 100 characters'),
  body('location').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Location must be between 1 and 200 characters'),
  body('startDateTime').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDateTime').optional().isISO8601().withMessage('End date must be a valid date'),
  body('category').optional().isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'other']).withMessage('Invalid category'),
  body('eventType').optional().isIn(['university', 'club']).withMessage('Event type must be university or club'),
  body('maxAttendees').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 10000) {
      throw new Error('Max attendees must be between 1 and 10000');
    }
    return true;
  }),
  body('registrationRequired').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (value === 'true' || value === true || value === 'false' || value === false) return true;
    throw new Error('Registration required must be boolean');
  }),
  body('registrationDeadline').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (!new Date(value).getTime()) {
      throw new Error('Registration deadline must be a valid date');
    }
    return true;
  }),
  body('contactEmail').optional().isEmail().withMessage('Contact email must be valid'),
  body('contactPhone').optional().isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters'),
  body('isPublic').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (value === 'true' || value === true || value === 'false' || value === false) return true;
    throw new Error('Is public must be boolean');
  }),
  body('tags').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    // If it's a string (from FormData), try to parse it
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('Tags must be an array');
        }
        return true;
      } catch (e) {
        throw new Error('Tags must be a valid JSON array');
      }
    }
    // If it's already an array
    if (Array.isArray(value)) return true;
    throw new Error('Tags must be an array');
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions: only creator or admin can update
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only update events you created' });
    }

    // If event is approved, only admin can update
    if (event.isApproved && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot update approved event. Contact admin for changes.' });
    }

    const updateData = { ...req.body };

    // Convert FormData string values to proper types
    if (updateData.registrationRequired && typeof updateData.registrationRequired === 'string') {
      updateData.registrationRequired = updateData.registrationRequired === 'true';
    }
    if (updateData.isPublic && typeof updateData.isPublic === 'string') {
      updateData.isPublic = updateData.isPublic === 'true';
    }
    if (updateData.maxAttendees && typeof updateData.maxAttendees === 'string') {
      updateData.maxAttendees = parseInt(updateData.maxAttendees);
      if (isNaN(updateData.maxAttendees)) {
        updateData.maxAttendees = undefined;
      }
    }

    // Parse tags if it's a JSON string (from FormData)
    if (updateData.tags && typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (e) {
        updateData.tags = [];
      }
    }

    // Handle uploaded image
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (event.imageUrl) {
        const oldPublicId = extractPublicId(event.imageUrl);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
          } catch (error) {
            console.error('Error deleting old image from Cloudinary:', error);
            // Continue with update even if old image deletion fails
          }
        }
      }
      
      // Set new image URL from Cloudinary
      updateData.imageUrl = req.file.path;
    }

    // Validate dates if provided
    if (updateData.startDateTime || updateData.endDateTime) {
      const startDate = new Date(updateData.startDateTime || event.startDateTime);
      const endDate = new Date(updateData.endDateTime || event.endDateTime);

      if (endDate <= startDate) {
        return res.status(400).json({ message: 'End date and time must be after start date and time' });
      }

      if (startDate <= new Date()) {
        return res.status(400).json({ message: 'Event start date must be in the future' });
      }
    }

    // If updating approval status, reset approval fields
    if (updateData.hasOwnProperty('isApproved')) {
      if (updateData.isApproved) {
        updateData.approvedBy = req.user._id;
        updateData.approvedAt = new Date();
        updateData.rejectedBy = null;
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      } else {
        updateData.approvedBy = null;
        updateData.approvedAt = null;
      }
    }

    // Clean tags if provided
    if (updateData.tags) {
      updateData.tags = updateData.tags.filter(tag => tag.trim().length > 0);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role')
     .populate('approvedBy', 'name email')
     .populate('rejectedBy', 'name email');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error while updating event' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (Creator or Admin only)
// @access  Private (Creator/Admin only, Email verified)
router.delete('/:id', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions: only creator or admin can delete
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete events you created' });
    }

    // Delete associated image from Cloudinary if it exists
    if (event.imageUrl) {
      const publicId = extractPublicId(event.imageUrl);
      if (publicId) {
        try {
          await deleteImage(publicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with event deletion even if image deletion fails
        }
      }
    }

    await Event.findByIdAndDelete(eventId);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

// @route   GET /api/events/my-events
// @desc    Get events created by current user
// @access  Private (Club/Admin only, Email verified)
router.get('/my/events', authenticateToken, requireEmailVerification, authorize('club', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = { createdBy: req.user._id };
    
    if (status === 'approved') {
      filter.isApproved = true;
    } else if (status === 'pending') {
      filter.isApproved = false;
      filter.$or = [
        { rejectedBy: { $exists: false } },
        { rejectedBy: null }
      ];
    } else if (status === 'rejected') {
      filter.rejectedBy = { $exists: true, $ne: null };
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalEvents: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Server error while fetching your events' });
  }
});

// @route   GET /api/events/admin/all
// @desc    Get all events for admin review
// @access  Private (Admin only, Email verified)
router.get('/admin/all', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, eventType } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    
    if (status === 'approved') {
      filter.isApproved = true;
    } else if (status === 'pending') {
      filter.isApproved = false;
      filter.$or = [
        { rejectedBy: { $exists: false } },
        { rejectedBy: null }
      ];
    } else if (status === 'rejected') {
      filter.rejectedBy = { $exists: true, $ne: null };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (eventType && eventType !== 'all') {
      filter.eventType = eventType;
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Event.countDocuments(filter);

    // Get statistics
    const stats = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          approvedEvents: { $sum: { $cond: ['$isApproved', 1, 0] } },
          pendingEvents: { $sum: { $cond: [{ 
            $and: [
              { $eq: ['$isApproved', false] }, 
              { $or: [
                { $eq: ['$rejectedBy', null] },
                { $not: { $ifNull: ['$rejectedBy', false] } }
              ]}
            ] 
          }, 1, 0] } },
          rejectedEvents: { $sum: { $cond: [{ 
            $and: [
              { $ne: ['$rejectedBy', null] },
              { $ifNull: ['$rejectedBy', false] }
            ]
          }, 1, 0] } }
        }
      }
    ]);

    res.json({
      events,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalEvents: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      statistics: stats[0] || {
        totalEvents: 0,
        approvedEvents: 0,
        pendingEvents: 0,
        rejectedEvents: 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin events:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// @route   PUT /api/events/:id/approve
// @desc    Approve event (Admin only)
// @access  Private (Admin only, Email verified)
router.put('/:id/approve', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.isApproved) {
      return res.status(400).json({ message: 'Event is already approved' });
    }

    event.isApproved = true;
    event.approvedBy = req.user._id;
    event.approvedAt = new Date();
    event.rejectedBy = null;
    event.rejectedAt = null;
    event.rejectionReason = null;

    await event.save();

    const populatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email');

    res.json({
      message: 'Event approved successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error approving event:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error while approving event' });
  }
});

// @route   PUT /api/events/:id/reject
// @desc    Reject event (Admin only)
// @access  Private (Admin only, Email verified)
router.put('/:id/reject', [
  authenticateToken,
  requireEmailVerification,
  authorize('admin'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Rejection reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const eventId = req.params.id;
    const { reason } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.rejectedBy) {
      return res.status(400).json({ message: 'Event is already rejected' });
    }

    event.isApproved = false;
    event.rejectedBy = req.user._id;
    event.rejectedAt = new Date();
    event.rejectionReason = reason || 'No reason provided';
    event.approvedBy = null;
    event.approvedAt = null;

    await event.save();

    const populatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'name email role')
      .populate('rejectedBy', 'name email');

    res.json({
      message: 'Event rejected successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error rejecting event:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error while rejecting event' });
  }
});

// @route   GET /api/events/stats
// @desc    Get event statistics
// @access  Private (Admin only, Email verified)
router.get('/stats/overview', authenticateToken, requireEmailVerification, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalEvents,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      upcomingEvents,
      thisMonthEvents,
      categoryStats,
      eventTypeStats
    ] = await Promise.all([
      Event.countDocuments({}),
      Event.countDocuments({ isApproved: true }),
      Event.countDocuments({ 
        isApproved: false, 
        $or: [
          { rejectedBy: { $exists: false } },
          { rejectedBy: null }
        ]
      }),
      Event.countDocuments({ 
        rejectedBy: { $exists: true, $ne: null } 
      }),
      Event.countDocuments({ isApproved: true, startDateTime: { $gte: now } }),
      Event.countDocuments({ 
        createdAt: { $gte: thisMonth, $lt: nextMonth }
      }),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      overview: {
        totalEvents,
        approvedEvents,
        pendingEvents,
        rejectedEvents,
        upcomingEvents,
        thisMonthEvents
      },
      categoryStats,
      eventTypeStats
    });
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    res.status(500).json({ message: 'Server error while fetching event statistics' });
  }
});

// @route   POST /api/events/upload-image
// @desc    Upload event image to Cloudinary
// @access  Private (Club/Admin only, Email verified)
router.post('/upload-image', 
  authenticateToken, 
  requireEmailVerification, 
  authorize('club', 'admin'),
  upload.single('eventImage'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No image file provided' 
        });
      }

      // Cloudinary automatically returns the URL in req.file.path
      const imageUrl = req.file.path;
      const publicId = req.file.public_id;
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: imageUrl,
        publicId: publicId
      });
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while uploading image' 
      });
    }
  }
);

// @route   DELETE /api/events/delete-image/:publicId
// @desc    Delete uploaded event image from Cloudinary
// @access  Private (Club/Admin only, Email verified)
router.delete('/delete-image/:publicId', 
  authenticateToken, 
  requireEmailVerification, 
  authorize('club', 'admin'),
  async (req, res) => {
    try {
      const publicId = req.params.publicId;
      
      // Delete the image from Cloudinary
      const result = await deleteImage(publicId);
      
      if (result.result === 'ok' || result.result === 'not found') {
        res.json({ 
          success: true,
          message: 'Image deleted successfully' 
        });
      } else {
        res.status(400).json({ 
          success: false,
          message: 'Failed to delete image' 
        });
      }
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while deleting image' 
      });
    }
  }
);

// @route   POST /api/events/:id/feedback
// @desc    Send feedback message to event creator (Admin only)
// @access  Private (Admin only, Email verified)
router.post('/:id/feedback', [
  authenticateToken,
  requireEmailVerification,
  authorize('admin'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const eventId = req.params.id;
    const { message } = req.body;

    const event = await Event.findById(eventId).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add feedback message to event
    event.adminFeedback.push({
      message,
      sentBy: req.user._id,
      sentAt: new Date(),
      isRead: false
    });

    await event.save();

    const populatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('adminFeedback.sentBy', 'name email role');

    res.json({
      message: 'Feedback sent successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error sending feedback:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error while sending feedback' });
  }
});

// @route   PUT /api/events/:id/feedback/:feedbackId/read
// @desc    Mark feedback message as read (Creator only)
// @access  Private (Creator only, Email verified)
router.put('/:id/feedback/:feedbackId/read', 
  authenticateToken, 
  requireEmailVerification, 
  async (req, res) => {
    try {
      const { id: eventId, feedbackId } = req.params;

      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user is the event creator
      if (event.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only mark feedback for your own events as read' });
      }

      // Find and mark the feedback as read
      const feedback = event.adminFeedback.id(feedbackId);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback message not found' });
      }

      feedback.isRead = true;
      await event.save();

      res.json({
        message: 'Feedback marked as read',
        feedbackId: feedbackId
      });
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      res.status(500).json({ message: 'Server error while updating feedback' });
    }
  }
);

// @route   GET /api/events/:id/feedback
// @desc    Get feedback messages for an event
// @access  Private (Creator or Admin only, Email verified)
router.get('/:id/feedback', 
  authenticateToken, 
  requireEmailVerification, 
  async (req, res) => {
    try {
      const eventId = req.params.id;

      const event = await Event.findById(eventId)
        .populate('adminFeedback.sentBy', 'name email role')
        .select('adminFeedback createdBy');

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user is the event creator or admin
      if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You can only view feedback for your own events' });
      }

      res.json({
        feedback: event.adminFeedback
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      res.status(500).json({ message: 'Server error while fetching feedback' });
    }
  }
);

// @route   GET /api/events/stats/my
// @desc    Get club user's event statistics
// @access  Private (Club only, Email verified)
router.get('/stats/my', authenticateToken, requireEmailVerification, authorize('club'), async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Filter events by current user
    const userFilter = { createdBy: req.user._id };

    const [
      totalEvents,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      upcomingEvents,
      thisMonthEvents,
      categoryStats,
      eventTypeStats,
      viewStats
    ] = await Promise.all([
      Event.countDocuments(userFilter),
      Event.countDocuments({ ...userFilter, isApproved: true }),
      Event.countDocuments({ 
        ...userFilter,
        isApproved: false, 
        $or: [
          { rejectedBy: { $exists: false } },
          { rejectedBy: null }
        ]
      }),
      Event.countDocuments({ 
        ...userFilter,
        rejectedBy: { $exists: true, $ne: null } 
      }),
      Event.countDocuments({ ...userFilter, isApproved: true, startDateTime: { $gte: now } }),
      Event.countDocuments({ 
        ...userFilter,
        createdAt: { $gte: thisMonth, $lt: nextMonth }
      }),
      Event.aggregate([
        { $match: userFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $match: userFilter },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' },
            avgViewsPerEvent: { $avg: '$viewCount' },
            mostViewedEvent: { $max: '$viewCount' }
          }
        }
      ])
    ]);

    res.json({
      overview: {
        totalEvents,
        approvedEvents,
        pendingEvents,
        rejectedEvents,
        upcomingEvents,
        thisMonthEvents
      },
      categoryStats,
      eventTypeStats,
      viewStats: viewStats[0] || {
        totalViews: 0,
        avgViewsPerEvent: 0,
        mostViewedEvent: 0
      }
    });
  } catch (error) {
    console.error('Error fetching club event statistics:', error);
    res.status(500).json({ message: 'Server error while fetching your event statistics' });
  }
});

// @route   GET /api/events/stats/my/detailed
// @desc    Get detailed club user's event analytics including top events
// @access  Private (Club only, Email verified)
router.get('/stats/my/detailed', authenticateToken, requireEmailVerification, authorize('club'), async (req, res) => {
  try {
    const userFilter = { createdBy: req.user._id };

    const [
      topViewedEvents,
      recentViews,
      viewsByPlatform
    ] = await Promise.all([
      // Top 5 most viewed events
      Event.find(userFilter)
        .select('title viewCount views startDateTime isApproved')
        .sort({ viewCount: -1 })
        .limit(5),
      // Recent views (last 30 days)
      Event.aggregate([
        { $match: userFilter },
        { $unwind: '$views' },
        { 
          $match: { 
            'views.viewedAt': { 
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            } 
          } 
        },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$views.viewedAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Views by platform
      Event.aggregate([
        { $match: userFilter },
        { $unwind: '$views' },
        { $group: { _id: '$views.platform', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      topViewedEvents,
      recentViews,
      viewsByPlatform
    });
  } catch (error) {
    console.error('Error fetching detailed club event analytics:', error);
    res.status(500).json({ message: 'Server error while fetching detailed analytics' });
  }
});

// @route   POST /api/events/:id/view
// @desc    Track event view (for analytics)
// @access  Private (All authenticated users)
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const { platform = 'mobile' } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already viewed this event recently (within last hour to avoid spam)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = event.views.find(view => 
      view.user.toString() === req.user._id.toString() && 
      view.viewedAt > oneHourAgo
    );

    if (!recentView) {
      // Add new view record
      event.views.push({
        user: req.user._id,
        viewedAt: new Date(),
        platform: platform
      });
      
      await event.save();
    }

    res.json({ 
      message: 'View tracked successfully',
      viewCount: event.viewCount 
    });
  } catch (error) {
    console.error('Error tracking event view:', error);
    res.status(500).json({ message: 'Server error while tracking event view' });
  }
});

module.exports = router;
