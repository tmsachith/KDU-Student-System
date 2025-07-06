import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';
import EventManagement from './EventManagement';
import AdminEventManagement from './AdminEventManagement';
import { userAPI, eventAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout, getVerificationStatus } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'user-management' | 'event-management' | 'admin-events'>('dashboard');
  
  // Dashboard insights state
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

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
      fetchDashboardStats(); // Fetch stats when user loads
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

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const promises: Promise<any>[] = [];
      
      // Fetch user stats (admin only)
      if (user?.role === 'admin') {
        promises.push(userAPI.getStats());
      }
      
      // Fetch event stats (admin and club)
      if (user?.role === 'admin') {
        promises.push(eventAPI.getStatistics());
      } else if (user?.role === 'club') {
        promises.push(eventAPI.getMyStatistics());
      }

      // For club users, also get their personal event stats
      if (user?.role === 'club') {
        promises.push(eventAPI.getMyEvents({ page: 1, limit: 1000 })); // Get all events for detailed analysis
      }

      const results = await Promise.all(promises);
      
      let userStats = null;
      let eventStats = null;
      let clubEventDetails = null;
      
      if (user?.role === 'admin') {
        userStats = results[0];
        eventStats = results[1];
      } else if (user?.role === 'club') {
        eventStats = results[0];
        clubEventDetails = results[1];
      }
      
      setDashboardStats({
        userStats,
        eventStats,
        clubEventDetails
      });
    } catch (err: any) {
      setStatsError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getVerificationRate = (): number => {
    if (!dashboardStats?.userStats?.overview?.totalUsers) return 0;
    return Math.round((dashboardStats.userStats.overview.verifiedUsers / dashboardStats.userStats.overview.totalUsers) * 100);
  };

  const getApprovalRate = (): number => {
    if (!dashboardStats?.eventStats?.overview?.totalEvents) return 0;
    return Math.round((dashboardStats.eventStats.overview.approvedEvents / dashboardStats.eventStats.overview.totalEvents) * 100);
  };

  const getClubEventStats = () => {
    if (!dashboardStats?.eventStats?.overview) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    
    const overview = dashboardStats.eventStats.overview;
    return {
      total: overview.totalEvents,
      approved: overview.approvedEvents,
      pending: overview.pendingEvents,
      rejected: overview.rejectedEvents
    };
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
                  <button
                    onClick={() => setCurrentView('admin-events')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentView === 'admin-events'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Event Management
                  </button>
                </div>
              )}
              
              {/* Club Navigation */}
              {user?.role === 'club' && (
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
                    onClick={() => setCurrentView('event-management')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentView === 'event-management'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    My Events
                  </button>
                </div>
              )}
              
              {/* Student Navigation */}
              {user?.role === 'student' && (
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
                    onClick={() => setCurrentView('event-management')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentView === 'event-management'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Events
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
        ) : currentView === 'admin-events' ? (
          <AdminEventManagement />
        ) : currentView === 'event-management' ? (
          <EventManagement />
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

        {/* Dashboard Insights */}
        {statsLoading ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard insights...</p>
          </div>
        ) : statsError ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Insights</h3>
            <p className="text-gray-600 mb-6">{statsError}</p>
            <button
              onClick={fetchDashboardStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Admin User Analytics */}
            {user?.role === 'admin' && dashboardStats?.userStats && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">User Analytics</h2>
                
                {/* User Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-blue-100">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                            <dd className="text-2xl font-bold text-blue-600">{dashboardStats.userStats.overview.totalUsers}</dd>
                            <dd className="text-sm text-gray-500">{dashboardStats.userStats.recentRegistrations} new this month</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Verified Users</dt>
                            <dd className="text-2xl font-bold text-green-600">
                              {dashboardStats.userStats.overview.verifiedUsers} ({getVerificationRate()}%)
                            </dd>
                            <dd className="text-sm text-gray-500">{dashboardStats.userStats.overview.unverifiedUsers} pending</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-purple-100">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Students</dt>
                            <dd className="text-2xl font-bold text-purple-600">{dashboardStats.userStats.overview.totalStudents}</dd>
                            <dd className="text-sm text-gray-500">
                              {calculatePercentage(dashboardStats.userStats.overview.totalStudents, dashboardStats.userStats.overview.totalUsers)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Google Users</dt>
                            <dd className="text-2xl font-bold text-red-600">{dashboardStats.userStats.overview.googleUsers}</dd>
                            <dd className="text-sm text-gray-500">
                              {calculatePercentage(dashboardStats.userStats.overview.googleUsers, dashboardStats.userStats.overview.totalUsers)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Distribution */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Role Distribution</h3>
                  <div className="space-y-4">
                    {dashboardStats.userStats.roleDistribution.map((role: any) => (
                      <div key={role._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            role._id === 'admin' ? 'bg-red-100 text-red-800' :
                            role._id === 'club' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {role._id.toUpperCase()}
                          </span>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {role.count} users
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {role.verified}/{role.count} verified
                          </div>
                          <div className="text-xs text-gray-400">
                            {calculatePercentage(role.verified, role.count)} verification rate
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Event Analytics for Admin and Club */}
            {(user?.role === 'admin' || user?.role === 'club') && dashboardStats?.eventStats && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {user?.role === 'admin' ? 'System Event Analytics' : 'Your Event Analytics'}
                </h2>
                
                {/* Event Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-indigo-100">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                            <dd className="text-2xl font-bold text-indigo-600">
                              {user?.role === 'club' ? 
                                getClubEventStats().total : 
                                dashboardStats.eventStats.overview.totalEvents
                              }
                            </dd>
                            <dd className="text-sm text-gray-500">
                              {user?.role === 'admin' ? 
                                `${dashboardStats.eventStats.overview.thisMonthEvents} created this month` :
                                'Events you created'
                              }
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Approved Events</dt>
                            <dd className="text-2xl font-bold text-green-600">
                              {user?.role === 'club' ? 
                                `${getClubEventStats().approved} (${getClubEventStats().total > 0 ? Math.round((getClubEventStats().approved / getClubEventStats().total) * 100) : 0}%)` :
                                `${dashboardStats.eventStats.overview.approvedEvents} (${getApprovalRate()}%)`
                              }
                            </dd>
                            <dd className="text-sm text-gray-500">
                              {user?.role === 'admin' ? 
                                `${dashboardStats.eventStats.overview.upcomingEvents} upcoming` :
                                'Successfully approved'
                              }
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-yellow-100">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Events</dt>
                            <dd className="text-2xl font-bold text-yellow-600">
                              {user?.role === 'club' ? 
                                getClubEventStats().pending : 
                                dashboardStats.eventStats.overview.pendingEvents
                              }
                            </dd>
                            <dd className="text-sm text-gray-500">Awaiting approval</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 rounded-md bg-purple-100">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {user?.role === 'club' ? 'Total Views' : 'Rejected Events'}
                            </dt>
                            <dd className="text-2xl font-bold text-purple-600">
                              {user?.role === 'club' ? 
                                dashboardStats.eventStats.viewStats?.totalViews || 0 :
                                dashboardStats.eventStats.overview.rejectedEvents
                              }
                            </dd>
                            <dd className="text-sm text-gray-500">
                              {user?.role === 'club' ? 
                                `Avg: ${Math.round(dashboardStats.eventStats.viewStats?.avgViewsPerEvent || 0)} per event` :
                                'Need revision'
                              }
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Club View Analytics */}
                {user?.role === 'club' && dashboardStats.eventStats.viewStats && (
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">View Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {dashboardStats.eventStats.viewStats.totalViews}
                        </div>
                        <div className="text-sm text-gray-600">Total Views</div>
                        <div className="text-xs text-gray-500 mt-1">
                          From mobile app users
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(dashboardStats.eventStats.viewStats.avgViewsPerEvent)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Views/Event</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Performance metric
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {dashboardStats.eventStats.viewStats.mostViewedEvent}
                        </div>
                        <div className="text-sm text-gray-600">Most Viewed</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Single event record
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Category & Type Distribution */}
                {((user?.role === 'admin') || (user?.role === 'club' && dashboardStats?.eventStats?.categoryStats && dashboardStats?.eventStats?.eventTypeStats)) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Category Distribution */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Events by Category</h3>
                      <div className="space-y-3">
                        {dashboardStats.eventStats.categoryStats.map((category: any) => (
                          <div key={category._id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {category._id}
                              </span>
                              <span className="ml-3 text-sm font-medium text-gray-900">
                                {category.count} events
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {calculatePercentage(category.count, dashboardStats.eventStats.overview.totalEvents)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Type Distribution */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Events by Type</h3>
                      <div className="space-y-3">
                        {dashboardStats.eventStats.eventTypeStats.map((type: any) => (
                          <div key={type._id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                {type._id}
                              </span>
                              <span className="ml-3 text-sm font-medium text-gray-900">
                                {type.count} events
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {calculatePercentage(type.count, dashboardStats.eventStats.overview.totalEvents)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* App Usage & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Usage */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Usage</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">Web Application</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {user?.role === 'admin' ? 
                          (dashboardStats?.userStats?.overview?.totalAdmins || 0) + (dashboardStats?.userStats?.overview?.totalClubs || 0) :
                          user?.role === 'club' ? 1 : 0
                        } users
                      </div>
                      <div className="text-xs text-gray-500">Admin & Club</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">Mobile Application</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {dashboardStats?.userStats?.overview?.totalStudents || 0} users
                      </div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {user?.role === 'admin' && (
                    <>
                      <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                        📊 Export User Report
                      </button>
                      <button 
                        onClick={() => setCurrentView('user-management')}
                        className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                      >
                        👥 Manage Users
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setCurrentView(user?.role === 'admin' ? 'admin-events' : 'event-management')}
                    className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    📅 {user?.role === 'admin' ? 'Manage Events' : 'My Events'}
                  </button>
                  <button 
                    onClick={fetchDashboardStats}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              </div>
            </div>

            {/* System Health Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user?.role === 'admin' ? getVerificationRate() : 
                     user?.role === 'club' ?
                       (getClubEventStats().total > 0 ? Math.round((getClubEventStats().approved / getClubEventStats().total) * 100) : 0) :
                       getApprovalRate()
                    }%
                  </div>
                  <div className="text-sm text-gray-500">
                    {user?.role === 'admin' ? 'User Verification Rate' : 'Event Approval Rate'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {user?.role === 'admin' ? 
                      dashboardStats?.userStats?.recentRegistrations || 0 :
                      dashboardStats?.eventStats?.overview?.thisMonthEvents || 0
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    {user?.role === 'admin' ? 'New Users This Month' : 'Events This Month'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {user?.role === 'admin' ? 
                      dashboardStats?.userStats?.overview?.totalUsers || 0 :
                      user?.role === 'club' ?
                        getClubEventStats().total :
                        dashboardStats?.eventStats?.overview?.totalEvents || 0
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    {user?.role === 'admin' ? 'Total Users' : 'Total Events'}
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Message for Students */}
            {user?.role === 'student' && (
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
                          <h3 className="text-sm font-medium text-blue-800">System Information</h3>
                          <div className="mt-2 text-sm text-blue-700">
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
            )}
          </>
        )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
