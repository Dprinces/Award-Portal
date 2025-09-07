import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrophyIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShareIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  TrophyIcon as TrophySolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { categoriesAPI, votesAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useQuery } from "react-query";

const Leaderboard = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    "categories",
    categoriesAPI.getAll,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch leaderboard data
  const {
    data: leaderboardData = [],
    isLoading: leaderboardLoading,
    refetch: refetchLeaderboard,
  } = useQuery(
    ["leaderboard", selectedCategory],
    () =>
      votesAPI.getLeaderboard(
        selectedCategory === "all" ? null : selectedCategory
      ),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000, // 10 seconds
    }
  );

  // Fetch voting statistics
  const {
    data: votingStats = {},
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery("voting-stats", votesAPI.getVotingStats, {
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLeaderboard(), refetchStats()]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Sandwich Award Leaderboard",
        text: "Check out the current leaderboard for the Sandwich Award!",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <TrophySolid className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <TrophySolid className="w-6 h-6 text-gray-400" />;
      case 3:
        return <TrophySolid className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">
            #{rank}
          </span>
        );
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600";
      case 2:
        return "from-gray-300 to-gray-500";
      case 3:
        return "from-amber-400 to-amber-600";
      default:
        return "from-blue-400 to-blue-600";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const isLoading = categoriesLoading || leaderboardLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Leaderboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time voting results and rankings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Share
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {votingStats.totalVotes?.toLocaleString() || "0"}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(votingStats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unique Voters
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {votingStats.uniqueVoters?.toLocaleString() || "0"}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Vote Value
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(votingStats.averageVoteValue)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl">
                <StarSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filter by Category
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-64 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Rankings</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Updates
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {leaderboardData.length > 0 ? (
                leaderboardData.map((nominee, index) => {
                  const rank = index + 1;
                  const votePercentage =
                    votingStats.totalVotes > 0
                      ? (
                          (nominee.totalVotes / votingStats.totalVotes) *
                          100
                        ).toFixed(1)
                      : 0;

                  return (
                    <motion.div
                      key={nominee._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center`}
                          >
                            {getRankIcon(rank)}
                          </div>
                        </div>

                        {/* Nominee Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'}
                              </h3>
                              <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                                <span>ID: {nominee.studentId}</span>
                                <span>•</span>
                                <span>{nominee.department}</span>
                                {nominee.category && (
                                  <>
                                    <span>•</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                      {nominee.category.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <div className="text-2xl font-bold text-gray-900">
                                {nominee.totalVotes?.toLocaleString() || "0"}
                              </div>
                              <div className="text-sm text-gray-600">votes</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>{votePercentage}% of total votes</span>
                              <span>
                                {formatCurrency(nominee.totalRevenue)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${votePercentage}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-2 rounded-full bg-gradient-to-r ${getRankColor(rank)}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Share Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: `${nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'} - Sandwich Award`,
                                text: `Check out ${nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'}'s ranking in the Sandwich Award!`,
                                url: window.location.href,
                              });
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ShareIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center"
                >
                  <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-gray-600">
                    {selectedCategory === "all"
                      ? "No votes have been cast yet. Be the first to vote!"
                      : "No votes in this category yet."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
