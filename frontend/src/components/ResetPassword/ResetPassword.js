import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./resetpassword.module.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const userEmail = localStorage.getItem("resetEmail");
  const otpVerified = localStorage.getItem("otpVerified");
  const otpToken = localStorage.getItem("otpToken");

  useEffect(() => {
    if (!userEmail || otpVerified !== "true") {
      navigate("/forgot-password");
    }
  }, []);

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

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long, include uppercase, lowercase, number, and a special character."
      );
      return;
    }

    if (!otpToken) {
      setError("OTP verification required. Please restart the process.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { email: userEmail, password, otpToken }
      );

      if (response.data?.success) {
        setMessage("Updated! Redirecting to login...");
        setError(""); // Clear error if any

        // Wait for 2 seconds, then clear local storage and navigate
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
    <div className={styles.resetPasswordContainer}>
      <img src="/assets/ODCSE Logo.png" alt="Logo" className={styles.logo} />

      <div className={styles.resetPasswordCard}>
        <h2>Reset Password</h2>
        <p>Enter your new password below</p>

        <form onSubmit={handleResetPassword}>
          <div className={styles.inputGroup}>
            <FaLock className={styles.icon} />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.inputGroup}>
            <FaLock className={styles.icon} />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={styles.resetPasswordButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>

          <div className={styles.messageContainer}>
            {message && <p className={styles.successMessage} style={{ color: "green" }}>{message}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
