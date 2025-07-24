import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
    role: string;
  };
  category: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_update';
  isApproved: boolean;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  adminFeedback?: Array<{
    _id: string;
    message: string;
    sentBy: { _id: string; name: string; email: string; role: string };
    sentAt: string;
    isRead: boolean;
  }>;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsUpdate: number;
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

interface AdminDiscussionTableProps {
  discussions: Discussion[];
  onApprove: (discussion: Discussion) => void;
  onReject: (discussion: Discussion) => void;
  onView: (discussion: Discussion) => void;
  onSendFeedback: (discussion: Discussion) => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <div className={`${color} rounded-lg p-6 shadow-md`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

const AdminDiscussionTable: React.FC<AdminDiscussionTableProps> = ({
  discussions,
  onApprove,
  onReject,
  onView,
  onSendFeedback,
}) => {
  const getStatusBadge = (discussion: Discussion) => {
    if (discussion.isApproved) return 'bg-green-100 text-green-800';
    if (discussion.status === 'rejected') return 'bg-red-100 text-red-800';
    if (discussion.status === 'needs_update') return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (discussion: Discussion) => {
    if (discussion.isApproved) return 'Approved';
    if (discussion.status === 'rejected') return 'Rejected';
    if (discussion.status === 'needs_update') return 'Needs Update';
    return 'Pending';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Discussion
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Author
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Engagement
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {discussions.map((discussion) => (
            <tr key={discussion._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {discussion.title}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {discussion.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(discussion.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img 
                      className="h-10 w-10 rounded-full object-cover" 
                      src={discussion.author.profileImageUrl || `/api/placeholder/40/40`}
                      alt={discussion.author.name}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {discussion.author.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {discussion.author.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {discussion.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {discussion.likeCount || 0}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {discussion.commentCount || 0}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {discussion.viewCount || 0}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(discussion)}`}>
                  {getStatusText(discussion)}
                </span>
                {discussion.approvedBy && (
                  <div className="text-xs text-green-600 mt-1">
                    Approved by: {discussion.approvedBy.name}
                  </div>
                )}
                {discussion.rejectedBy && (
                  <div className="text-xs text-red-600 mt-1">
                    Rejected by: {discussion.rejectedBy.name}
                  </div>
                )}
                {discussion.rejectedBy && discussion.rejectionReason && (
                  <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={discussion.rejectionReason}>
                    Reason: {discussion.rejectionReason}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => onView(discussion)}
                    className="text-blue-600 hover:text-blue-900 text-left"
                  >
                    View Details
                  </button>
                  
                  {!discussion.isApproved && discussion.status !== 'rejected' && (
                    <>
                      <button
                        onClick={() => onApprove(discussion)}
                        className="text-green-600 hover:text-green-900 text-left"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(discussion)}
                        className="text-red-600 hover:text-red-900 text-left"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => onSendFeedback(discussion)}
                    className="text-purple-600 hover:text-purple-900 text-left"
                  >
                    Send Feedback
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

const AdminDiscussionManagement: React.FC = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filters
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    search: '',
    page: 1,
    limit: 10
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiscussions, setTotalDiscussions] = useState(0);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
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

  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  useEffect(() => {
    fetchDiscussions();
    fetchStatistics();
  }, [filters]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({
        status: filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      if (filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }

      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      const response = await axios.get(
        `${API_BASE_URL}/discussions/admin/all?${queryParams}`,
        axiosConfig
      );

      setDiscussions(response.data.discussions);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.totalPages);
      setTotalDiscussions(response.data.pagination.totalItems);
      setStatistics(response.data.statistics);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch discussions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/discussions/admin/all?status=all&limit=1`,
        axiosConfig
      );
      setStatistics(response.data.statistics);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleApproveDiscussion = async (discussion: Discussion) => {
    const confirmMessage = `Are you sure you want to approve the discussion "${discussion.title}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/discussions/${discussion._id}/approve`, {}, axiosConfig);
      setSuccess(`Discussion "${discussion.title}" approved successfully`);
      fetchDiscussions();
      fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDiscussion = async () => {
    if (!selectedDiscussion) return;

    try {
      setLoading(true);
      await axios.put(
        `${API_BASE_URL}/discussions/${selectedDiscussion._id}/reject`,
        { reason: rejectReason },
        axiosConfig
      );
      setSuccess(`Discussion "${selectedDiscussion.title}" rejected successfully`);
      setShowRejectModal(false);
      setSelectedDiscussion(null);
      setRejectReason('');
      fetchDiscussions();
      fetchStatistics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!selectedDiscussion || !feedbackMessage.trim()) return;

    try {
      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/discussions/${selectedDiscussion._id}/feedback`,
        { message: feedbackMessage },
        axiosConfig
      );
      setSuccess(`Feedback sent to ${selectedDiscussion.author.name} successfully`);
      setShowFeedbackModal(false);
      setSelectedDiscussion(null);
      setFeedbackMessage('');
      setFeedbackHistory([]);
      fetchDiscussions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackHistory = async (discussionId: string) => {
    try {
      setLoadingFeedbackHistory(true);
      const response = await axios.get(`${API_BASE_URL}/discussions/${discussionId}/feedback`, axiosConfig);
      setFeedbackHistory(response.data.feedback);
    } catch (err: any) {
      console.error('Failed to fetch feedback history:', err);
      setFeedbackHistory([]);
    } finally {
      setLoadingFeedbackHistory(false);
    }
  };

  const openRejectModal = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setShowRejectModal(true);
  };

  const openViewModal = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setShowViewModal(true);
  };

  const openFeedbackModal = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setFeedbackMessage('');
    setFeedbackHistory([]);
    setShowFeedbackModal(true);
    fetchFeedbackHistory(discussion._id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Discussion Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and manage all discussion submissions
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Total Discussions"
              value={statistics.total}
              icon="💬"
              color="bg-blue-500 text-white"
            />
            <StatsCard
              title="Pending Approval"
              value={statistics.pending}
              icon="⏳"
              color="bg-yellow-500 text-white"
            />
            <StatsCard
              title="Approved"
              value={statistics.approved}
              icon="✅"
              color="bg-green-500 text-white"
            />
            <StatsCard
              title="Rejected"
              value={statistics.rejected}
              icon="❌"
              color="bg-red-500 text-white"
            />
            <StatsCard
              title="Needs Update"
              value={statistics.needsUpdate}
              icon="🔄"
              color="bg-orange-500 text-white"
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
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_update">Needs Update</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="events">Events</option>
                <option value="technical">Technical</option>
                <option value="announcements">Announcements</option>
                <option value="help">Help</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                placeholder="Search discussions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSuccess('');
                  setError('');
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading discussions...</p>
          </div>
        )}

        {/* Discussions Table */}
        {!loading && (
          <>
            <AdminDiscussionTable
              discussions={discussions}
              onApprove={handleApproveDiscussion}
              onReject={openRejectModal}
              onView={openViewModal}
              onSendFeedback={openFeedbackModal}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
                    {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Discussion Modal */}
      {showViewModal && selectedDiscussion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Discussion Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Discussion Header */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedDiscussion.isApproved 
                      ? 'bg-green-100 text-green-800'
                      : selectedDiscussion.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : selectedDiscussion.status === 'needs_update'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedDiscussion.isApproved ? 'Approved' : selectedDiscussion.status === 'rejected' ? 'Rejected' : selectedDiscussion.status === 'needs_update' ? 'Needs Update' : 'Pending'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {selectedDiscussion.category}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedDiscussion.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedDiscussion.content}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">👤 Author Information</h5>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <img 
                          className="h-10 w-10 rounded-full object-cover mr-3" 
                          src={selectedDiscussion.author.profileImageUrl || `/api/placeholder/40/40`}
                          alt={selectedDiscussion.author.name}
                        />
                        <div>
                          <p className="font-medium">{selectedDiscussion.author.name}</p>
                          <p className="text-sm text-gray-600">{selectedDiscussion.author.email}</p>
                          <p className="text-sm text-gray-500 capitalize">{selectedDiscussion.author.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedDiscussion.tags.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">🏷️ Tags</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedDiscussion.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">📊 Engagement Stats</h5>
                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span className="font-medium">{selectedDiscussion.viewCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Likes:</span>
                        <span className="font-medium">{selectedDiscussion.likeCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comments:</span>
                        <span className="font-medium">{selectedDiscussion.commentCount}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">📅 Timeline</h5>
                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Created:</span> {new Date(selectedDiscussion.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Updated:</span> {new Date(selectedDiscussion.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Approval Information */}
                  {selectedDiscussion.isApproved && selectedDiscussion.approvedBy && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">✅ Approval Information</h5>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-green-700">
                          <span className="font-medium">Approved by:</span> {selectedDiscussion.approvedBy.name}
                        </p>
                        <p className="text-green-600 text-sm">{selectedDiscussion.approvedBy.email}</p>
                        <p className="text-green-600 text-sm">
                          {new Date(selectedDiscussion.approvedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rejection Information */}
                  {selectedDiscussion.rejectedBy && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">❌ Rejection Information</h5>
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="text-red-700">
                          <span className="font-medium">Rejected by:</span> {selectedDiscussion.rejectedBy.name}
                        </p>
                        <p className="text-red-600 text-sm">{selectedDiscussion.rejectedBy.email}</p>
                        {selectedDiscussion.rejectionReason && (
                          <p className="text-red-600 mt-1">
                            <span className="font-medium">Reason:</span> {selectedDiscussion.rejectionReason}
                          </p>
                        )}
                        <p className="text-red-600 text-sm">
                          {new Date(selectedDiscussion.rejectedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons for pending discussions */}
            {!selectedDiscussion.isApproved && selectedDiscussion.status !== 'rejected' && (
              <div className="mt-6 border-t pt-4 flex space-x-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleApproveDiscussion(selectedDiscussion);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve Discussion
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openRejectModal(selectedDiscussion);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject Discussion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Discussion Modal */}
      {showRejectModal && selectedDiscussion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Discussion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject "{selectedDiscussion.title}"?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide a reason for rejection..."
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleRejectDiscussion}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Discussion'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDiscussion(null);
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
      {showFeedbackModal && selectedDiscussion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Feedback</h3>
            <p className="text-gray-600 mb-4">
              Send feedback to <span className="font-medium">{selectedDiscussion.author.name}</span> about the discussion "{selectedDiscussion.title}".
            </p>
            
            {/* Feedback History Section */}
            {loadingFeedbackHistory ? (
              <div className="mb-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : feedbackHistory.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Previous Feedback</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {feedbackHistory.map((feedback) => (
                    <div key={feedback._id} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-blue-600">
                          {feedback.sentBy.name} ({feedback.sentBy.role})
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{feedback.message}</p>
                      {feedback.isRead && (
                        <span className="inline-block mt-1 text-xs text-green-600">✓ Read</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Message
              </label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide specific feedback about what needs to be changed or improved in this discussion..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will help the user improve their discussion before resubmission.
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
                  setSelectedDiscussion(null);
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

export default AdminDiscussionManagement;
