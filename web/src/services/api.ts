import axios, { AxiosResponse } from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { 
  Event, 
  CreateEventRequest, 
  UpdateEventRequest, 
  EventsResponse, 
  AdminEventsResponse, 
  EventStatistics,
  EventFilters 
} from '../types/event';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response: AxiosResponse<{ user: User }> = await api.get('/auth/profile');
    return response.data;
  },

  // Verify token
  verifyToken: async (): Promise<{ valid: boolean; user: User }> => {
    const response: AxiosResponse<{ valid: boolean; user: User }> = await api.get('/auth/verify');
    return response.data;
  },

  // Test admin route
  testAdminRoute: async (): Promise<{ message: string; user: User }> => {
    const response: AxiosResponse<{ message: string; user: User }> = await api.get('/auth/admin-only');
    return response.data;
  },
  // Test club route
  testClubRoute: async (): Promise<{ message: string; user: User }> => {
    const response: AxiosResponse<{ message: string; user: User }> = await api.get('/auth/club-or-admin');
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ verified: boolean; message: string; token?: string; user?: User }> => {
    const response: AxiosResponse<{ verified: boolean; message: string; token?: string; user?: User }> = 
      await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Check verification status
  getVerificationStatus: async (): Promise<{ 
    isEmailVerified: boolean; 
    isGoogleUser: boolean; 
    canAccessDashboard: boolean; 
    email: string; 
    tokenExpired: boolean; 
  }> => {
    const response: AxiosResponse<{ 
      isEmailVerified: boolean; 
      isGoogleUser: boolean; 
      canAccessDashboard: boolean; 
      email: string; 
      tokenExpired: boolean; 
    }> = await api.get('/auth/verification-status');
    return response.data;
  },
};

// User Management API (Admin only)
export const userAPI = {
  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    verified?: boolean;
  }): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    statistics: {
      totalUsers: number;
      totalAdmins: number;
      totalClubs: number;
      totalStudents: number;
      verifiedUsers: number;
      googleUsers: number;
    };
  }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUser: async (id: string): Promise<{ user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'club' | 'admin';
    isEmailVerified?: boolean;
  }): Promise<{ message: string; user: User }> => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  // Update user
  updateUser: async (id: string, userData: {
    name?: string;
    email?: string;
    role?: 'student' | 'club' | 'admin';
    isEmailVerified?: boolean;
  }): Promise<{ message: string; user: User }> => {
    console.log('Updating user with ID:', id, 'Data:', userData);
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<{ message: string }> => {
    console.log('Deleting user with ID:', id);
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Toggle email verification status
  toggleVerification: async (id: string): Promise<{ message: string; user: User }> => {
    console.log('Toggling verification for user ID:', id);
    const response = await api.put(`/users/${id}/toggle-verification`);
    return response.data;
  },

  // Get user statistics
  getStats: async (): Promise<{
    overview: {
      totalUsers: number;
      totalAdmins: number;
      totalClubs: number;
      totalStudents: number;
      verifiedUsers: number;
      unverifiedUsers: number;
      googleUsers: number;
    };
    recentRegistrations: number;
    roleDistribution: Array<{
      _id: string;
      count: number;
      verified: number;
    }>;
  }> => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  },
};

// Event API
export const eventAPI = {
  // Get all approved events
  getEvents: async (filters: EventFilters = {}): Promise<EventsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  // Get event by ID
  getEvent: async (id: string): Promise<{ event: Event }> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create new event (Club/Admin only)
  createEvent: async (eventData: CreateEventRequest): Promise<{ message: string; event: Event }> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  // Create new event with image upload (Club/Admin only)
  createEventWithImage: async (eventData: CreateEventRequest, imageFile?: File): Promise<{ message: string; event: Event }> => {
    if (imageFile) {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Append all event data, filtering out empty optional fields
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Append image file
      formData.append('eventImage', imageFile);
      
      const response = await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No image, send as JSON
      const response = await api.post('/events', eventData);
      return response.data;
    }
  },

  // Update event (Creator/Admin only)
  updateEvent: async (id: string, eventData: UpdateEventRequest): Promise<{ message: string; event: Event }> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  // Update event with image upload (Creator/Admin only)
  updateEventWithImage: async (id: string, eventData: UpdateEventRequest, imageFile?: File): Promise<{ message: string; event: Event }> => {
    if (imageFile) {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Append all event data, filtering out empty optional fields
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Append image file
      formData.append('eventImage', imageFile);
      
      const response = await api.put(`/events/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No image, send as JSON
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    }
  },

  // Delete event (Creator/Admin only)
  deleteEvent: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Get user's events (Club/Admin only)
  getMyEvents: async (filters: EventFilters = {}): Promise<EventsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/events/my/events?${params.toString()}`);
    return response.data;
  },

  // Get all events for admin review (Admin only)
  getAdminEvents: async (filters: EventFilters = {}): Promise<AdminEventsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/events/admin/all?${params.toString()}`);
    return response.data;
  },

  // Approve event (Admin only)
  approveEvent: async (id: string): Promise<{ message: string; event: Event }> => {
    const response = await api.put(`/events/${id}/approve`);
    return response.data;
  },

  // Reject event (Admin only)
  rejectEvent: async (id: string, reason?: string): Promise<{ message: string; event: Event }> => {
    const response = await api.put(`/events/${id}/reject`, { reason });
    return response.data;
  },

  // Get event statistics (Admin only)
  getStatistics: async (): Promise<EventStatistics> => {
    const response = await api.get('/events/stats/overview');
    return response.data;
  },

  // Upload event image to Cloudinary
  uploadEventImage: async (imageFile: File): Promise<{ success: boolean; message: string; imageUrl: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('eventImage', imageFile);
    
    const response = await api.post('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete event image from Cloudinary
  deleteEventImage: async (publicId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/events/delete-image/${publicId}`);
    return response.data;
  },

  // Send feedback message to event creator (Admin only)
  sendFeedback: async (eventId: string, message: string): Promise<{ message: string; event: Event }> => {
    const response = await api.post(`/events/${eventId}/feedback`, { message });
    return response.data;
  },

  // Get feedback messages for an event (Creator/Admin only)
  getFeedback: async (eventId: string): Promise<{ 
    feedback: Array<{
      _id: string;
      message: string;
      sentBy: { _id: string; name: string; email: string; role: string };
      sentAt: string;
      isRead: boolean;
    }> 
  }> => {
    const response = await api.get(`/events/${eventId}/feedback`);
    return response.data;
  },

  // Mark feedback message as read (Creator only)
  markFeedbackRead: async (eventId: string, feedbackId: string): Promise<{ message: string; feedbackId: string }> => {
    const response = await api.put(`/events/${eventId}/feedback/${feedbackId}/read`);
    return response.data;
  },

  // Get total unread feedback count for user's events (Creator only)
  getUnreadFeedbackCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/events/feedback/unread-count');
    return response.data;
  },

  // Get club user's event statistics (Club only)
  getMyStatistics: async (): Promise<EventStatistics> => {
    const response = await api.get('/events/stats/my');
    return response.data;
  },

  // Track event view (for analytics)
  trackEventView: async (id: string, platform: 'web' | 'mobile' = 'mobile'): Promise<{ message: string; viewCount: number }> => {
    const response = await api.post(`/events/${id}/view`, { platform });
    return response.data;
  },

  // Get detailed club analytics
  getMyDetailedAnalytics: async (): Promise<{
    topViewedEvents: Array<{
      id: string;
      title: string;
      viewCount: number;
      startDateTime: string;
      isApproved: boolean;
    }>;
    recentViews: Array<{
      _id: string;
      count: number;
    }>;
    viewsByPlatform: Array<{
      _id: string;
      count: number;
    }>;
  }> => {
    const response = await api.get('/events/stats/my/detailed');
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  // Upload club logo (Club users only)
  uploadClubLogo: async (file: File): Promise<{ message: string; logoUrl: string; user: User }> => {
    const formData = new FormData();
    formData.append('clubLogo', file);
    
    const response = await api.post('/profile/upload-club-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove club logo (Club users only)
  removeClubLogo: async (): Promise<{ message: string; user: User }> => {
    const response = await api.delete('/profile/remove-club-logo');
    return response.data;
  },

  // Update user name
  updateName: async (name: string): Promise<{ message: string; user: User }> => {
    const response = await api.put('/profile/name', { name });
    return response.data;
  },

  // Upload profile image
  uploadProfileImage: async (file: File): Promise<{ message: string; imageUrl: string; user: User }> => {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await api.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove profile image
  removeProfileImage: async (): Promise<{ message: string; user: User }> => {
    const response = await api.delete('/profile/remove-image');
    return response.data;
  },
};

export default api;
