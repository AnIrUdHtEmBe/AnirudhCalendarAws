import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { API_BASE_URL_Latest } from "../BookingCalendarComponent/AxiosApi";

const PasswordChange: React.FC = () => {
  const [formState, setFormState] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "", // ✅ Added confirm password field
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Check if both passwords match
    if (formState.newPassword !== formState.confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL_Latest}/auth/reset-password`, {
        email: formState.email,
        otp: formState.otp,
        newPassword: formState.newPassword,
      });

      enqueueSnackbar(response.data?.message || "Password changed successfully", { variant: "success" });
      navigate("/"); // ✅ Redirect to login on success
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Invalid OTP", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Change Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter Email"
              value={formState.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* OTP Field */}
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter OTP
            </label>
            <input
              type="text"
              name="otp"
              id="otp"
              placeholder="Enter OTP"
              value={formState.otp}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* New Password Field */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              placeholder="New Password"
              value={formState.newPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ✅ Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Confirm Password"
              value={formState.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white font-semibold transition-colors ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>

          {/* Go back to login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 cursor-pointer hover:underline"
            >
              Go back to Login
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
