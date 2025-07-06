import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import { Event, EventFilters, EventStatistics } from '../types/event';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <div className={`${color} rounded-lg p-6`}>
    <div className="flex items-center">
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <p className="text-sm font-medium opacity-75">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

interface AdminEventTableProps {
  events: Event[];
  onApprove: (event: Event) => void;
  onReject: (event: Event) => void;
  onView: (event: Event) => void;
  onSendFeedback: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const AdminEventTable: React.FC<AdminEventTableProps> = ({ 
  events, 
  onApprove, 
  onReject, 
  onView, 
  onSendFeedback, 
  onDelete 
}) => {
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      academic: 'bg-blue-100 text-blue-800',
      cultural: 'bg-pink-100 text-pink-800',
      sports: 'bg-green-100 text-green-800',
      workshop: 'bg-orange-100 text-orange-800',
      seminar: 'bg-purple-100 text-purple-800',
      social: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
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
              Organizer
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
                  <div className="text-sm text-gray-500">{event.location}</div>
                  <div className="text-sm text-gray-500">
                    {event.eventType === 'university' ? '🏛️ University' : '👥 Club'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{event.organizer}</div>
                <div className="text-sm text-gray-500">
                  Created by: {event.createdBy.name}
                </div>
                <div className="text-sm text-gray-500">
                  Role: {event.createdBy.role}
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                  {event.category}
                </span>
                {event.tags.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {event.tags.slice(0, 2).join(', ')}
                    {event.tags.length > 2 && ' +' + (event.tags.length - 2)}
                  </div>
                )}
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
                {event.approvedBy && (
                  <div className="text-xs text-green-600 mt-1">
                    Approved by: {event.approvedBy.name}
                  </div>
                )}
                {event.rejectedBy && (
                  <div className="text-xs text-red-600 mt-1">
                    Rejected by: {event.rejectedBy.name}
                  </div>
                )}
                {event.rejectedBy && event.rejectionReason && (
                  <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={event.rejectionReason}>
                    Reason: {event.rejectionReason}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => onView(event)}
                    className="text-blue-600 hover:text-blue-900 text-left"
                  >
                    View Details
                  </button>
                  
                  {!event.isApproved && !event.rejectedBy && (
                    <>
                      <button
                        onClick={() => onApprove(event)}
                        className="text-green-600 hover:text-green-900 text-left"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(event)}
                        className="text-red-600 hover:text-red-900 text-left"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onSendFeedback(event)}
                        className="text-blue-600 hover:text-blue-900 text-left"
                      >
                        Send Feedback
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => onDelete(event)}
                    className="text-red-600 hover:text-red-900 text-left"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminEventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<EventFilters>({
    status: 'pending',
    page: 1,
    limit: 10
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{
    _id: string;
    message: string;
    sentBy: { _id: string; name: string; email: string; role: string };
    sentAt: string;
    isRead: boolean;
  }>>([]);
  const [loadingFeedbackHistory, setLoadingFeedbackHistory] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchStatistics();
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
      const response = await eventAPI.getAdminEvents({
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

  const fetchStatistics = async () => {
    try {
      const stats = await eventAPI.getStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleApproveEvent = async (event: Event) => {
    const confirmMessage = `Are you sure you want to approve the event "${event.title}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await eventAPI.approveEvent(event.id);
      setSuccess(`Event "${event.title}" approved successfully`);
      fetchEvents();
      fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve event');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEvent = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      await eventAPI.rejectEvent(selectedEvent.id, rejectReason);
      setSuccess(`Event "${selectedEvent.title}" rejected successfully`);
      setShowRejectModal(false);
      setSelectedEvent(null);
      setRejectReason('');
      fetchEvents();
      fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    const confirmMessage = `⚠️ PERMANENT ACTION ⚠️\n\nAre you sure you want to permanently delete the event "${event.title}"?\n\nThis action cannot be undone and will remove all associated data.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await eventAPI.deleteEvent(event.id);
      setSuccess(`Event "${event.title}" deleted successfully`);
      fetchEvents();
      fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!selectedEvent || !feedbackMessage.trim()) return;

    try {
      setLoading(true);
      await eventAPI.sendFeedback(selectedEvent.id, feedbackMessage.trim());
      setSuccess(`Feedback sent to ${selectedEvent.createdBy.name} successfully`);
      setShowFeedbackModal(false);
      setSelectedEvent(null);
      setFeedbackMessage('');
      setFeedbackHistory([]);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackHistory = async (eventId: string) => {
    try {
      setLoadingFeedbackHistory(true);
      const response = await eventAPI.getFeedback(eventId);
      setFeedbackHistory(response.feedback);
    } catch (err: any) {
      console.error('Failed to fetch feedback history:', err);
      setFeedbackHistory([]);
    } finally {
      setLoadingFeedbackHistory(false);
    }
  };

  const openRejectModal = (event: Event) => {
    setSelectedEvent(event);
    setShowRejectModal(true);
  };

  const openViewModal = (event: Event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const openFeedbackModal = (event: Event) => {
    setSelectedEvent(event);
    setFeedbackMessage('');
    setFeedbackHistory([]);
    setShowFeedbackModal(true);
    // Fetch feedback history for this event
    fetchFeedbackHistory(event.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and manage all event submissions
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Events"
              value={statistics.overview.totalEvents}
              icon="📅"
              color="bg-blue-500 text-white"
            />
            <StatsCard
              title="Pending Approval"
              value={statistics.overview.pendingEvents}
              icon="⏳"
              color="bg-yellow-500 text-white"
            />
            <StatsCard
              title="Approved Events"
              value={statistics.overview.approvedEvents}
              icon="✅"
              color="bg-green-500 text-white"
            />
            <StatsCard
              title="Upcoming Events"
              value={statistics.overview.upcomingEvents}
              icon="🚀"
              color="bg-purple-500 text-white"
            />
          </div>
        )}

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

        {/* Filters */}
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Category Filter */}
                <select
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.category || 'all'}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value === 'all' ? undefined : e.target.value })}
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>

                {/* Event Type Filter */}
                <select
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.eventType || 'all'}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value === 'all' ? undefined : e.target.value })}
                >
                  <option value="all">All Types</option>
                  <option value="university">University</option>
                  <option value="club">Club</option>
                </select>
              </div>

              <div className="text-sm text-gray-700">
                Total: {totalEvents} events
              </div>
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
                  <p className="text-gray-600">
                    No events match your current filters.
                  </p>
                </div>
              ) : (
                <>
                  <AdminEventTable
                    events={events}
                    onApprove={handleApproveEvent}
                    onReject={openRejectModal}
                    onView={openViewModal}
                    onSendFeedback={openFeedbackModal}
                    onDelete={handleDeleteEvent}
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

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Event Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Event Image */}
              {selectedEvent.imageUrl && (
                <div>
                  <img 
                    src={selectedEvent.imageUrl} 
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Event Header */}
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h4>
                <p className="text-lg text-gray-600 mb-3">Organized by {selectedEvent.organizer}</p>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEvent.isApproved 
                      ? 'bg-green-100 text-green-800'
                      : selectedEvent.rejectedBy
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedEvent.isApproved ? 'Approved' : selectedEvent.rejectedBy ? 'Rejected' : 'Pending'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {selectedEvent.category}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {selectedEvent.eventType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">📝 Description</h5>
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-md">{selectedEvent.description}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">📍 Location</h5>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{selectedEvent.location}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">🗓️ Date & Time</h5>
                    <div className="bg-gray-50 p-3 rounded-md space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Start:</span> {new Date(selectedEvent.startDateTime).toLocaleString()}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">End:</span> {new Date(selectedEvent.endDateTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">👤 Created By</h5>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-600">
                        <span className="font-medium">{selectedEvent.createdBy.name}</span> ({selectedEvent.createdBy.role})
                      </p>
                      <p className="text-gray-500 text-sm">{selectedEvent.createdBy.email}</p>
                      <p className="text-gray-500 text-sm">
                        Created: {new Date(selectedEvent.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Event Settings */}
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">⚙️ Event Settings</h5>
                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Registration Required:</span>
                        <span className={`px-2 py-1 rounded text-sm ${selectedEvent.registrationRequired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedEvent.registrationRequired ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Public Event:</span>
                        <span className={`px-2 py-1 rounded text-sm ${selectedEvent.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedEvent.isPublic ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {selectedEvent.maxAttendees && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Max Attendees:</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                            {selectedEvent.maxAttendees}
                          </span>
                        </div>
                      )}
                      {selectedEvent.registrationRequired && selectedEvent.registrationDeadline && (
                        <div className="pt-2 border-t">
                          <span className="text-gray-600 text-sm">Registration Deadline:</span>
                          <p className="text-gray-500 text-sm">
                            {new Date(selectedEvent.registrationDeadline).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  {(selectedEvent.contactEmail || selectedEvent.contactPhone) && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">📞 Contact Information</h5>
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

                  {/* Approval/Rejection Information */}
                  {selectedEvent.isApproved && selectedEvent.approvedBy && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">✅ Approval Information</h5>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-green-700">
                          <span className="font-medium">Approved by:</span> {selectedEvent.approvedBy.name}
                        </p>
                        <p className="text-green-600 text-sm">{selectedEvent.approvedBy.email}</p>
                        <p className="text-green-600 text-sm">
                          {new Date(selectedEvent.approvedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.rejectedBy && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">❌ Rejection Information</h5>
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="text-red-700">
                          <span className="font-medium">Rejected by:</span> {selectedEvent.rejectedBy.name}
                        </p>
                        <p className="text-red-600 text-sm">{selectedEvent.rejectedBy.email}</p>
                        {selectedEvent.rejectionReason && (
                          <p className="text-red-600 mt-1">
                            <span className="font-medium">Reason:</span> {selectedEvent.rejectionReason}
                          </p>
                        )}
                        <p className="text-red-600 text-sm">
                          {new Date(selectedEvent.rejectedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information Section */}
              {(selectedEvent.tags.length > 0 || selectedEvent.attendees.length > 0) && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedEvent.tags.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-700 mb-2">🏷️ Tags</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedEvent.attendees.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-700 mb-2">👥 Attendees</h5>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                          {selectedEvent.attendees.length} registered attendee{selectedEvent.attendees.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons for pending events */}
            {!selectedEvent.isApproved && !selectedEvent.rejectedBy && (
              <div className="mt-6 border-t pt-4 flex space-x-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleApproveEvent(selectedEvent);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve Event
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openRejectModal(selectedEvent);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Event Modal */}
      {showRejectModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Event</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject the event "{selectedEvent.title}"?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleRejectEvent}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Event'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedEvent(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Feedback Modal */}
      {showFeedbackModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Feedback</h3>
            <p className="text-gray-600 mb-4">
              Send feedback to <span className="font-medium">{selectedEvent.createdBy.name}</span> about the event "{selectedEvent.title}".
            </p>
            
            {/* Feedback History Section */}
            {loadingFeedbackHistory ? (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">📬 Previous Feedback</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-center text-gray-500 mt-2">Loading feedback history...</p>
                </div>
              </div>
            ) : feedbackHistory && feedbackHistory.length > 0 ? (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">📬 Previous Feedback ({feedbackHistory.length} messages)</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {feedbackHistory.map((feedback) => (
                    <div
                      key={feedback._id}
                      className={`p-3 rounded-md border-l-4 ${
                        feedback.isRead ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {feedback.sentBy.name} ({feedback.sentBy.role})
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.sentAt).toLocaleDateString()} {new Date(feedback.sentAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{feedback.message}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          feedback.isRead ? 'bg-gray-200 text-gray-600' : 'bg-blue-200 text-blue-700'
                        }`}>
                          {feedback.isRead ? '✓ Read by club' : '○ Unread'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  💡 Tip: Consider if your new feedback addresses different concerns or provides additional clarity.
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">📬 Previous Feedback</h4>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-gray-500 text-sm">No previous feedback has been sent for this event.</p>
                  <p className="text-gray-400 text-xs mt-1">This will be the first feedback message.</p>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Feedback Message *
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Please provide specific feedback about what needs to be changed or improved in this event..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will help the club improve their event before resubmission.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSendFeedback}
                disabled={loading || !feedbackMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Feedback'}
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedEvent(null);
                  setFeedbackMessage('');
                  setFeedbackHistory([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventManagement;
