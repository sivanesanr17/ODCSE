import React, { useState } from "react";
import axios from "axios";
import { FaEnvelope } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md"; // ✅ New Icon
import { useNavigate } from "react-router-dom";

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
      setOtpError("⚠️ Email is required.");
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userEmail)) {
      setOtpError("⚠️ Invalid email format.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: userEmail,
      });

      if (response.data?.exists) {
        setOtpMessage(response.data.message || "✅ OTP sent successfully!");
        localStorage.setItem("resetEmail", userEmail);
        localStorage.setItem("otpSent", "true");
        navigate("/verify-otp");
      } else {
        setOtpError(response.data.message || "❌ Email not found.");
      }
    } catch (err) {
      setOtpError("❌ Error sending OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handlePasswordResetRequest(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-[Poppins]">
      {/* Back Button */}
      <button
        className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-gray-600 transition"
        onClick={() => navigate("/")}
      >
        <MdArrowBack className="text-2xl mr-1" />
        <span className="text-sm">Back</span>
      </button>

      {/* Logo */}
      <div className="mt-0.5 mr-4">
        <img
          src="/assets/ODCSE Logo.png"
          alt="Logo"
          className="w-45 h-32"
        />
      </div>

      {/* Forgot Password Card */}
      <div className="w-96">
        <h2 className="text-xl font-semibold mt-4 mb-2 text-left">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-500 mb-4 text-left">
          Enter your college email to receive an OTP
        </p>

        {/* Email Input */}
        <div className="flex items-center bg-gray-200 rounded-md p-3">
          <FaEnvelope className="text-gray-500 mr-2" />
          <input
            type="email"
            placeholder="Enter your College Mail ID"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            onKeyDown={handleKeyDown} // ✅ Handle Enter Key
            className="w-full bg-transparent outline-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md font-semibold tracking-wide hover:bg-gray-900 transition-all duration-300"
            onClick={handlePasswordResetRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send OTP"}
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

export default ForgotPasswordPage;
