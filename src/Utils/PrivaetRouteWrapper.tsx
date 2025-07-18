import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: JSX.Element;
}

// Check for token in localStorage
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token"); // or check your auth state


  if(isAuthenticated){
    return <Navigate to="/dashboard" replace />;
  }
  if (!isAuthenticated) {
    // Not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  return children; // Authorized, render the component
};

export default PrivateRoute;
