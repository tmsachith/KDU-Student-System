import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  getVerificationStatus: () => Promise<{ 
    isEmailVerified: boolean; 
    isGoogleUser: boolean; 
    canAccessDashboard: boolean; 
    email: string; 
    tokenExpired: boolean; 
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login({ email, password });
      
      // Block student access to web application
      if (response.user.role === 'student') {
        dispatch({ type: 'AUTH_FAILURE' });
        throw new Error('Students must use the mobile app. Please download the KDU Student Mobile App from your app store.');
      }
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };  const register = async (
    name: string,
    email: string,
    password: string,
    role?: string
  ): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Block student registration on web application
      if (role === 'student') {
        dispatch({ type: 'AUTH_FAILURE' });
        throw new Error('Student registration is not allowed on the web application. Please use the mobile app.');
      }
      
      const response = await authAPI.register({ 
        name, 
        email, 
        password, 
        role: role as 'student' | 'club' | 'admin' 
      });
      
      // Don't log in the user automatically after registration
      // They need to verify their email first
      dispatch({ type: 'AUTH_FAILURE' });
      
      // Show success message but don't authenticate
      throw new Error('Registration successful! Please check your email to verify your account before logging in.');
      
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };
  const checkAuth = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      dispatch({ type: 'AUTH_FAILURE' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.verifyToken();
      
      if (response.valid) {
        // Block student access to web application
        if (response.user.role === 'student') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_FAILURE' });
          return;
        }
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token },
        });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'AUTH_FAILURE' });
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'AUTH_FAILURE' });
    }  };
  const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.verifyEmail(token);
      
      if (response.verified && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
        
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Email verification failed' 
      };
    }
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.resendVerification(email);
      return { success: true, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to resend verification email' 
      };
    }
  };

  const getVerificationStatus = async () => {
    try {
      return await authAPI.getVerificationStatus();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check verification status');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    verifyEmail,
    resendVerification,
    getVerificationStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
