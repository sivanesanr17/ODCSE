import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const UserDashBoard = () => {
  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/"); // Redirect to login if not authenticated
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-600 p-4 rounded-t-lg shadow-md">
          <img
            src="/assets/ODCSE Logo.png"
            alt="Logo"
            className="h-12 w-12"
          />
          <FaUserCircle
            className="text-white text-3xl cursor-pointer"
            onClick={() => navigate("/profile")}
          />
        </div>

        {/* Welcome Message */}
        <div className="bg-white p-6 rounded-b-lg shadow-md">
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome {username} to User Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            This is the user panel where you can view events, upload events, and check your history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashBoard;
