import { useState, useEffect } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";
//All good Visva added
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
      setError("Both fields are required!");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Invalid email format!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("userName", response.data.name);

        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          if (response.data.role === "user") {
            navigate(`/userdashboard/${response.data.name.toLowerCase().replace(/\s+/g, "-")}`);
          } else if (response.data.role === "staff") {
            navigate(`/staffdashboard/${response.data.name.toLowerCase().replace(/\s+/g, "-")}`);
          }
        }, 1000);
      }
      else {
        setError("Invalid credentials!");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.clear();
      navigate("/");
    }, 1800000); // 30 minutes inactivity

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    function resetTimer() {
      clearTimeout(timeout);
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  return (
    <div className="login-container">
      <img src="/assets/ODCSE Logo.png" alt="Logo" className="logo" />

      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <FaEnvelope className="icon" />
          <input
            type="email"
            placeholder="College Mail ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="forget-password">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/forgot-password"); }}>
            Forgot Password?
          </a>
        </div>

        <button type="submit" className="login-button">Login</button>

        <div className="message-container">
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </div>
      </form>
    </div>
  );
};

export default Login;
