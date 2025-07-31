import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { API_BASE_URL_Latest } from "../BookingCalendarComponent/AxiosApi";
import { DataContext } from "../store/DataContext";

const USER_TYPES = [
  "admin",
  "employee",
  "coach_sports",
  "coach_wellness",
  "coach_fitness",
  "forge",
  "play",
  "nutritionist",
  "other",
] as const;

type UserType = typeof USER_TYPES[number];

const Login: React.FC = () => {
  const [formState, setFormState] = useState({
    type: "play" as UserType,
    loginId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const context = useContext(DataContext);
  if (!context) { return null; }
  const { setIsAuthenticated, setSelectComponent } = context
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // setFormState((prev) => ({
    //   ...prev,
    //   [name]: value,
    // }));
    if (name === "loginId") {
    const trimmed = value.trim();

    // If only digits → mobile number
    const isMobile = /^\d*$/.test(trimmed);
    if (isMobile) {
      if (trimmed.length <= 10) {
        setFormState((prev) => ({
          ...prev,
          [name]: trimmed,
        }));
      }
      return; // prevent setting if over 10 digits
    }

    // Otherwise → treat as email
    if (trimmed.length <= 32) {
      setFormState((prev) => ({
        ...prev,
        [name]: trimmed,
      }));
    }
    return; // prevent setting if over 32 chars
  }

  // Default for other fields
  setFormState((prev) => ({
    ...prev,
    [name]: value,
  }));
  };
  const isValidGmail = (email: string) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };
  // function isEmailUsernameAlphanumeric(email: any) {
  //   const emailStr = String(email);
  //   const [username] = emailStr.split('@');
  //   return /^[a-zA-Z0-9]+$/.test(username);
  // }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidMobile(mobile: string): boolean {
    return /^\d{10}$/.test(mobile);
  }
  const [status, setStatus] = useState(true);

  function detectInputType(input: any): 'email' | 'mobile' | 'invalid' {
    const trimmed = String(input).trim();
    if (isValidMobile(trimmed)) return 'mobile';
    if (isValidEmail(trimmed)) return 'email';
    return 'invalid';
  }
  //comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const inputType = detectInputType(formState.loginId);
      console.log(inputType)
      if (inputType === 'email') {

        if (!isValidGmail(formState.loginId)) {
          enqueueSnackbar("Enter proper Gmail ID", {
            variant: "warning",
          });
          setStatus(false)
          return;
        }
        if (formState.loginId.length > 32) {
          enqueueSnackbar("Enter proper Gmail ID", {
            variant: "warning",
          });
          setStatus(false)
          return
        }
      } else if (inputType === 'mobile') {
        if (formState.loginId.length > 10) {
          enqueueSnackbar("Enter proper number", {
            variant: "warning",
          });
          setStatus(false)
          return;
        }
        if (formState.loginId.length < 10) {
          enqueueSnackbar("Enter proper number", {
            variant: "warning",
          });
          setStatus(false)
          return;
        }
      }
      if (status) {
        try {
          const response = await axios.post(`${API_BASE_URL_Latest}/auth/login`, {
            loginId: formState.loginId,
            password: formState.password,

          });

          if (response.status === 200 && response.data.accessToken) {
            sessionStorage.setItem("token", response.data.accessToken);
            enqueueSnackbar("Logged in successfully!", { variant: "success" });
            setIsAuthenticated(true)
            setSelectComponent("Dashboard")
            navigate("/Dashboard");

          } else {
            enqueueSnackbar("Login failed. Please check your credentials.", { variant: "error" });
          }
        } catch (err: any) {
          const msg = err?.response?.data?.message || "Some error occurred. Try again later!";
          enqueueSnackbar(msg, { variant: "error" });
        }

      }

    } catch (err: any) {
      const msg = err?.response?.data?.message || "Some error occurred. Try again later!";
      enqueueSnackbar(msg, { variant: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <select
              name="type"
              id="type"
              value={formState.type}
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
          </div> */}

          <div>
            <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-1">
              Email Or Mobile
            </label>
            <input
              type="text"
              name="loginId"
              id="loginId"
              placeholder="Email or Mobile"
              value={formState.loginId}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>


          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={formState.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white font-semibold transition-colors ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {/* <div className="bg-blue-600 text-white text-sm rounded-md p-1 mt-4 hover:bg-blue-700 w-fit" onClick={() => navigate("/register")}>
            Resgister
        </div> */}
      </div>
    </div>
  );
};

export default Login;
