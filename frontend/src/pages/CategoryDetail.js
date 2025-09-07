import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserIcon,
  StarIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { categoriesAPI, nomineesAPI } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { motion } from "framer-motion";

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategoryData();
  }, [categoryId]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const [categoryResponse, nomineesResponse] = await Promise.all([
        categoriesAPI.getById(categoryId),
        nomineesAPI.getByCategory(categoryId),
      ]);

      setCategory(categoryResponse.data);
      setNominees(nomineesResponse.data.data.nominees || []);
    } catch (err) {
      setError("Failed to load category details");
      console.error("Error fetching category data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (nomineeId) => {
    navigate(`/vote/${categoryId}/${nomineeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner message="Loading category details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {category?.name}
            </h1>

            {category?.description && (
              <p className="text-lg text-gray-600 mb-4 max-w-3xl">
                {category.description}
              </p>
            )}

            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <UserIcon className="h-4 w-4 mr-1" />
              {nominees.length} Nominees
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {nominees.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <InformationCircleIcon className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No nominees found
            </h3>
            <p className="text-gray-600">
              No nominees found for this category yet.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nominees.map((nominee, index) => (
              <motion.div
                key={nominee._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-xl h-full flex flex-col">
                  {/* Nominee Image */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {nominee.image ? (
                      <img
                        src={nominee.image}
                        alt={nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {(nominee.student?.firstName || nominee.name)?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Nominee Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'Unknown Nominee'}
                    </h3>

                    {/* Description */}
                    {nominee.description && (
                      <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                        {nominee.description}
                      </p>
                    )}

                    {/* Achievements */}
                    {nominee.achievements &&
                      nominee.achievements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Achievements:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {nominee.achievements
                              .slice(0, 2)
                              .map((achievement, achievementIndex) => (
                                <span
                                  key={achievementIndex}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                                >
                                  <StarIcon className="h-3 w-3 mr-1" />
                                  {achievement.title || achievement}
                                </span>
                              ))}
                            {nominee.achievements.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{nominee.achievements.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Additional Info */}
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

                      {nominee.institution && (
                        <div className="flex items-center text-gray-600">
                          <BuildingOfficeIcon className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">{nominee.institution}</span>
                        </div>
                      )}
                    </div>

                    {/* Vote Button */}
                    <button
                      onClick={() => handleVoteClick(nominee._id)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <TrophyIcon className="h-4 w-4 mr-2" />
                      Vote for {nominee.student ? `${nominee.student.firstName} ${nominee.student.lastName}` : nominee.name || 'this nominee'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;
