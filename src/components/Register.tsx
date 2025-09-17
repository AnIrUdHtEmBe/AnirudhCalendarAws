import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { API_BASE_URL, API_BASE_URL2 } from "../store/axios";

const USER_TYPES = [
  "employee",
  "coach_sports",
  "coach_wellness",
  "coach_fitness",
  "forge",
  "play",
  "other",
] as const;

type UserType = typeof USER_TYPES[number];

type FormData = {
  type: UserType;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mobile: string;
  email: string;
  password: string;
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    type: "play",
    name: "",
    age: 0,
    gender: "male",
    mobile: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // For age and mobile, add basic input restriction if needed
    if (name === "age") {
      const age = parseInt(value, 10);
      if (!isNaN(age) && age >= 0) {
        setFormData((prev) => ({ ...prev, age }));
      } else if (value === "") {
        setFormData((prev) => ({ ...prev, age: 0 }));
      }
      return;
    }

    if (name === "mobile") {
      // Basic numeric only, max 10 digits (or your criteria)
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 15) {
        setFormData((prev) => ({ ...prev, mobile: numericValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL2}/human/register`,
        formData
      );

      if (response.status === 200) {
        enqueueSnackbar("Registered successfully! Please login.", {
          variant: "success",
        });
        navigate("/"); // redirect to login
      } else {
        enqueueSnackbar("Registration failed. Please try again.", {
          variant: "error",
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Some error occurred.";
      enqueueSnackbar(msg, { variant: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Register
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              User Type
            </label>
            <select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {USER_TYPES.map((ut) => (
                <option key={ut} value={ut}>
                  {ut.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-bolder text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              minLength={2}
            />
          </div>

          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Age
            </label>
            <input
              type="number"
              name="age"
              id="age"
              placeholder="Age"
              value={formData.age === 0 ? "" : formData.age}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={0}
              max={150}
            />
          </div>

          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gender
            </label>
            <select
              name="gender"
              id="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mobile"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mobile
            </label>
            <input
              type="tel"
              name="mobile"
              id="mobile"
              placeholder="Mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
              maxLength={15}
              pattern="[0-9]+"
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white font-semibold transition-colors ${
              loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
