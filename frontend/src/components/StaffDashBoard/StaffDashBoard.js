import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoPersonCircleOutline } from "react-icons/io5";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';

const StaffDashboard = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/"); // Redirect to login if not authenticated
    }
  }, [navigate]);

  const displayName = username ? username.replace("-", " ") : "Staff Name";

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow-md">
      {/* Logo */}
      <div className="mr-4 flex-shrink-0">
        <img
          src="/assets/ODCSE Logo.png"
          alt="Logo"
          className="w-21 h-11"
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative cursor-pointer" onClick={() => navigate("/notifications")}>
          <FontAwesomeIcon icon={faBell} className="text-xl text-black" />
          <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
        </div>
        <IoPersonCircleOutline
          className="text-3xl text-black cursor-pointer"
          onClick={() => navigate("/profile")}
        />
      </div>
    </div>
  );
};

export default StaffDashboard;