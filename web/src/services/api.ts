import axios, { AxiosResponse } from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

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

export default api;
