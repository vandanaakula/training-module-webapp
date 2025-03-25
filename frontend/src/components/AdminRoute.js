import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  // Check if user is authenticated and is an admin
  const isAuthenticated = localStorage.getItem("token") !== null;
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";
  
  // Redirect to login if not authenticated or to dashboard if authenticated but not admin
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  } else if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

export default AdminRoute;