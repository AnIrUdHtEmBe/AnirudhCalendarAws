import React from "react";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";

const LogoutModal: React.FC = () => {
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    // Remove token from sessionStorage
    sessionStorage.removeItem("token");
    
    // Show success message
    enqueueSnackbar("Logged out successfully!", { variant: "success" });
    
    // Navigate to login page
    navigate("/");
  };

  const handleCancelLogout = () => {
    // Navigate back to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 bg-blur bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Confirm Logout
        </h2>
        
        <p className="text-center text-gray-600 mb-8">
          Are you sure you want to logout?
        </p>
        
        <div className="flex space-x-4">
          <button
            onClick={handleCancelLogout}
            className="flex-1 py-2 rounded-md text-gray-700 font-semibold transition-colors bg-gray-200 hover:bg-gray-300"
          >
            No
          </button>
          
          <button
            onClick={handleConfirmLogout}
            className="flex-1 py-2 rounded-md text-white font-semibold transition-colors bg-red-600 hover:bg-red-700"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;