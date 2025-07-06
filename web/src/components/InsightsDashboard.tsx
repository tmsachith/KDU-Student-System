import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, eventAPI } from '../services/api';

interface DashboardStats {
  userStats: {
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
  };
  eventStats: {
    overview: {
      totalEvents: number;
      approvedEvents: number;
      pendingEvents: number;
      rejectedEvents: number;
      upcomingEvents: number;
      thisMonthEvents: number;
    };
    categoryStats: Array<{
      _id: string;
      count: number;
    }>;
    eventTypeStats: Array<{
      _id: string;
      count: number;
    }>;
  };
}

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-md ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className={`text-2xl font-bold ${color}`}>{value}</dd>
            {subtitle && (
              <dd className="text-sm text-gray-500">{subtitle}</dd>
            )}
            {trend && (
              <dd className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const InsightsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const promises: Promise<any>[] = [];
      
      // Fetch user stats (admin only)
      if (user?.role === 'admin') {
        promises.push(userAPI.getStats());
      }
      
      // Fetch event stats (admin and club)
      if (user?.role === 'admin' || user?.role === 'club') {
        promises.push(eventAPI.getStatistics());
      }

      const results = await Promise.all(promises);
      
      const dashboardStats: DashboardStats = {
        userStats: user?.role === 'admin' ? results[0] : {
          overview: {
            totalUsers: 0,
            totalAdmins: 0,
            totalClubs: 0,
            totalStudents: 0,
            verifiedUsers: 0,
            unverifiedUsers: 0,
            googleUsers: 0
          },
          recentRegistrations: 0,
          roleDistribution: []
        },
        eventStats: user?.role === 'admin' || user?.role === 'club' ? 
          (user?.role === 'admin' ? results[1] : results[0]) : {
          overview: {
            totalEvents: 0,
            approvedEvents: 0,
            pendingEvents: 0,
            rejectedEvents: 0,
            upcomingEvents: 0,
            thisMonthEvents: 0
          },
          categoryStats: [],
          eventTypeStats: []
        }
      };
      
      setStats(dashboardStats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getVerificationRate = (): number => {
    if (!stats?.userStats.overview.totalUsers) return 0;
    return Math.round((stats.userStats.overview.verifiedUsers / stats.userStats.overview.totalUsers) * 100);
  };

  const getApprovalRate = (): number => {
    if (!stats?.eventStats.overview.totalEvents) return 0;
    return Math.round((stats.eventStats.overview.approvedEvents / stats.eventStats.overview.totalEvents) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Insights</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Insights</h1>
          <p className="mt-2 text-sm text-gray-600">
            {user?.role === 'admin' 
              ? 'Complete system analytics and insights'
              : 'Event management analytics and insights'
            }
          </p>
        </div>

        {/* Admin User Statistics */}
        {user?.role === 'admin' && stats?.userStats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Analytics</h2>
            
            {/* User Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatsCard
                title="Total Users"
                value={stats.userStats.overview.totalUsers}
                icon={
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                color="text-blue-600"
                subtitle={`${stats.userStats.recentRegistrations} new this month`}
              />
              
              <StatsCard
                title="Verified Users"
                value={`${stats.userStats.overview.verifiedUsers} (${getVerificationRate()}%)`}
                icon={
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="text-green-600"
                subtitle={`${stats.userStats.overview.unverifiedUsers} pending verification`}
              />
              
              <StatsCard
                title="Students"
                value={stats.userStats.overview.totalStudents}
                icon={
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                }
                color="text-purple-600"
                subtitle={calculatePercentage(stats.userStats.overview.totalStudents, stats.userStats.overview.totalUsers)}
              />
              
              <StatsCard
                title="Google Users"
                value={stats.userStats.overview.googleUsers}
                icon={
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                }
                color="text-red-600"
                subtitle={calculatePercentage(stats.userStats.overview.googleUsers, stats.userStats.overview.totalUsers)}
              />
            </div>

            {/* Role Distribution */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role Distribution</h3>
              <div className="space-y-4">
                {stats.userStats.roleDistribution.map((role) => (
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

        {/* Event Statistics */}
        {(user?.role === 'admin' || user?.role === 'club') && stats?.eventStats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Analytics</h2>
            
            {/* Event Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatsCard
                title="Total Events"
                value={stats.eventStats.overview.totalEvents}
                icon={
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                color="text-indigo-600"
                subtitle={`${stats.eventStats.overview.thisMonthEvents} created this month`}
              />
              
              <StatsCard
                title="Approved Events"
                value={`${stats.eventStats.overview.approvedEvents} (${getApprovalRate()}%)`}
                icon={
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
                color="text-green-600"
                subtitle={`${stats.eventStats.overview.upcomingEvents} upcoming`}
              />
              
              <StatsCard
                title="Pending Events"
                value={stats.eventStats.overview.pendingEvents}
                icon={
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="text-yellow-600"
                subtitle="Awaiting approval"
              />
              
              <StatsCard
                title="Rejected Events"
                value={stats.eventStats.overview.rejectedEvents}
                icon={
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
                color="text-red-600"
                subtitle="Need revision"
              />
            </div>

            {/* Event Category & Type Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Events by Category</h3>
                <div className="space-y-3">
                  {stats.eventStats.categoryStats.map((category) => (
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
                        {calculatePercentage(category.count, stats.eventStats.overview.totalEvents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Type Distribution */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Events by Type</h3>
                <div className="space-y-3">
                  {stats.eventStats.eventTypeStats.map((type) => (
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
                        {calculatePercentage(type.count, stats.eventStats.overview.totalEvents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* App Usage Insights */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">App Usage Insights</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform Distribution */}
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
                        (stats?.userStats.overview.totalAdmins || 0) + (stats?.userStats.overview.totalClubs || 0) :
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
                      {stats?.userStats.overview.totalStudents || 0} users
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication Methods */}
            {user?.role === 'admin' && stats?.userStats && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">Email/Password</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {stats.userStats.overview.totalUsers - stats.userStats.overview.googleUsers} users
                      </div>
                      <div className="text-xs text-gray-500">
                        {calculatePercentage(
                          stats.userStats.overview.totalUsers - stats.userStats.overview.googleUsers,
                          stats.userStats.overview.totalUsers
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">Google Sign-In</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {stats.userStats.overview.googleUsers} users
                      </div>
                      <div className="text-xs text-gray-500">
                        {calculatePercentage(stats.userStats.overview.googleUsers, stats.userStats.overview.totalUsers)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {user?.role === 'admin' && (
                  <>
                    <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                      📊 Export User Report
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors">
                      📈 View Detailed Analytics
                    </button>
                  </>
                )}
                <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors">
                  📅 Export Event Report
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
        </div>

        {/* System Health */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {user?.role === 'admin' ? getVerificationRate() : getApprovalRate()}%
              </div>
              <div className="text-sm text-gray-500">
                {user?.role === 'admin' ? 'User Verification Rate' : 'Event Approval Rate'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.userStats.recentRegistrations || stats?.eventStats.overview.thisMonthEvents || 0}
              </div>
              <div className="text-sm text-gray-500">
                {user?.role === 'admin' ? 'New Users This Month' : 'Events This Month'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {user?.role === 'admin' ? 
                  stats?.userStats.overview.totalUsers || 0 :
                  stats?.eventStats.overview.totalEvents || 0
                }
              </div>
              <div className="text-sm text-gray-500">
                {user?.role === 'admin' ? 'Total Users' : 'Total Events'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
