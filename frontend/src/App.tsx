import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

// Primary Management Modules
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import ResourcesPage from "./pages/ResourcesPage";
import CategoriesLocationsPage from "./pages/CategoriesLocationsPage";
import BookingsPage from "./pages/BookingsPage";
import MaintenancePage from "./pages/MaintenancePage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
        <Router>
          <Routes>
            {/* Public Entry */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Application */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/categories-locations" element={<CategoriesLocationsPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/reports" element={<ReportsPage />} />

                {/* Legacy Portal Redirects */}
                <Route path="/lecture-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/student-dashboard" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* Default root redirection */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
