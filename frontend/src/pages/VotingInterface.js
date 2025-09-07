import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon as FilterIcon,
  HandRaisedIcon as VoteIcon,
  StarIcon,
  UserIcon as PersonIcon,
  AcademicCapIcon as SchoolIcon,
  EnvelopeIcon as EmailIcon,
  PhoneIcon,
  TrophyIcon,
  EyeIcon as ViewIcon,
  CreditCardIcon as PaymentIcon,
  CheckCircleIcon as CheckIcon,
  XMarkIcon as CancelIcon,
  ClockIcon as TimeIcon,
  XMarkIcon as CloseIcon,
  EyeIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const VotingInterface = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Data fetching
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((res) => res.data),
  });

  const { data: nominees = [], isLoading: nomineesLoading } = useQuery({
    queryKey: ["nominees"],
    queryFn: () => api.get("/nominees/approved").then((res) => res.data),
  });

  const { data: userVotes = [], isLoading: votesLoading } = useQuery({
    queryKey: ["user-votes", user?.id],
    queryFn: () => api.get("/votes/my-votes").then((res) => res.data),
    enabled: !!user,
  });

  const { data: votingStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["voting-stats"],
    queryFn: () => api.get("/votes/stats").then((res) => res.data),
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: (nomineeId) => api.post("/votes", { nomineeId }),
    onSuccess: () => {
      toast.success("Vote submitted successfully!");
      queryClient.invalidateQueries(["user-votes"]);
      queryClient.invalidateQueries(["voting-stats"]);
      setShowVoteDialog(false);
      setSelectedNominee(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to submit vote");
    },
  });

  // Helper functions
  const hasUserVoted = (nomineeId) => {
    return userVotes.some((vote) => vote.nominee._id === nomineeId);
  };

  const getVoteCount = (nomineeId) => {
    return votingStats.votesByNominee?.[nomineeId] || 0;
  };

  const filteredNominees = nominees.filter((nominee) => {
    const matchesSearch =
      nominee.student.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      nominee.student.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      nominee.student.studentId
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || nominee.category._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedNominees = [...filteredNominees].sort((a, b) => {
    switch (sortBy) {
      case "votes":
        return getVoteCount(b._id) - getVoteCount(a._id);
      case "recent":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "name":
      default:
        return `${a.student.firstName} ${a.student.lastName}`.localeCompare(
          `${b.student.firstName} ${b.student.lastName}`
        );
    }
  });

  const handleVote = (nominee) => {
    setSelectedNominee(nominee);
    setShowVoteDialog(true);
  };

  const handleViewDetails = (nominee) => {
    setSelectedNominee(nominee);
    setShowDetailsDialog(true);
  };

  const confirmVote = () => {
    if (selectedNominee) {
      voteMutation.mutate(selectedNominee._id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Vote for Excellence
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cast your vote for outstanding students who deserve recognition for
            their achievements and contributions.
          </p>
        </motion.div>

        {/* Voting Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                <PersonIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {nominees.length}
                </h3>
                <p className="text-sm text-gray-600">Active Nominees</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mr-4">
                <VoteIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userVotes.length}
                </h3>
                <p className="text-sm text-gray-600">Your Votes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-4">
                <SchoolIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </h3>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-4">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {votingStats.totalVotes || 0}
                </h3>
                <p className="text-sm text-gray-600">Total Votes</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search nominees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="votes">Most Votes</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>

              <div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSortBy("name");
                  }}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {(nomineesLoading || categoriesLoading) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nominees Grid */}
        {!nomineesLoading && !categoriesLoading && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedNominees.map((nominee, index) => {
                const hasVoted = hasUserVoted(nominee._id);
                const voteCount = getVoteCount(nominee._id);

                return (
                  <motion.div
                    key={nominee._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full"
                  >
                    <div
                      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 h-full flex flex-col relative transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                        hasVoted ? "ring-2 ring-green-500 bg-green-50/80" : ""
                      }`}
                    >
                      {hasVoted && (
                        <div className="absolute top-3 right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                          <CheckIcon className="w-3 h-3 mr-1" />
                          Voted
                        </div>
                      )}

                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          {nominee.student.firstName[0]}
                          {nominee.student.lastName[0]}
                        </div>
                      </div>

                      <div className="p-6 flex-grow">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">
                          {nominee.student.firstName} {nominee.student.lastName}
                        </h3>

                        <p className="text-sm text-gray-600 mb-3">
                          {nominee.student.studentId} •{" "}
                          {nominee.student.department}
                        </p>

                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                          {nominee.category.name}
                        </span>

                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {nominee.reason.length > 100
                            ? `${nominee.reason.substring(0, 100)}...`
                            : nominee.reason}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500">
                            <VoteIcon className="w-4 h-4 mr-1" />
                            <span>{voteCount} votes</span>
                          </div>

                          <span className="text-gray-400">
                            {new Date(nominee.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 pt-0 flex gap-2">
                        <button
                          onClick={() => handleViewDetails(nominee)}
                          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Details
                        </button>

                        <button
                          onClick={() => handleVote(nominee)}
                          disabled={hasVoted || voteMutation.isLoading}
                          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm flex items-center justify-center ${
                            hasVoted
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                          }`}
                        >
                          {hasVoted ? (
                            <>
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Voted
                            </>
                          ) : (
                            <>
                              <VoteIcon className="w-4 h-4 mr-1" />
                              Vote
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!nomineesLoading &&
          !categoriesLoading &&
          sortedNominees.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                No nominees found
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No nominees have been approved yet."}
              </p>
            </motion.div>
          )}

        {/* Vote Confirmation Dialog */}
        <AnimatePresence>
          {showVoteDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowVoteDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Confirm Your Vote
                    </h2>
                    <button
                      onClick={() => setShowVoteDialog(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedNominee && (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <p className="text-blue-800">
                          You are about to vote for{" "}
                          <strong>
                            {selectedNominee.student.firstName}{" "}
                            {selectedNominee.student.lastName}
                          </strong>{" "}
                          in the{" "}
                          <strong>{selectedNominee.category.name}</strong>{" "}
                          category.
                        </p>
                      </div>

                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                          {selectedNominee.student.firstName[0]}
                          {selectedNominee.student.lastName[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {selectedNominee.student.firstName}{" "}
                            {selectedNominee.student.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedNominee.student.studentId} •{" "}
                            {selectedNominee.student.department}
                          </p>
                        </div>
                      </div>

                      <hr className="my-4" />

                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium text-gray-900">
                          Vote Cost:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          ₦1.00
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-gray-900">
                          Payment Options:
                        </h4>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p>
                            1. Online Payment: You will be redirected to
                            OPay to complete your payment.
                          </p>
                          <p>
                            2. Bank Transfer: Transfer to any of the following
                            accounts:
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mt-3">
                          <h5 className="font-medium text-blue-600 mb-2">
                            Sandwich Students Welfare Association
                          </h5>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>Account Name:</strong> Sandwich students
                              welfare Associatn
                            </p>
                            <p>
                              <strong>Account Number:</strong> 0223346437
                            </p>
                            <p>
                              <strong>Bank:</strong> Wema Bank
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Note: After transfer, contact admin for manual
                              verification
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowVoteDialog(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmVote}
                      disabled={voteMutation.isLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all font-medium flex items-center justify-center"
                    >
                      <PaymentIcon className="w-4 h-4 mr-2" />
                      {voteMutation.isLoading
                        ? "Processing..."
                        : "Proceed to Payment"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nominee Details Dialog */}
        <AnimatePresence>
          {showDetailsDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailsDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Nominee Details
                    </h2>
                    <button
                      onClick={() => setShowDetailsDialog(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <CloseIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {selectedNominee && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                            {selectedNominee.student.firstName[0]}
                            {selectedNominee.student.lastName[0]}
                          </div>
                          <h3 className="text-xl font-semibold mb-2 text-gray-900">
                            {selectedNominee.student.firstName}{" "}
                            {selectedNominee.student.lastName}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {selectedNominee.category.name}
                          </span>
                        </div>

                        <div className="md:col-span-2">
                          <h4 className="text-lg font-semibold mb-4 text-gray-900">
                            Student Information
                          </h4>

                          <div className="space-y-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                <SchoolIcon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Student ID
                                </p>
                                <p className="text-gray-600">
                                  {selectedNominee.student.studentId}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                <SchoolIcon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Department
                                </p>
                                <p className="text-gray-600">
                                  {selectedNominee.student.department}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Student ID
                                </p>
                                <p className="text-gray-600">
                                  {selectedNominee.student.studentId}
                                </p>
                              </div>
                            </div>

                            {selectedNominee.student.phoneNumber && (
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                  <PhoneIcon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    Phone
                                  </p>
                                  <p className="text-gray-600">
                                    {selectedNominee.student.phoneNumber}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <hr className="my-6" />

                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3 text-gray-900">
                          Nomination Reason
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedNominee.reason}
                        </p>
                      </div>

                      {selectedNominee.achievements && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-3 text-gray-900">
                            Achievements
                          </h4>
                          <p className="text-gray-700 leading-relaxed">
                            {selectedNominee.achievements}
                          </p>
                        </div>
                      )}

                      <hr className="my-6" />

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {getVoteCount(selectedNominee._id)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Votes
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl">
                          <div className="text-3xl font-bold text-purple-600 mb-1">
                            #
                            {sortedNominees.findIndex(
                              (n) => n._id === selectedNominee._id
                            ) + 1}
                          </div>
                          <div className="text-sm text-gray-600">
                            Current Rank
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowDetailsDialog(false)}
                      className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                    >
                      Close
                    </button>
                    {selectedNominee && !hasUserVoted(selectedNominee._id) && (
                      <button
                        onClick={() => {
                          setShowDetailsDialog(false);
                          handleVote(selectedNominee);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium flex items-center"
                      >
                        <VoteIcon className="w-4 h-4 mr-2" />
                        Vote Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VotingInterface;
