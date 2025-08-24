import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}
