import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';

const Dashboard: React.FC = () => {
  const { user, logout, getVerificationStatus } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'user-management'>('dashboard');

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const status = await getVerificationStatus();
        setVerificationStatus(status);
      } catch (error) {
        console.error('Failed to check verification status:', error);
      } finally {
        setStatusLoading(false);
      }
    };

    if (user) {
      checkVerificationStatus();
    }
  }, [user, getVerificationStatus]);

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'club':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user can access dashboard
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus && !verificationStatus.canAccessDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Email Verification Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please verify your email address to access the dashboard. Check your inbox for a verification link.
          </p>
          <p className="text-xs text-gray-500">
            Email: {user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">KDU Student System</h1>
            </div>            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome back,</span>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                  user?.role || ''
                )}`}
              >
                {user?.role?.toUpperCase()}
              </span>
              
              {/* Admin Navigation */}
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentView === 'dashboard'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('user-management')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentView === 'user-management'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    User Management
                  </button>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentView === 'user-management' ? (
          <UserManagement />
        ) : (
          <>
            {/* User Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Your Profile</dt>
                    <dd className="text-lg font-medium text-gray-900">{user?.name}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-gray-500">Email: </span>
                <span className="text-gray-900">{user?.email}</span>
              </div>
              <div className="text-sm mt-1">
                <span className="font-medium text-gray-500">Role: </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Membership Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Member Since</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatDate(user?.joinedDate || user?.createdAt)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-gray-500">Joined: </span>
                <span className="text-gray-900">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {user?.isEmailVerified ? (
                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Account Status</dt>
                    <dd className={`text-lg font-medium ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user?.accountStatus || (user?.isEmailVerified ? 'Active' : 'Pending Verification')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium text-gray-500">Email Verified: </span>
                  <span className={user?.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
                    {user?.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                {user?.isGoogleUser && (
                  <div>
                    <span className="font-medium text-gray-500">Google Account: </span>
                    <span className="text-blue-600">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Welcome to KDU Student System</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                You have successfully logged in to the KDU Student System dashboard. 
                Here you can access all the features and services available to {user?.role}s.
              </p>
            </div>
            <div className="mt-5">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">System Information</h3>                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Your account was created on {formatDate(user?.createdAt)} and you are currently logged in as a {user?.role}.
                        {user?.isEmailVerified ? ' Your email has been verified.' : ' Please verify your email to access all features.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
