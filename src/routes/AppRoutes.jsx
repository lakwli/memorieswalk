import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import MemoryEditorPage from "../pages/MemoryEditorPage";
import AccountSettingsPage from "../pages/AccountSettingsPage"; // Import the new page

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/memory/:id"
        element={
          <ProtectedRoute>
            <MemoryEditorPage />
          </ProtectedRoute>
        }
      />
      {/* Add new route for account settings */}
      <Route
        path="/account-settings"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
