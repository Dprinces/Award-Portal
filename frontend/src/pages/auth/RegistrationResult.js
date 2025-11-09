import React from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const RegistrationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const qs = new URLSearchParams(location.search);
  const statusFromQuery = qs.get("status");

  const status = location.state?.status || statusFromQuery || "success"; // default to success
  const message =
    location.state?.message ||
    (status === "success"
      ? "Registration successful! Your account has been created."
      : "Registration failed. Please review your details and try again.");
  const email = location.state?.email || "";

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background blobs */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-20 h-20 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20"
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg ${
                isSuccess ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-pink-600"
              }`}
            >
              {isSuccess ? (
                <CheckCircleIcon className="w-12 h-12 text-white" />
              ) : (
                <ExclamationTriangleIcon className="w-12 h-12 text-white" />
              )}
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSuccess ? "Registration Successful" : "Registration Failed"}
            </h1>

            <div
              className={`mb-6 p-4 rounded-xl border ${
                isSuccess
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p className={`text-sm ${isSuccess ? "text-green-800" : "text-red-800"}`}>
                {message}
              </p>
              {email && isSuccess && (
                <p className="mt-2 text-xs text-gray-500">Registered email: {email}</p>
              )}
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/login")}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${
                  isSuccess
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                Back to Login
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/register")}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Back to Registration
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationResult;