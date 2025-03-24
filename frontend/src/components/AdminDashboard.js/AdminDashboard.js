import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, Upload, History, Users, HelpCircle, LogOut, ChevronLeft, ChevronRight, UserPlus, UserMinus, UserPen, UserRoundCog } from "lucide-react";
import { Tooltip } from 'react-tooltip';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [odRequests, setOdRequests] = useState([]);
  const [showAddOptions, setShowAddOptions] = useState(false);  // To show/hide Staff & Student options

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/");
    }
    fetchUsers();
    fetchOdRequests();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchOdRequests = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/od-requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setOdRequests(response.data);
    } catch (error) {
      console.error("Error fetching OD requests:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleAddClick = () => {
    setShowAddOptions(true);  // Show Staff & Student options in the main content area
  };

  const handleStaffClick = () => {
    navigate('/add-staff');  // Navigate to Staff add page
  };

  const handleStudentClick = () => {
    navigate('/add-student');  // Navigate to Student add page
  };

  const handleChangeTutor = () => {
    // Add your change tutor navigation logic here
    navigate('/change-tutor');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-black text-white p-4 flex items-center justify-between w-full shadow-md">
        <img src="/assets/ODCSE Logo.png" alt="Logo" className="h-10 w-auto filter brightness-0 invert" />
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`bg-white p-4 shadow-md flex flex-col justify-between ${isCollapsed ? 'w-20' : 'w-52'} transition-all relative`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="absolute -right-3 top-4 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          <div className="mt-8">
            <nav className="space-y-4">
              {/* Add button */}
              <div 
                onClick={handleAddClick}
                className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Add</span>}
              </div>

              <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                <UserMinus className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Remove</span>}
              </a>

              <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                <UserPen className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Edit</span>}
              </a>

              {/* New Change Tutor option */}
              <div 
                onClick={handleChangeTutor}
                className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <UserRoundCog className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Change Tutor</span>}
              </div>

              <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                <HelpCircle className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Support</span>}
              </a>
            </nav>
          </div>

          <div className="border-t border-gray-200">
            <div className="flex items-center justify-between p-2">
              {!isCollapsed && (
                <div className="flex items-center min-w-0">
                  <div className="flex-shrink-0 mr-2">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="/assets/user-avatar.png"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"; }}
                      alt="User Avatar"
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                  <div className="text-sm font-medium text-gray-700">Admin</div>
                  <div 
                    className="text-xs text-gray-500 truncate"
                    data-tooltip-id="email-tooltip"
                    data-tooltip-content="admin@verylongemailaddress@example.com"
                  >
                    admin@verylongemailaddress@example.com
                  </div>
                  <Tooltip id="email-tooltip" />
                </div>
                </div>
              )}
              <div className="flex items-center cursor-pointer" onClick={handleLogout}>
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-100">
          <h2 className="text-xl font-semibold mb-4">Manage Users & OD Requests</h2>

          {/* Display Add Options */}
          {showAddOptions ? (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Add Staff or Student</h3>
              <div className="flex gap-4">
                <button
                  onClick={handleStaffClick}
                  className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add Staff
                </button>
                <button
                  onClick={handleStudentClick}
                  className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Add Student
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">Users</h3>
                <table className="w-full mt-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2">{user.name}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;