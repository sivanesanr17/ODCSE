import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [typingStarted, setTypingStarted] = useState(false);

  const navigate = useNavigate();
  const userEmail = localStorage.getItem("resetEmail");
  const otpVerified = localStorage.getItem("otpVerified");
  const otpToken = localStorage.getItem("otpToken");

  useEffect(() => {
    if (!userEmail || otpVerified !== "true" || !otpToken) {
      navigate("/forgot-password");
    }
  }, [navigate, userEmail, otpVerified, otpToken]);

  const checkPasswordStrength = (password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const strengthScore = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
    
    if (strengthScore <= 2) {
      setPasswordStrength("weak");
    } else if (strengthScore === 3 || strengthScore === 4) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: userEmail,
        password,
        otpToken,
      });

      if (response.data?.success) {
        setMessage("Updated! Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem("resetEmail");
          localStorage.removeItem("otpVerified");
          localStorage.removeItem("otpToken");
          navigate("/");
        }, 2000);
      } else {
        setError(response.data.message || "Error resetting password.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-[Poppins]">
      <div className="mt-0.5 mr-4">
        <img src="/assets/ODCSE Logo.png" alt="Logo" className="w-45 h-32" />
      </div>
      <div className="w-96">
        <h2 className="text-xl font-semibold mt-4 mb-2 text-left">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-4 text-left">Enter your new password below</p>
        <form onSubmit={handleResetPassword}>
          <div className="flex items-center bg-gray-200 rounded-md p-3">
            <FaLock className="text-gray-500 mr-2" />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
                setTypingStarted(true);
              }}
              required
              disabled={isSubmitting}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          {typingStarted && (
            <div className="w-full h-2 mt-2 rounded-md overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  passwordStrength === "weak" ? "bg-red-500 w-1/3" :
                  passwordStrength === "medium" ? "bg-yellow-500 w-2/3" :
                  "bg-green-500 w-full"
                }`}
              ></div>
            </div>
          )}
          <div className="flex items-center bg-gray-200 rounded-md p-3 mt-4">
            <FaLock className="text-gray-500 mr-2" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-md font-semibold tracking-wide hover:bg-gray-900 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
          <div className="min-h-[24px] mt-4 text-center">
            {message && <p className="text-green-500 text-sm">{message}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;