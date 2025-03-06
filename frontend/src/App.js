import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/LoginPage/Login";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import VerifyOtpPage from "./components/VerifyOtpPage/VerifyOtpPage";
import ResetPassword from "./components/ResetPassword/ResetPassword"; // Ensure the correct path

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPassword />} /> {/* Added missing route */}
      </Routes>
    </Router>
  );
}

export default App;
