import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaKey, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./verifyotp.module.css";  // ✅ Import local CSS module

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Prevent unauthorized access if no OTP request was made
  useEffect(() => {
    const otpSent = localStorage.getItem("otpSent");
    if (!otpSent) {
      navigate("/forgot-password");
    }
  }, [navigate]);

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setOtpMessage("");
    setOtpError("");

    if (!otp.trim()) {
      setOtpError("OTP is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const userEmail = localStorage.getItem("resetEmail");

      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: userEmail,
        otp,
      });

      if (response.data?.verified) {
        localStorage.setItem("otpVerified", "true");
        localStorage.setItem("otpToken",response.data.otpToken);
        localStorage.removeItem("otpSent");

        setTimeout(() => {
          navigate("/reset-password");
        });
      } else {
        setOtpError(response.data.message || "Invalid OTP.");
      }
    } catch (err) {
      setOtpError("Invalid or expired OTP. Try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.verifyOtpContainer}>
      
      <img src="/assets/ODCSE Logo.png" alt="Logo" className={styles.logo} />

      <div className={styles.verifyOtpCard}>
        <h2>Verify OTP</h2>
        <p>Enter the OTP sent to your email</p>

        <form onSubmit={handleOtpVerification}>
          <div className={styles.inputGroup}>
            <FaKey className={styles.icon} />
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className={styles.verifyOtpButton} disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>

          <div className={styles.messageContainer}>
            {otpMessage && <p className={styles.successMessage}>{otpMessage}</p>}
            {otpError && <p className={styles.errorMessage}>{otpError}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
