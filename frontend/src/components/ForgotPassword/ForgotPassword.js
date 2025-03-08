import React, { useState } from "react";
import axios from "axios";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./forgotpassword.module.css";
//hin hello
const ForgotPasswordPage = () => {
  const [userEmail, setUserEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setOtpMessage("");
    setOtpError("");

    if (!userEmail.trim()) {
      setOtpError("Email is required.");
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userEmail)) {
      setOtpError("Invalid email format.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Sending OTP request...");

      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: userEmail,
      });

      console.log("Response Data:", response.data);

      if (response.data?.exists) {
        setOtpMessage(response.data.message || "OTP sent successfully!");

        localStorage.setItem("resetEmail", userEmail);
        localStorage.setItem("otpSent", "true");

        console.log("Navigating to /verify-otp");
        navigate("/verify-otp");
      } else {
        setOtpError(response.data.message || "Email not found.");
      }
    } catch (err) {
      setOtpError("Error sending OTP. Please try again.");
      console.error("Forgot Password Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.forgotPasswordContainer}>
      {/* Back Arrow Icon */}
      <FaArrowLeft className={styles.backIcon} onClick={() => navigate("/")} />

      <img src="/assets/ODCSE Logo.png" alt="Logo" className={styles.logo} />

      <form onSubmit={handlePasswordResetRequest} className={styles.forgotPasswordCard}>
        <h2>Forgot Password</h2>
        <p>Enter your college email to receive an OTP</p>

        <div className={styles.inputGroup}>
          <FaEnvelope className={styles.icon} />
          <input
            type="email"
            placeholder="Enter your College Mail ID"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" className={styles.forgotPasswordButton} disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send OTP"}
        </button>

        <div className={styles.messageContainer}>
          {otpMessage && <p className={styles.successMessage}>{otpMessage}</p>}
          {otpError && <p className={styles.errorMessage}>{otpError}</p>}
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
