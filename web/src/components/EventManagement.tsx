import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import { Event, CreateEventRequest, EventFilters } from '../types/event';

interface EventTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onView: (event: Event) => void;
}

const EventTable: React.FC<EventTableProps> = ({ events, onEdit, onDelete, onView }) => {
  const getStatusBadge = (event: Event) => {
    if (event.isApproved) {
      return 'bg-green-100 text-green-800';
    } else if (event.rejectedBy) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (event: Event) => {
    if (event.isApproved) {
      return 'Approved';
    } else if (event.rejectedBy) {
      return 'Rejected';
    } else {
      return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Views
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-500">{event.organizer}</div>
                  <div className="text-sm text-gray-500">{event.location}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(event.startDateTime)}
                </div>
                <div className="text-sm text-gray-500">
                  to {formatDate(event.endDateTime)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {event.category}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {event.eventType}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {event.viewCount || 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(event)}`}>
                  {getStatusText(event)}
                </span>
                {event.rejectedBy && event.rejectionReason && (
                  <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={event.rejectionReason}>
                    {event.rejectionReason}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onView(event)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  View
                </button>
                {!event.isApproved && (
                  <>
                    <button
                      onClick={() => onEdit(event)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(event)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<EventFilters>({
    status: 'all',
    page: 1,
    limit: 10
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    organizer: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    eventType: 'club',
    category: 'other',
    registrationRequired: false,
    isPublic: true,
    tags: []
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  // Feedback state
  const [eventFeedback, setEventFeedback] = useState<Array<{
    _id: string;
    message: string;
    sentBy: { _id: string; name: string; email: string; role: string };
    sentAt: string;
    isRead: boolean;
  }>>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, filters]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getMyEvents({
        ...filters,
        page: currentPage
      });
      
      setEvents(response.events);
      setTotalPages(response.pagination.totalPages);
      setTotalEvents(response.pagination.totalEvents);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setUploadingImage(!!selectedImage);
      
      // Clean the form data - remove undefined/null values for optional fields
      const cleanFormData = { ...formData };
      
      // Remove empty optional fields
      if (!cleanFormData.contactEmail) delete cleanFormData.contactEmail;
      if (!cleanFormData.contactPhone) delete cleanFormData.contactPhone;
      if (!cleanFormData.registrationDeadline) delete cleanFormData.registrationDeadline;
      if (!cleanFormData.maxAttendees) delete cleanFormData.maxAttendees;
      
      // Ensure arrays are arrays
      if (!cleanFormData.tags) cleanFormData.tags = [];
      
      // Use the new createEventWithImage function that handles both data and image
      await eventAPI.createEventWithImage(cleanFormData, selectedImage || undefined);
      
      setSuccess('Event created successfully and submitted for approval');
      setShowCreateModal(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      setLoading(true);
      setUploadingImage(!!selectedImage);
      
      // Clean the form data - remove undefined/null values for optional fields
      const cleanFormData = { ...formData };
      
      // Remove empty optional fields
      if (!cleanFormData.contactEmail) delete cleanFormData.contactEmail;
      if (!cleanFormData.contactPhone) delete cleanFormData.contactPhone;
      if (!cleanFormData.registrationDeadline) delete cleanFormData.registrationDeadline;
      if (!cleanFormData.maxAttendees) delete cleanFormData.maxAttendees;
      
      // Ensure arrays are arrays
      if (!cleanFormData.tags) cleanFormData.tags = [];
      
      // Use the new updateEventWithImage function that handles both data and image
      await eventAPI.updateEventWithImage(selectedEvent.id, cleanFormData, selectedImage || undefined);
      
      setSuccess('Event updated successfully');
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    const confirmMessage = `Are you sure you want to delete the event "${event.title}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await eventAPI.deleteEvent(event.id);
      setSuccess('Event deleted successfully');
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      organizer: event.organizer,
      location: event.location,
      startDateTime: event.startDateTime.slice(0, 16), // Format for datetime-local input
      endDateTime: event.endDateTime.slice(0, 16),
      eventType: event.eventType,
      category: event.category,
      registrationRequired: event.registrationRequired,
      registrationDeadline: event.registrationDeadline?.slice(0, 16),
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      isPublic: event.isPublic,
      tags: event.tags,
      imageUrl: event.imageUrl,
      maxAttendees: event.maxAttendees
    });
    
    // Set existing image as preview if available
    if (event.imageUrl) {
      setImagePreview(event.imageUrl);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null); // Clear any new selected image
    setTagInputValue(''); // Clear tag input value
    
    setShowEditModal(true);
  };

  const openViewModal = (event: Event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
    // Fetch feedback for this event
    fetchEventFeedback(event.id);
  };

  const fetchEventFeedback = async (eventId: string) => {
    try {
      setLoadingFeedback(true);
      const response = await eventAPI.getFeedback(eventId);
      setEventFeedback(response.feedback);
    } catch (err: any) {
      console.error('Failed to fetch feedback:', err);
      setEventFeedback([]);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const markFeedbackAsRead = async (feedbackId: string) => {
    if (!selectedEvent) return;
    
    try {
      await eventAPI.markFeedbackRead(selectedEvent.id, feedbackId);
      // Update local state
      setEventFeedback(prev => prev.map(feedback => 
        feedback._id === feedbackId ? { ...feedback, isRead: true } : feedback
      ));
    } catch (err: any) {
      console.error('Failed to mark feedback as read:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      organizer: '',
      location: '',
      startDateTime: '',
      endDateTime: '',
      eventType: 'club',
      category: 'other',
      registrationRequired: false,
      isPublic: true,
      tags: []
    });
    setSelectedImage(null);
    setImagePreview(null);
    setTagInputValue('');
  };

  const handleTagsChange = (value: string) => {
    setTagInputValue(value);
  };

  const processTagsInput = (value: string) => {
    // More comprehensive splitting: comma, semicolon, pipe, newline, or multiple spaces
    const tags = value
      .split(/[,;|\n]|\s{2,}/) // Split by comma, semicolon, pipe, newline, or 2+ spaces
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.toLowerCase()) // Normalize to lowercase
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
    
    return tags;
  };

  const addTagsFromInput = () => {
    if (tagInputValue.trim()) {
      const newTags = processTagsInput(tagInputValue);
      const currentTags = formData.tags || [];
      const combinedTags = [...currentTags, ...newTags].filter((tag, index, array) => 
        array.indexOf(tag) === index
      );
      setFormData({ ...formData, tags: combinedTags });
      setTagInputValue('');
    }
  };

  // Handle Enter key press to add tags
  const handleTagsKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTagsFromInput();
    }
  };

  // Handle blur event to add tags when user clicks away
  const handleTagsBlur = () => {
    addTagsFromInput();
  };

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Clear imageUrl from formData when editing
    if (showEditModal) {
      setFormData({ ...formData, imageUrl: undefined });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Use the same validation as handleImageSelect
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage your club events
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Status Filter */}
                <select
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Create Event Button */}
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't created any events yet. Create your first event to get started.
                  </p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First Event
                  </button>
                </div>
              ) : (
                <>
                  <EventTable
                    events={events}
                    onEdit={openEditModal}
                    onDelete={handleDeleteEvent}
                    onView={openViewModal}
                  />
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing page {currentPage} of {totalPages} ({totalEvents} total events)
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organizer *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="academic">Academic</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                  >
                    <option value="club">Club</option>
                    <option value="university">University</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                  <span className="text-xs text-gray-500 ml-2">(separate with commas, semicolons, or press Enter)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={tagInputValue}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  onKeyPress={handleTagsKeyPress}
                  onBlur={handleTagsBlur}
                  placeholder="e.g., networking, student-friendly, free food (press Enter to add)"
                />
                {tagInputValue.trim() && (
                  <p className="mt-1 text-xs text-blue-600">
                    Press Enter or click away to add: "{tagInputValue.split(/[,;|\n]|\s{2,}/).map(t => t.trim()).filter(t => t).join('", "')}
                  </p>
                )}
                {formData.tags && formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = formData.tags?.filter((_, i) => i !== index) || [];
                            setFormData({ ...formData, tags: newTags });
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registrationRequired-create"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.registrationRequired}
                    onChange={(e) => setFormData({ ...formData, registrationRequired: e.target.checked })}
                  />
                  <label htmlFor="registrationRequired-create" className="ml-2 block text-sm text-gray-900">
                    Registration Required
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic-create"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                  <label htmlFor="isPublic-create" className="ml-2 block text-sm text-gray-900">
                    Public Event
                  </label>
                </div>
              </div>

              {formData.registrationRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.registrationDeadline || ''}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Attendees</label>
                    <input
                      type="number"
                      min="1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.maxAttendees || ''}
                      onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {/* Event Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Flyer/Image</label>
                <div
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Event preview" 
                          className="mx-auto h-32 w-auto object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload an image</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading Image...' : loading ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal - Similar structure to Create Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Event</h3>
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organizer *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="academic">Academic</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                  >
                    <option value="club">Club</option>
                    <option value="university">University</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                  <span className="text-xs text-gray-500 ml-2">(separate with commas, semicolons, or press Enter)</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={tagInputValue}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  onKeyPress={handleTagsKeyPress}
                  onBlur={handleTagsBlur}
                  placeholder="e.g., networking, student-friendly, free food (press Enter to add)"
                />
                {tagInputValue.trim() && (
                  <p className="mt-1 text-xs text-blue-600">
                    Press Enter or click away to add: "{tagInputValue.split(/[,;|\n]|\s{2,}/).map(t => t.trim()).filter(t => t).join('", "')}
                  </p>
                )}
                {formData.tags && formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = formData.tags?.filter((_, i) => i !== index) || [];
                            setFormData({ ...formData, tags: newTags });
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registrationRequired-create"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.registrationRequired}
                    onChange={(e) => setFormData({ ...formData, registrationRequired: e.target.checked })}
                  />
                  <label htmlFor="registrationRequired-create" className="ml-2 block text-sm text-gray-900">
                    Registration Required
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic-create"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                  <label htmlFor="isPublic-create" className="ml-2 block text-sm text-gray-900">
                    Public Event
                  </label>
                </div>
              </div>

              {formData.registrationRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.registrationDeadline || ''}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Attendees</label>
                    <input
                      type="number"
                      min="1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.maxAttendees || ''}
                      onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {/* Event Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Flyer/Image</label>
                <div
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Event preview" 
                          className="mx-auto h-32 w-auto object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload an image</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading Image...' : loading ? 'Updating...' : 'Update Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedEvent.imageUrl && (
                <div>
                  <img 
                    src={selectedEvent.imageUrl} 
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-md shadow-sm"
                  />
                </div>
              )}
              
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-600">Organized by {selectedEvent.organizer}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedEvent.isApproved ? 'bg-green-100 text-green-800' : selectedEvent.rejectedBy ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedEvent.isApproved ? 'Approved' : selectedEvent.rejectedBy ? 'Rejected' : 'Pending'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedEvent.category}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {selectedEvent.eventType}
                  </span>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Description</h5>
                <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700">📍 Location</h5>
                  <p className="text-gray-600">{selectedEvent.location}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700">🎯 Event Type</h5>
                  <p className="text-gray-600 capitalize">{selectedEvent.eventType}</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700">🗓️ Date & Time</h5>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-600">
                    <span className="font-medium">Start:</span> {new Date(selectedEvent.startDateTime).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">End:</span> {new Date(selectedEvent.endDateTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Registration and Public Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700">📝 Registration</h5>
                  <p className="text-gray-600">
                    {selectedEvent.registrationRequired ? 'Required' : 'Not Required'}
                  </p>
                  {selectedEvent.registrationRequired && selectedEvent.registrationDeadline && (
                    <p className="text-sm text-gray-500">
                      Deadline: {new Date(selectedEvent.registrationDeadline).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-gray-700">🌐 Visibility</h5>
                  <p className="text-gray-600">
                    {selectedEvent.isPublic ? 'Public Event' : 'Private Event'}
                  </p>
                  {selectedEvent.maxAttendees && (
                    <p className="text-sm text-gray-500">
                      Max Attendees: {selectedEvent.maxAttendees}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {(selectedEvent.contactEmail || selectedEvent.contactPhone) && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">📞 Contact Information</h5>
                  <div className="bg-gray-50 p-3 rounded-md space-y-1">
                    {selectedEvent.contactEmail && (
                      <p className="text-gray-600">
                        <span className="font-medium">Email:</span> {selectedEvent.contactEmail}
                      </p>
                    )}
                    {selectedEvent.contactPhone && (
                      <p className="text-gray-600">
                        <span className="font-medium">Phone:</span> {selectedEvent.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Creator Information */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">👤 Created By</h5>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-600">
                    <span className="font-medium">{selectedEvent.createdBy.name}</span> ({selectedEvent.createdBy.role})
                  </p>
                  <p className="text-sm text-gray-500">{selectedEvent.createdBy.email}</p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(selectedEvent.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Approval Information */}
              {selectedEvent.isApproved && selectedEvent.approvedBy && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">✅ Approval Information</h5>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-green-700">
                      <span className="font-medium">Approved by:</span> {selectedEvent.approvedBy.name}
                    </p>
                    <p className="text-sm text-green-600">
                      {new Date(selectedEvent.approvedAt!).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Information */}
              {selectedEvent.rejectedBy && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">❌ Rejection Information</h5>
                  <div className="bg-red-50 p-3 rounded-md">
                    <p className="text-red-700">
                      <span className="font-medium">Rejected by:</span> {selectedEvent.rejectedBy.name}
                    </p>
                    {selectedEvent.rejectionReason && (
                      <p className="text-red-600 mt-1">
                        <span className="font-medium">Reason:</span> {selectedEvent.rejectionReason}
                      </p>
                    )}
                    <p className="text-sm text-red-600">
                      {new Date(selectedEvent.rejectedAt!).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Admin Feedback Section */}
              {eventFeedback && eventFeedback.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">💬 Admin Feedback</h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {eventFeedback.map((feedback) => (
                      <div 
                        key={feedback._id}
                        className={`p-3 rounded-md border-l-4 ${
                          feedback.isRead 
                            ? 'bg-gray-50 border-gray-300' 
                            : 'bg-blue-50 border-blue-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              {feedback.sentBy.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({feedback.sentBy.role})
                            </span>
                            {!feedback.isRead && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(feedback.sentAt).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {feedback.message}
                        </p>
                        {!feedback.isRead && (
                          <button
                            onClick={() => markFeedbackAsRead(feedback._id)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {loadingFeedback && (
                    <div className="text-center py-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedEvent.tags.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">🏷️ Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
