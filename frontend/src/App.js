import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
// import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import StudentRoute from "./components/auth/StudentRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RegistrationResult from "./pages/auth/RegistrationResult";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Profile from "./pages/user/Profile";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import NomineeProfile from "./pages/NomineeProfile";
import Vote from "./pages/Vote";
import Leaderboard from "./pages/Leaderboard";
import Results from "./pages/Results";
import Dashboard from "./pages/user/Dashboard";
import Nominations from "./pages/user/Nominations";
import VotingHistory from "./pages/user/VotingHistory";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageCategories from "./pages/admin/ManageCategories";
import NomineesManagement from "./pages/admin/NomineesManagement";
import ManageUsers from "./pages/admin/ManageUsers";
import PaymentReports from "./pages/admin/PaymentReports";
import SystemSettings from "./pages/admin/SystemSettings";

// Error Pages
import NotFound from "./pages/errors/NotFound";
import ServerError from "./pages/errors/ServerError";

// Styles
import "./App.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
              <Navbar />

              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/register-result" element={<RegistrationResult />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Categories and Voting */}
                  <Route path="/categories" element={<Categories />} />
                  <Route
                    path="/categories/:categoryId"
                    element={<CategoryDetail />}
                  />
                  <Route
                    path="/nominees/:nomineeId"
                    element={<NomineeProfile />}
                  />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/results" element={<Results />} />

                  {/* Protected Routes */}
                  <Route
                    path="/vote"
                    element={<Navigate to="/categories" replace />}
                  />
                  <Route
                    path="/vote/:categoryId"
                    element={
                      <ProtectedRoute>
                        <Vote />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/vote/:categoryId/:nomineeId"
                    element={
                      <ProtectedRoute>
                        <Vote />
                      </ProtectedRoute>
                    }
                  />

                  {/* User Dashboard Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-nominations"
                    element={
                      <StudentRoute>
                        <Nominations />
                      </StudentRoute>
                    }
                  />

                  <Route
                    path="/voting-history"
                    element={
                      <ProtectedRoute>
                        <VotingHistory />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/categories"
                    element={
                      <AdminRoute>
                        <ManageCategories />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/nominees"
                    element={
                      <AdminRoute>
                        <NomineesManagement />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <ManageUsers />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/payments"
                    element={
                      <AdminRoute>
                        <PaymentReports />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/settings"
                    element={
                      <AdminRoute>
                        <SystemSettings />
                      </AdminRoute>
                    }
                  />

                  {/* Error Routes */}
                  <Route path="/server-error" element={<ServerError />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <Footer />

              {/* Global Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#10B981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: "#EF4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
