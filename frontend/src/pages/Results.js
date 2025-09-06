import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrophyIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  StarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import {
  TrophyIcon as TrophySolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { categoriesAPI, votesAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Results = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallStats, setOverallStats] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchOverallStats();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchResults();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data?.data?.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
    }
  };

  const fetchOverallStats = async () => {
    try {
      const response = await votesAPI.getVotingStats();
      setOverallStats(response.data?.data || {});
    } catch (err) {
      console.error("Error fetching overall stats:", err);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await votesAPI.getLeaderboard(
        selectedCategory === "all" ? null : selectedCategory
      );
      setResults(response.data?.data?.leaderboard || []);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results");
    } finally {
      setLoading(false);
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
          <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">
            #{rank}
          </div>
        );
    }
  };

  const getProgressColor = (rank) => {
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

  const handleTabChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  if (loading && results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-red-200 max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Results
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = overallStats.totalVotes || 0;
  const maxVotes =
    results.length > 0 ? Math.max(...results.map((r) => r.totalVotes || 0)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
              <ChartBarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Voting Results
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive voting statistics and rankings
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Statistics */}
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
                  {overallStats.totalVotes?.toLocaleString() || "0"}
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
                  {formatCurrency(overallStats.totalRevenue)}
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
                  {overallStats.uniqueVoters?.toLocaleString() || "0"}
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
                  {formatCurrency(overallStats.averageVoteValue)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl">
                <StarSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Filter by Category
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTabChange("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleTabChange(category._id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category._id
                      ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results */}
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
                <ArrowTrendingUpIcon className="w-4 h-4" />
                {results.length} nominees
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {loading ? (
                <div className="p-12 text-center">
                  <LoadingSpinner />
                </div>
              ) : results.length > 0 ? (
                results.map((nominee, index) => {
                  const rank = index + 1;
                  const votePercentage =
                    totalVotes > 0
                      ? ((nominee.totalVotes / totalVotes) * 100).toFixed(1)
                      : 0;
                  const relativePercentage =
                    maxVotes > 0
                      ? ((nominee.totalVotes / maxVotes) * 100).toFixed(1)
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
                            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getProgressColor(rank)} flex items-center justify-center`}
                          >
                            {getRankIcon(rank)}
                          </div>
                        </div>

                        {/* Nominee Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {nominee.name}
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

                          {/* Progress Bars */}
                          <div className="mt-4 space-y-2">
                            {/* Relative to max votes */}
                            <div>
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>Relative performance</span>
                                <span>{relativePercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${relativePercentage}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: index * 0.1,
                                  }}
                                  className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(rank)}`}
                                />
                              </div>
                            </div>

                            {/* Share of total votes */}
                            <div>
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>Share of total votes</span>
                                <span>
                                  {votePercentage}% •{" "}
                                  {formatCurrency(nominee.totalRevenue)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${votePercentage}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: index * 0.1 + 0.2,
                                  }}
                                  className="h-1.5 rounded-full bg-gradient-to-r from-gray-400 to-gray-600"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
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

export default Results;
