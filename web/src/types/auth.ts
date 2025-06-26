export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'club' | 'admin';
  isEmailVerified?: boolean;
  isGoogleUser?: boolean;
  createdAt?: string;
  joinedDate?: string;
  memberSince?: string;
  accountStatus?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'club' | 'admin';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
