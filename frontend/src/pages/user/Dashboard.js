import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { votesAPI, categoriesAPI, paymentsAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  CheckBadgeIcon,
  TrophyIcon,
  RectangleStackIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userVotes, setUserVotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        votesResponse,
        categoriesResponse,
        paymentsResponse,
        statsResponse,
      ] = await Promise.all([
        votesAPI.getUserVotes(),
        categoriesAPI.getAll(),
        paymentsAPI.getPaymentHistory(),
        votesAPI.getVoteStats(),
      ]);

      setUserVotes(
        votesResponse.data.data?.votes || votesResponse.data.data || []
      );
      setCategories(categoriesResponse.data.data.categories || []);
      setPaymentHistory(paymentsResponse.data.data.payments || []);
      setStats(statsResponse.data);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVotingProgress = () => {
    const totalCategories = Array.isArray(categories) ? categories.length : 0;
    const votedCategories = Array.isArray(userVotes) ? userVotes.length : 0;
    return totalCategories > 0 ? (votedCategories / totalCategories) * 100 : 0;
  };

  const getTotalSpent = () => {
    if (!Array.isArray(paymentHistory)) return 0;
    return paymentHistory
      .filter((payment) => payment.status === "success")
      .reduce((total, payment) => total + payment.amount, 0);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20"
        >
          <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <InformationCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const votingProgress = getVotingProgress();
  const totalSpent = getTotalSpent();
  const unvotedCategories = Array.isArray(categories)
    ? categories.filter((category) =>
        !Array.isArray(userVotes)
          ? true
          : !userVotes.some((vote) => vote.category?._id === category._id)
      )
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-20 h-20 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="text-center">
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Your Dashboard
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Track your voting progress and activity in the Sandwich Award
              </motion.p>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4 group-hover:shadow-lg transition-all duration-300">
                <CheckBadgeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {userVotes.length}
              </h3>
              <p className="text-gray-600 font-medium">Votes Cast</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <SparklesIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 font-medium">
                  Active Voter
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-4 group-hover:shadow-lg transition-all duration-300">
                <RectangleStackIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {categories.length}
              </h3>
              <p className="text-gray-600 font-medium">Total Categories</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <TrophyIcon className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">
                  Available
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4 group-hover:shadow-lg transition-all duration-300">
                <CreditCardIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                ₦{totalSpent.toLocaleString()}
              </h3>
              <p className="text-gray-600 font-medium">Total Spent</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <StarIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">
                  Invested
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:shadow-lg transition-all duration-300">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {votingProgress.toFixed(0)}%
              </h3>
              <p className="text-gray-600 font-medium">Completion</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <FireIcon className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-600 font-medium">
                  Progress
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Voting Progress */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Voting Progress
                </h2>
                <p className="text-gray-600">
                  You've voted in {userVotes.length} out of {categories.length}{" "}
                  categories
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {votingProgress.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${votingProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                ></motion.div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-pulse"></div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Votes */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckBadgeIcon className="w-6 h-6 text-blue-500 mr-2" />
                Recent Votes
              </h2>

              {userVotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <InformationCircleIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No votes yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start voting to see your activity here!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/categories")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Start Voting
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userVotes.slice(0, 5).map((vote, index) => (
                    <motion.div
                      key={vote._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100/50 transition-all duration-200 group"
                    >
                      <div className="relative">
                        <img
                          src={vote.nominee.image}
                          alt={vote.nominee.student ? `${vote.nominee.student.firstName} ${vote.nominee.student.lastName}` : vote.nominee.name || 'Unknown Nominee'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircleIcon className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 ml-4">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {vote.nominee.student ? `${vote.nominee.student.firstName} ${vote.nominee.student.lastName}` : vote.nominee.name || 'Unknown Nominee'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {vote.category.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {new Date(vote.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {userVotes.length > 5 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-6 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                      onClick={() => navigate("/user/voting-history")}
                    >
                      <span>View All Votes</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Categories to Vote */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrophyIcon className="w-6 h-6 text-orange-500 mr-2" />
                Available Categories
              </h2>

              {unvotedCategories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    All done!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Congratulations! You've voted in all available categories.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/results")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    View Results
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {unvotedCategories.slice(0, 5).map((category, index) => (
                    <motion.div
                      key={category._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100/50 transition-all duration-200 group"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                        onClick={() => navigate(`/categories/${category._id}`)}
                      >
                        <span>Vote</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}

                  {unvotedCategories.length > 5 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-6 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                      onClick={() => navigate("/categories")}
                    >
                      <span>View All Categories</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
