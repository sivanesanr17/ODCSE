import { useState, useEffect } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
  
    if (!email || !password) {
      setError("⚠️ Both fields are required!");
      return;
    }
  
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("⚠️ Invalid email format!");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
  
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("userName", response.data.name);
        localStorage.setItem("user", JSON.stringify({
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }));
  
        setSuccess("Login successful! Redirecting...");
        const role = (response.data.role || "").toLowerCase().trim();

        setTimeout(() => {
        if (role === "admin") {
          navigate("/adminpanel");
        } else if (role === "staff") {
          navigate(`/staffdashboard/${response.data.name.toLowerCase().replace(/\s+/g, "-")}`);
        } else if (role === "user") {
          navigate(`/userdashboard/${response.data.name.toLowerCase().replace(/\s+/g, "-")}`);
        } else {
          // Handle unexpected roles
          setError("Unknown user role");
        }
        }, 1000);
      } else {
        setError("Invalid credentials!");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Logo */}
      <div className="mb-4 mr-4">
        <img
          src="/assets/ODCSE Logo.png"
          alt="Logo"
          className="w-45 h-32"
        />
      </div>

      {/* Login Form */}
      <form 
        onSubmit={handleSubmit} 
        className="w-96 space-y-4"
      >
        {/* Email Field */}
        <div className="flex items-center bg-gray-200 rounded-md p-3">
          <FaEnvelope className="text-gray-500 mr-2" />
          <input
            type="email"
            placeholder="College Mail ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Password Field */}
        <div className="flex items-center bg-gray-200 rounded-md p-3">
          <FaLock className="text-gray-500 mr-2" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Forgot Password */}
        <div className="relative">
          <a
            href="#"
            className="absolute -top-2.5 right-0 text-[10px] text-gray-600 hover:text-blue-600 transition"
            onClick={(e) => {
              e.preventDefault();
              navigate("/forgot-password");
            }}
          >
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md font-semibold tracking-wider hover:bg-gray-900 transition-all duration-300"
        >
          Login
        </button>

      </form>

      {/* ✅ Success and Error Messages (Fixed Height to Prevent UI Shifting) */}
      <div className="h-6 mt-4 text-center">
        {success && <p className="text-green-500 text-sm">{success}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default Login;