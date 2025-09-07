import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
  HandThumbUpIcon,
  PhotoIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const NomineesManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [nominees, setNominees] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [nomineeForm, setNomineeForm] = useState({
    student: "",
    category: "",
    reason: "",
    achievements: "",
    image: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Queries
  const {
    isLoading: nomineesLoading,
    error: nomineesError,
  } = useQuery({
    queryKey: ["nominees"],
    queryFn: async () => {
      const response = await api.get("/nominees");
      setNominees(response.data.data.nominees);
      return response.data.data.nominees;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data.categories;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await api.get("/admin/users?role=student");
      return response.data.data.users;
    },
  });

  // Removed nomineeStats query as the endpoint doesn't exist and the data isn't used

  // Mutations
  const nomineeMutation = useMutation({
    mutationFn: async (nomineeData) => {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      if (selectedNominee) {
        return api.put(`/nominees/${selectedNominee._id}`, nomineeData, config);
      } else {
        return api.post("/nominees", nomineeData, config);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["nominees"]);
      handleCloseModal();
      toast.success(
        selectedNominee
          ? "Nominee updated successfully!"
          : "Nominee created successfully!"
      );
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save nominee"
      );
    },
  });

  const approveNomineeMutation = useMutation({
    mutationFn: async (nomineeId) => {
      return api.put(`/nominees/${nomineeId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["nominees"]);
      toast.success("Nominee approved successfully!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve nominee"
      );
    },
  });

  const rejectNomineeMutation = useMutation({
    mutationFn: async (nomineeId) => {
      return api.put(`/nominees/${nomineeId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["nominees"]);
      toast.success("Nominee rejected successfully!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject nominee"
      );
    },
  });

  const deleteNomineeMutation = useMutation({
    mutationFn: async (nomineeId) => {
      return api.delete(`/nominees/${nomineeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["nominees"]);
      toast.success("Nominee deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete nominee"
      );
    },
  });

  // Handlers
  const handleOpenModal = (nominee = null) => {
    setSelectedNominee(nominee);
    if (nominee) {
      setNomineeForm({
        student: nominee.student?._id || nominee.student || "",
        category: nominee.category?._id || nominee.category || "",
        reason: nominee.reason || "",
        achievements: nominee.achievements || "",
        image: null
      });
      setImagePreview(nominee.image || null);
    } else {
      setNomineeForm({
        student: "",
        category: "",
        reason: "",
        achievements: "",
        image: null
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNominee(null);
    setNomineeForm({
      student: "",
      category: "",
      reason: "",
      achievements: "",
      image: null
    });
    setImagePreview(null);
    setDragActive(false);
  };

  // File upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setNomineeForm({ ...nomineeForm, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setNomineeForm({ ...nomineeForm, image: null });
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!nomineeForm.student || !nomineeForm.category || !nomineeForm.reason.trim() || nomineeForm.reason.trim().length < 50) {
      toast.error("Please fill in all required fields and ensure reason is at least 50 characters");
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('student', nomineeForm.student);
    formData.append('category', nomineeForm.category);
    formData.append('reason', nomineeForm.reason);
    formData.append('achievements', nomineeForm.achievements);
    
    if (nomineeForm.image) {
      formData.append('image', nomineeForm.image);
    }

    nomineeMutation.mutate(formData);
  };

  const handleDelete = (nominee) => {
    const studentName = nominee.student?.firstName && nominee.student?.lastName 
        ? `${nominee.student.firstName} ${nominee.student.lastName}`
        : nominee.student?.firstName || nominee.student?.lastName || 'this nominee';
    if (window.confirm(`Are you sure you want to delete "${studentName}"?`)) {
      deleteNomineeMutation.mutate(nominee._id);
    }
    setOpenMenuId(null);
  };

  const handleApprove = (nominee) => {
    const studentName = nominee.student?.firstName && nominee.student?.lastName 
        ? `${nominee.student.firstName} ${nominee.student.lastName}`
        : nominee.student?.firstName || nominee.student?.lastName || 'this nominee';
    if (window.confirm(`Are you sure you want to approve "${studentName}"?`)) {
      approveNomineeMutation.mutate(nominee._id);
    }
    setOpenMenuId(null);
  };

  const handleReject = (nominee) => {
    const studentName = nominee.student?.firstName && nominee.student?.lastName 
        ? `${nominee.student.firstName} ${nominee.student.lastName}`
        : nominee.student?.firstName || nominee.student?.lastName || 'this nominee';
    if (window.confirm(`Are you sure you want to reject "${studentName}"?`)) {
      rejectNomineeMutation.mutate(nominee._id);
    }
    setOpenMenuId(null);
  };

  const getFilteredNominees = () => {
    if (!nominees || !Array.isArray(nominees)) return [];

    switch (currentTab) {
      case 0: // All
        return nominees;
      case 1: // Pending
        return nominees.filter((nominee) => nominee.status === "pending");
      case 2: // Approved
        return nominees.filter((nominee) => nominee.status === "approved");
      case 3: // Rejected
        return nominees.filter((nominee) => nominee.status === "rejected");
      default:
        return nominees;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories?.find((cat) => cat._id === categoryId);
    return category?.name || "Unknown Category";
  };

  const getTabCounts = () => {
    if (!nominees || !Array.isArray(nominees))
      return { all: 0, pending: 0, approved: 0, rejected: 0 };

    return {
      all: nominees.length,
      pending: nominees.filter((n) => n.status === "pending").length,
      approved: nominees.filter((n) => n.status === "approved").length,
      rejected: nominees.filter((n) => n.status === "rejected").length,
    };
  };

  if (nomineesLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </motion.div>
      </div>
    );
  }

  const filteredNominees = getFilteredNominees();
  const tabCounts = getTabCounts();

  const tabs = [
    { label: "All Nominees", count: tabCounts.all, color: "blue" },
    { label: "Pending", count: tabCounts.pending, color: "yellow" },
    { label: "Approved", count: tabCounts.approved, color: "green" },
    { label: "Rejected", count: tabCounts.rejected, color: "red" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nominees Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage nominees and their approval status
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Nominee
          </motion.button>
        </motion.div>

        {/* Error Alert */}
        {nomineesError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-center">
              <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">
                {nomineesError.response?.data?.message ||
                  nomineesError.message ||
                  "Failed to load nominees"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTab(index)}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentTab === index
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      currentTab === index
                        ? "bg-white/20 text-white"
                        : `bg-${tab.color}-100 text-${tab.color}-800`
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Nominees Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredNominees?.map((nominee, index) => (
              <motion.div
                key={nominee._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Nominee Image */}
                <div className="relative h-48 overflow-hidden">
                  {nominee.image ? (
                    <img
                      src={`http://localhost:5000${nominee.image}`}
                      alt={nominee.student?.firstName && nominee.student?.lastName 
                        ? `${nominee.student.firstName} ${nominee.student.lastName}`
                        : nominee.student?.firstName || nominee.student?.lastName || 'Student'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-gray-600">
                          {nominee.student?.firstName?.charAt(0) || nominee.student?.lastName?.charAt(0) || 'N'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions Menu */}
                  <div className="absolute top-4 right-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === nominee._id ? null : nominee._id)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors duration-200"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {openMenuId === nominee._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10"
                          >
                            <button
                              onClick={() => {
                                handleOpenModal(nominee);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <PencilIcon className="w-4 h-4 mr-3" />
                              Edit
                            </button>
                            {nominee.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(nominee)}
                                  className="w-full px-4 py-2 text-left text-green-700 hover:bg-green-50 flex items-center"
                                >
                                  <CheckIcon className="w-4 h-4 mr-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(nominee)}
                                  className="w-full px-4 py-2 text-left text-red-700 hover:bg-red-50 flex items-center"
                                >
                                  <XMarkIcon className="w-4 h-4 mr-3" />
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(nominee)}
                              className="w-full px-4 py-2 text-left text-red-700 hover:bg-red-50 flex items-center"
                            >
                              <TrashIcon className="w-4 h-4 mr-3" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {nominee.student?.firstName && nominee.student?.lastName 
                        ? `${nominee.student.firstName} ${nominee.student.lastName}`
                        : nominee.student?.firstName || nominee.student?.lastName || 'Unknown Student'}
                    </h3>
                    <p className="text-gray-600">
                      {getCategoryName(nominee.category._id || nominee.category)}
                    </p>
                  </div>

                  {/* Student Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <AcademicCapIcon className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">
                        {nominee.student?.studentId || 'N/A'} • {nominee.student?.department || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <UserIcon className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Level {nominee.student?.level || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {nominee.reason || "No nomination reason provided"}
                  </p>

                  {/* Status and Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        getStatusColor(nominee.status)
                      }`}
                    >
                      {nominee.status}
                    </span>
                    <div className="flex items-center text-gray-600">
                      <HandThumbUpIcon className="w-4 h-4 mr-1 text-blue-500" />
                      <span className="text-sm">{nominee.statistics?.totalVotes || 0} votes</span>
                    </div>
                  </div>

                  {/* Quick Actions for Pending */}
                  {nominee.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(nominee)}
                        disabled={approveNomineeMutation.isLoading}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center text-sm font-medium disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(nominee)}
                        disabled={rejectNomineeMutation.isLoading}
                        className="flex-1 border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center justify-center text-sm font-medium disabled:opacity-50"
                      >
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredNominees?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No nominees found
            </h3>
            <p className="text-gray-600 mb-6">
              {currentTab === 0
                ? "Create your first nominee to get started."
                : `No ${["all", "pending", "approved", "rejected"][currentTab]} nominees found.`}
            </p>
            {currentTab === 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Nominee
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Nominee Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedNominee ? "Edit Nominee" : "Create New Nominee"}
                  </h2>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student *
                      </label>
                      <select
                        value={nomineeForm.student}
                        onChange={(e) =>
                          setNomineeForm({ ...nomineeForm, student: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">Select Student</option>
                        {(students || []).map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.firstName} {student.lastName} ({student.studentId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={nomineeForm.category}
                        onChange={(e) =>
                          setNomineeForm({ ...nomineeForm, category: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">Select Category</option>
                        {(categories || []).map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Nomination * (min 50 characters)
                      </label>
                      <textarea
                        value={nomineeForm.reason}
                        onChange={(e) =>
                          setNomineeForm({
                            ...nomineeForm,
                            reason: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Explain why this person deserves to be nominated (minimum 50 characters)..."
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {nomineeForm.reason.length}/1000 characters
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Achievements
                      </label>
                      <textarea
                        value={nomineeForm.achievements}
                        onChange={(e) =>
                          setNomineeForm({
                            ...nomineeForm,
                            achievements: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Notable achievements and accomplishments..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nominee Picture
                      </label>
                      
                      {/* File Upload Area */}
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                          dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {imagePreview ? (
                          <div className="text-center">
                            <div className="relative inline-block">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-lg shadow-md"
                              />
                              <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              Click to change or drag a new image
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              {dragActive ? (
                                <CloudArrowUpIcon className="w-8 h-8 text-blue-500" />
                              ) : (
                                <PhotoIcon className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              {dragActive ? 'Drop image here' : 'Upload nominee picture'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Drag and drop an image, or click to browse
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Supports: JPG, PNG, GIF (Max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      nomineeMutation.isLoading ||
                      !nomineeForm.student ||
                      !nomineeForm.category ||
                      !nomineeForm.reason.trim() ||
                      nomineeForm.reason.trim().length < 50
                    }
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {nomineeMutation.isLoading
                      ? "Saving..."
                      : selectedNominee
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NomineesManagement;
