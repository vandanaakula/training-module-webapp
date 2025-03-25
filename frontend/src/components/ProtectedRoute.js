import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated by looking for token
  const isAuthenticated = localStorage.getItem("token") !== null;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;