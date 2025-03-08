import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaKey } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

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
      setOtpError("⚠️ OTP is required.");
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
        localStorage.setItem("otpToken", response.data.otpToken);
        localStorage.removeItem("otpSent");

        setTimeout(() => {
          navigate("/reset-password");
        }, 500);
      } else {
        setOtpError(response.data.message || "❌ Invalid OTP.");
      }
    } catch (err) {
      setOtpError("❌ Invalid or expired OTP. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-[Poppins]">
      {/* Logo */}
      <div className="mt-0.5 mr-4">
        <img
          src="/assets/ODCSE Logo.png"
          alt="Logo"
          className="w-45 h-32"
        />
      </div>

      {/* Verify OTP Card */}
      <div className="w-96">
        <h2 className="text-xl font-semibold mt-4 mb-2 text-left">Verify OTP</h2>
        <p className="text-sm text-gray-500 mb-4 text-left">Enter the OTP sent to your email</p>

        {/* OTP Input */}
        <div className="flex items-center bg-gray-200 rounded-md p-3">
          <FaKey className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md font-semibold tracking-wide hover:bg-gray-900 transition-all duration-300"
            onClick={handleOtpVerification}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </div>

        {/* Success/Error Messages */}
        <div className="min-h-[24px] mt-4 text-center">
          {otpMessage && <p className="text-green-500 text-sm">{otpMessage}</p>}
          {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
