import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  FolderIcon,
  UserIcon,
  HandRaisedIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalCategories: 0,
      totalNominees: 0,
      totalVotes: 0,
      totalRevenue: 0,
      pendingNominees: 0
    },
    recentActivity: [],
    topCategories: [],
    systemAlerts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-20">
        <Icon className="h-16 w-16" />
      </div>
    </motion.div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, gradient, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center mb-4">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm mr-3">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-white/80 text-sm">{description}</p>
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <Icon className="h-16 w-16" />
      </div>
    </motion.div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, {user?.firstName}! Here's what's happening with the Sandwich Award system.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </motion.button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
        >
          <StatCard
            title="Total Users"
            value={dashboardData.stats.totalUsers}
            icon={UserIcon}
            gradient="from-blue-500 to-blue-600"
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            title="Categories"
            value={dashboardData.stats.totalCategories}
            icon={FolderIcon}
            gradient="from-purple-500 to-purple-600"
            onClick={() => navigate('/admin/categories')}
          />
          <StatCard
            title="Nominees"
            value={dashboardData.stats.totalNominees}
            icon={UserIcon}
            gradient="from-green-500 to-green-600"
            onClick={() => navigate('/admin/nominees')}
          />
          <StatCard
            title="Total Votes"
            value={dashboardData.stats.totalVotes}
            icon={HandRaisedIcon}
            gradient="from-cyan-500 to-cyan-600"
          />
          <StatCard
            title="Revenue"
            value={`₦${dashboardData.stats.totalRevenue.toLocaleString()}`}
            icon={CurrencyDollarIcon}
            gradient="from-orange-500 to-orange-600"
            onClick={() => navigate('/admin/payments')}
          />
          <StatCard
            title="Pending"
            value={dashboardData.stats.pendingNominees}
            icon={ExclamationTriangleIcon}
            gradient="from-red-500 to-red-600"
            onClick={() => navigate('/admin/nominees?status=pending')}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Manage Categories"
              description="Create, edit, and manage award categories"
              icon={FolderIcon}
              gradient="from-blue-500 to-indigo-600"
              onClick={() => navigate('/admin/categories')}
            />
            <QuickActionCard
              title="Review Nominees"
              description="Approve or reject nominee submissions"
              icon={UserIcon}
              gradient="from-purple-500 to-pink-600"
              onClick={() => navigate('/admin/nominees')}
            />
            <QuickActionCard
              title="Payment Reports"
              description="View payment analytics and reports"
              icon={CurrencyDollarIcon}
              gradient="from-green-500 to-emerald-600"
              onClick={() => navigate('/admin/payments')}
            />
            <QuickActionCard
              title="System Settings"
              description="Configure system settings and preferences"
              icon={Cog6ToothIcon}
              gradient="from-orange-500 to-red-600"
              onClick={() => navigate('/admin/settings')}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 h-96"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-80">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <EyeIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No recent activity to display.
                </p>
              )}
            </div>
          </motion.div>

          {/* Top Categories */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 h-96"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Top Categories by Votes
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-80">
              {dashboardData.topCategories.length > 0 ? (
                dashboardData.topCategories.map((category, index) => {
                  const maxVotes = Math.max(...dashboardData.topCategories.map(c => c.voteCount));
                  const percentage = (category.voteCount / maxVotes) * 100;
                  
                  return (
                    <motion.div
                      key={category._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">
                          {category.name}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {category.voteCount} votes
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.2 * index, duration: 0.8 }}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No voting data available yet.
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* System Alerts */}
        {dashboardData.systemAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              System Alerts
            </h3>
            <div className="space-y-3">
              {dashboardData.systemAlerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'error'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'bg-blue-50 border-blue-500 text-blue-700'
                  }`}
                >
                  {alert.message}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;