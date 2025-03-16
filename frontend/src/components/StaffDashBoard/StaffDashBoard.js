import React, { useState } from "react";
import { Bell, UserCircle, Calendar, Upload, History, Users, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StaffDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // ✅ Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {};
  
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar */}
      <aside className={`bg-white p-4 shadow-md flex flex-col justify-between ${isCollapsed ? 'w-20' : 'w-64'} transition-all`}>
        <div className="mt-4">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center justify-center w-full">
              {!isCollapsed && <span className="text-3xl font-bold">ODCSE</span>}
            </div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-600 focus:outline-none">
              {isCollapsed ? '▶' : '◀'}
            </button>
          </div>
          
          {/* Menu */}
          <nav className="space-y-6 mt-6">
            <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-100">
              <Calendar className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">Events</span>}
            </a>
            <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-100">
              <Upload className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">Upload Events</span>}
            </a>
            <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-100">
              <History className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">History</span>}
            </a>
            <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-100">
              <Bell className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">Notification</span>}
            </a>
            <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-100">
              <Users className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">Students List</span>}
            </a>
            <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-100">
              <HelpCircle className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">Support</span>}
            </a>
          </nav>
        </div>

        {/* ✅ User Profile and Logout */}
        {/* ✅ User Profile and Logout */}
        <div 
          className="flex items-center justify-between p-2 border-t border-gray-200 mt-6 cursor-pointer"
          onClick={() => navigate("/profile")}
        >
          <div className="flex items-center">
            <img 
              src="https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_hybrid" 
              alt="User" 
              className="w-8 h-8 rounded-full"
            />
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-semibold">{localStorage.getItem("userName") || "John Doe"}</p>
                <p className="text-xs text-gray-500">{localStorage.getItem("userEmail") || "johndoe@gmail.com"}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 shadow-md rounded-md">
          <h2 className="text-xl font-semibold">Events</h2>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
