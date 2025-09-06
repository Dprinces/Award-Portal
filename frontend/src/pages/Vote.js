import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserIcon,
  TrophyIcon,
  StarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const Vote = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedNominee, setSelectedNominee] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [voteCount, setVoteCount] = useState({});

  // Fetch category details
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const response = await api.get(`/categories/${categoryId}`);
      return response.data.data;
    },
  });

  // Fetch nominees for this category
  const {
    data: nominees,
    isLoading: nomineesLoading,
    error: nomineesError,
    refetch: refetchNominees,
  } = useQuery({
    queryKey: ["nominees", categoryId],
    queryFn: async () => {
      const response = await api.get(`/nominees/category/${categoryId}`);
      return response.data.data;
    },
  });

  // Fetch real-time vote counts
  const { data: voteCounts, refetch: refetchVotes } = useQuery({
    queryKey: ["vote-counts", categoryId],
    queryFn: async () => {
      const response = await api.get(`/votes/category/${categoryId}/counts`);
      return response.data.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    enabled: !!categoryId,
  });

  // Check if user has already voted in this category
  const { data: userVote } = useQuery({
    queryKey: ["user-vote", categoryId],
    queryFn: async () => {
      const response = await api.get(`/votes/my-votes?category=${categoryId}`);
      return response.data.data;
    },
    enabled: isAuthenticated && !!categoryId,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ nomineeId, paymentData }) => {
      const response = await api.post("/votes", {
        categoryId,
        nomineeId,
        paymentData,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Vote cast successfully!");
      setPaymentDialogOpen(false);
      setSelectedNominee(null);
      setIsProcessingPayment(false);

      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries(["vote-counts", categoryId]);
      queryClient.invalidateQueries(["user-vote", categoryId]);
      queryClient.invalidateQueries(["nominees", categoryId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cast vote");
      setIsProcessingPayment(false);
    },
  });

  // Initialize Paystack payment
  const initializePayment = async () => {
    if (!selectedNominee || !category) return;

    setIsProcessingPayment(true);

    try {
      // Initialize payment with Paystack
      const response = await api.post("/payments/initialize", {
        amount: category.votePrice || 100, // Default to 100 naira
        email: user.email,
        metadata: {
          categoryId,
          nomineeId: selectedNominee._id,
          userId: user._id,
        },
      });

      const { authorization_url, reference } = response.data.data;

      // Redirect to Paystack payment page
      window.location.href = authorization_url;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to initialize payment"
      );
      setIsProcessingPayment(false);
    }
  };

  const handleVoteClick = (nominee) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/vote/${categoryId}` } });
      return;
    }

    if (userVote) {
      toast.error("You have already voted in this category");
      return;
    }

    setSelectedNominee(nominee);
    setPaymentDialogOpen(true);
  };

  const getNomineeVoteCount = (nomineeId) => {
    return voteCounts?.find((vc) => vc.nomineeId === nomineeId)?.count || 0;
  };

  const getTotalVotes = () => {
    return voteCounts?.reduce((total, vc) => total + vc.count, 0) || 0;
  };

  const getVotePercentage = (nomineeId) => {
    const nomineeVotes = getNomineeVoteCount(nomineeId);
    const totalVotes = getTotalVotes();
    return totalVotes > 0 ? (nomineeVotes / totalVotes) * 100 : 0;
  };

  const isVotingActive = () => {
    if (!category) return false;
    if (!category.votingActive) return false;

    if (category.votingStartDate && category.votingEndDate) {
      const now = new Date();
      const start = new Date(category.votingStartDate);
      const end = new Date(category.votingEndDate);
      return now >= start && now <= end;
    }

    return true;
  };

  const getTimeRemaining = () => {
    if (!category?.votingEndDate) return null;

    const now = new Date();
    const end = new Date(category.votingEndDate);
    const diff = end - now;

    if (diff <= 0) return "Voting has ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    if (minutes > 0)
      return `${minutes} minute${minutes > 1 ? "s" : ""} remaining`;
    return "Less than 1 minute remaining";
  };

  if (categoryLoading || nomineesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (categoryError || nomineesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">
                {categoryError?.response?.data?.message ||
                  nomineesError?.response?.data?.message ||
                  "Failed to load voting data"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/categories")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  const votingActive = isVotingActive();
  const timeRemaining = getTimeRemaining();
  const totalVotes = getTotalVotes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/categories")}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Categories
          </button>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {category?.name}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                {category?.description}
              </p>
            </div>

            <button
              onClick={() => {
                refetchNominees();
                refetchVotes();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Voting Status */}
          <div
            className={`p-6 rounded-xl shadow-lg mb-6 ${votingActive ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200" : "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    votingActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {votingActive ? (
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 mr-1" />
                  )}
                  {votingActive ? "Voting Active" : "Voting Inactive"}
                </span>
                {timeRemaining && (
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">{timeRemaining}</span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {totalVotes} Total Votes
                </div>
                <div className="text-sm text-gray-600">
                  Vote Price: ₦{category?.votePrice || 100}
                </div>
              </div>
            </div>
          </div>

          {/* User Vote Status */}
          {userVote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                <p className="text-blue-800">
                  You have already voted for {userVote.nominee?.name} in this
                  category.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Nominees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nominees?.map((nominee, index) => {
            const voteCount = getNomineeVoteCount(nominee._id);
            const votePercentage = getVotePercentage(nominee._id);
            const hasUserVoted = userVote?.nominee?._id === nominee._id;

            return (
              <motion.div
                key={nominee._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-xl h-full flex flex-col ${
                    hasUserVoted ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  {/* Vote Count Badge */}
                  <div className="relative">
                    <div className="absolute top-3 right-3 z-10 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-semibold flex items-center">
                      <TrophyIcon className="h-3 w-3 mr-1" />
                      {voteCount}
                    </div>

                    {/* User Vote Indicator */}
                    {hasUserVoted && (
                      <div className="absolute top-3 left-3 z-10 bg-green-600 text-white rounded-full px-2 py-1 text-xs font-semibold flex items-center">
                        <StarSolidIcon className="h-3 w-3 mr-1" />
                        Your Vote
                      </div>
                    )}

                    {/* Nominee Image */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {nominee.image ? (
                        <img
                          src={nominee.image}
                          alt={nominee.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {nominee.name.charAt(0)}
                        </div>
                      )}

                      {/* Vote Percentage Overlay */}
                      {totalVotes > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                          <div className="text-center">
                            <div className="text-sm font-semibold mb-1">
                              {votePercentage.toFixed(1)}% of votes
                            </div>
                            <div className="w-full bg-gray-300 bg-opacity-30 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${votePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Nominee Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {nominee.name}
                    </h3>

                    {/* Nominee Details */}
                    <div className="space-y-2 mb-4">
                      {nominee.department && (
                        <div className="flex items-center text-gray-600">
                          <AcademicCapIcon className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">{nominee.department}</span>
                        </div>
                      )}

                      {nominee.level && (
                        <div className="flex items-center text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">{nominee.level} Level</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {nominee.description && (
                      <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                        {nominee.description}
                      </p>
                    )}

                    {/* Vote Button */}
                    <button
                      onClick={() => handleVoteClick(nominee)}
                      disabled={!votingActive || !!userVote || !isAuthenticated}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                        hasUserVoted
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : !votingActive || !!userVote || !isAuthenticated
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      }`}
                    >
                      {hasUserVoted ? (
                        <>
                          <StarSolidIcon className="h-4 w-4 mr-2" />
                          Your Vote
                        </>
                      ) : !isAuthenticated ? (
                        "Login to Vote"
                      ) : userVote ? (
                        "Already Voted"
                      ) : !votingActive ? (
                        "Voting Closed"
                      ) : (
                        <>
                          <TrophyIcon className="h-4 w-4 mr-2" />
                          Vote (₦{category?.votePrice || 100})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {nominees?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No nominees found
            </h3>
            <p className="text-gray-600">
              There are no nominees in this category yet.
            </p>
          </motion.div>
        )}

        {/* Payment Dialog */}
        <AnimatePresence>
          {paymentDialogOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() =>
                !isProcessingPayment && setPaymentDialogOpen(false)
              }
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <CreditCardIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Confirm Your Vote
                    </h2>
                  </div>

                  {selectedNominee && (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                          <p className="text-blue-800">
                            You are about to vote for{" "}
                            <strong>{selectedNominee.name}</strong> in the{" "}
                            <strong>{category?.name}</strong> category.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {selectedNominee.image ? (
                            <img
                              src={selectedNominee.image}
                              alt={selectedNominee.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            selectedNominee.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedNominee.name}
                          </h3>
                          <p className="text-gray-600">
                            {selectedNominee.department} -{" "}
                            {selectedNominee.level} Level
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-700">Vote Price:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ₦{category?.votePrice || 100}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Payment Options:
                          </h4>

                          <div className="space-y-3 text-sm text-gray-600">
                            <div>
                              <strong>1. Online Payment:</strong> You will be
                              redirected to Paystack to complete your payment.
                            </div>

                            <div>
                              <strong>2. Bank Transfer:</strong> Transfer to any
                              of the following accounts:
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 mt-3">
                            <h5 className="font-semibold text-blue-600 mb-2">
                              Sandwich Students Welfare Association
                            </h5>
                            <div className="space-y-1 text-sm">
                              <div>
                                <strong>Account Name:</strong> Sandwich students
                                welfare Associatn
                              </div>
                              <div>
                                <strong>Account Number:</strong> 0223346437
                              </div>
                              <div>
                                <strong>Bank:</strong> Wema Bank
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Note: After transfer, contact admin for manual
                              verification
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setPaymentDialogOpen(false)}
                      disabled={isProcessingPayment}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={initializePayment}
                      disabled={isProcessingPayment}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-4 w-4 mr-2" />
                          Pay & Vote
                        </>
                      )}
                    </button>
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

export default Vote;
