import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  HowToVote as VoteIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";

const Categories = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch categories
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data.categories;
    },
  });

  // Fetch category statistics
  const { data: categoryStats } = useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const response = await api.get("/votes/stats");
      return response.data.data.categoryStats;
    },
    enabled: isAuthenticated,
  });

  const handleVoteClick = (categoryId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/vote/${categoryId}` } });
      return;
    }
    navigate(`/vote/${categoryId}`);
  };

  const getFilteredCategories = () => {
    if (!categories || !Array.isArray(categories)) return [];

    let filtered = categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          category.votingActive &&
          isVotingPeriodActive(category)) ||
        (statusFilter === "upcoming" &&
          !isVotingPeriodActive(category) &&
          new Date(category.votingStartDate) > new Date()) ||
        (statusFilter === "ended" &&
          new Date(category.votingEndDate) < new Date());

      return matchesSearch && matchesStatus;
    });

    return filtered;
  };

  const isVotingPeriodActive = (category) => {
    if (!category.votingStartDate || !category.votingEndDate)
      return category.votingActive;
    const now = new Date();
    const start = new Date(category.votingStartDate);
    const end = new Date(category.votingEndDate);
    return category.votingActive && now >= start && now <= end;
  };

  const getVotingStatus = (category) => {
    if (!category.votingActive)
      return { status: "inactive", label: "Inactive", color: "default" };

    if (!category.votingStartDate || !category.votingEndDate) {
      return { status: "active", label: "Active", color: "success" };
    }

    const now = new Date();
    const start = new Date(category.votingStartDate);
    const end = new Date(category.votingEndDate);

    if (now < start) {
      return { status: "upcoming", label: "Upcoming", color: "info" };
    } else if (now > end) {
      return { status: "ended", label: "Ended", color: "error" };
    } else {
      return { status: "active", label: "Active", color: "success" };
    }
  };

  const getCategoryStats = (categoryId) => {
    if (!categoryStats || !Array.isArray(categoryStats)) {
      return {
        voteCount: 0,
        nomineeCount: 0,
      };
    }
    const stats = categoryStats.find((stat) => stat.categoryId === categoryId);
    return {
      voteCount: stats?.totalVotes || 0,
      nomineeCount: stats?.uniqueNominees || 0,
    };
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    return "Less than 1 hour left";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-16">
          <Container maxWidth="lg">
            <div className="text-center">
              <div className="h-12 bg-white/20 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded-lg max-w-2xl mx-auto animate-pulse"></div>
            </div>
          </Container>
        </div>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card className="h-full">
                  <div className="h-32 bg-gray-200 animate-pulse"></div>
                  <CardContent>
                    <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded mt-4 animate-pulse"></div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </div>
    );
  }

  const filteredCategories = getFilteredCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Compact Header */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Award Categories</h1>
          <p className="text-gray-600 mt-2">Browse categories and vote for outstanding nominees.</p>
        </div>
      </Container>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FilterIcon className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Filter Categories
              </h2>
            </div>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status Filter"
                    className="rounded-xl"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="active">Active Voting</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="ended">Voting Ended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredCategories.length}
                  </div>
                  <div className="text-sm text-gray-500">Categories</div>
                </div>
              </Grid>
            </Grid>
          </div>
        </motion.div>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error.response?.data?.message ||
              error.message ||
              "Failed to load categories"}
          </Alert>
        )}

        {/* Categories Grid */}
        <Grid container spacing={4}>
          {filteredCategories.map((category, index) => {
            const votingStatus = getVotingStatus(category);
            const stats = getCategoryStats(category._id);
            const canVote = isAuthenticated && votingStatus.status === "active";
            const accentColor = category.color || "#3B82F6";

            return (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={category._id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -12, 
                    scale: 1.02,
                    transition: { duration: 0.3, ease: "easeOut" } 
                  }}
                  className="h-full"
                >
                  <Card
                    className={`h-full cursor-pointer transition-all duration-500 hover:shadow-2xl border border-gray-100 overflow-hidden group ${
                      canVote ? "hover:shadow-blue-500/30 hover:border-blue-200" : "hover:shadow-gray-500/20"
                    }`}
                    onClick={() => canVote && handleVoteClick(category._id)}
                    sx={{
                      borderRadius: 4,
                      background: "linear-gradient(145deg, #ffffff 0%, #fafbfc 50%, #f8fafc 100%)",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${accentColor}0D 0%, ${accentColor}1A 100%)`,
                        opacity: 0,
                        transition: "opacity 0.3s ease",
                        zIndex: 1,
                        pointerEvents: "none"
                      },
                      "&:hover::before": {
                        opacity: 1
                      }
                    }}
                  >
                    {/* Category Header */}
                    <div
                      className="h-24 md:h-32 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 60%, ${accentColor}E6 100%)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10"></div>

                      <div className="relative h-full flex flex-col items-center justify-center text-white z-10">
                        <div className="text-3xl md:text-4xl mb-1">
                          {category.icon || "🏆"}
                        </div>
                        <div className="text-xs md:text-sm font-medium opacity-90 text-center px-4">Award Category</div>
                      </div>
                      
                      <Chip
                        label={votingStatus.label}
                        size="small"
                        className="absolute top-4 right-4 font-semibold shadow-lg"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          backdropFilter: "blur(10px)",
                          color:
                            votingStatus.color === "success"
                              ? "#059669"
                              : votingStatus.color === "error"
                                ? "#DC2626"
                                : votingStatus.color === "info"
                                  ? "#2563EB"
                                  : "#6B7280",
                          border: "1px solid rgba(255,255,255,0.3)",
                          "& .MuiChip-label": {
                            fontWeight: 600,
                            fontSize: "0.75rem"
                          }
                        }}
                      />
                    </div>

                    <CardContent className="p-4 md:p-6 relative z-10">
                      {/* Category Name */}
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-700 transition-colors duration-300">
                        {category.name}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {category.description || "Discover and vote for outstanding achievements in this category."}
                      </p>

                      {/* Statistics (compact) */}
                      <div className="flex items-center justify-between mb-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <PeopleIcon fontSize="small" />
                          <span>{category.nominees?.length || 0} nominees</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <VoteIcon fontSize="small" />
                          <span>{stats.voteCount || 0} votes</span>
                        </div>
                      </div>

                      {/* Voting Period (compact) */}
                      {category.votingEndDate && votingStatus.status === "active" && (
                        <div className="flex items-center gap-2 mb-4 text-xs text-orange-700">
                          <TimeIcon fontSize="small" />
                          <span>{getTimeRemaining(category.votingEndDate)}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                       variant={canVote ? "contained" : "outlined"}
                       fullWidth
                       disabled={!canVote}
                       startIcon={<VoteIcon />}
                       onClick={(e) => {
                         e.stopPropagation();
                         handleVoteClick(category._id);
                       }}
                        className="py-2 md:py-3 font-bold text-sm md:text-base shadow-sm"
                        sx={{
                          borderRadius: 3,
                          textTransform: "none",
                          fontSize: { xs: "0.9rem", md: "1rem" },
                          fontWeight: 600,
                          ...(canVote
                            ? {
                                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 60%, ${accentColor}E6 100%)`,
                                boxShadow: `0 6px 20px ${accentColor}40`,
                                "&:hover": {
                                  filter: "brightness(0.95)",
                                  boxShadow: `0 10px 30px ${accentColor}59`,
                                  transform: "translateY(-1px)"
                                },
                              }
                            : {
                                borderColor: "#D1D5DB",
                                color: "#6B7280",
                                "&:hover": {
                                  borderColor: "#9CA3AF",
                                  backgroundColor: "rgba(243, 244, 246, 0.5)"
                                }
                              }),
                          transition: "all 0.3s ease"
                        }}
                      >
                        {!isAuthenticated
                          ? "Login to Vote"
                          : votingStatus.status === "active"
                            ? "Vote Now"
                            : votingStatus.status === "upcoming"
                              ? "Coming Soon"
                              : votingStatus.status === "ended"
                                ? "Voting Ended"
                                : "Inactive"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Empty State */}
        {filteredCategories.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No award categories are available at the moment."}
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="font-semibold"
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </Container>
    </div>
  );
};

export default Categories;
