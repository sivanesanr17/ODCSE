import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/LoginPage/Login";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import VerifyOtpPage from "./components/VerifyOtpPage/VerifyOtpPage";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import UserDashboard from "./components/UserDashBoard/UserDashBoard";
import StaffDashboard from "./components/StaffDashBoard/StaffDashBoard";
import AdminDashboard from "./components/AdminDashboard.js/AdminDashboard";
import Profile from "./components/Profile/Profile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard Routes (Now handle authentication inside each component) */}
        <Route path="/userdashboard/:username" element={<UserDashboard />} />
        <Route path="/staffdashboard/:username" element={<StaffDashboard />} />
        <Route path="/adminpanel" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
