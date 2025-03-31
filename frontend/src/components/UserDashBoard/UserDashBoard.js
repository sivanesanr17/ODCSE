import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  FilePlus,
  History, 
  HelpCircle, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  UserRoundPlus,
  User
} from "lucide-react";
import { Tooltip } from 'react-tooltip';

const UserDashBoard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [odHistory, setOdHistory] = useState([]);
  const [eventName, setEventName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [tutorName, setTutorName] = useState("");
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch current user data from backend
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/user", {
        params: { email: localStorage.getItem("userEmail") },
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      
      setCurrentUser(response.data);
      
      // Auto-populate student details
      setStudents([{
        registerNumber: response.data.registerNumber,
        name: response.data.name,
        semester: response.data.semester,
        section: response.data.section,
        attendancePercentage: response.data.attendancePercentage,
      }]);
      
      setTutorName(response.data.tutorName || "");
    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch OD history from backend
  const fetchOdHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/od/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setOdHistory(response.data);
    } catch (error) {
      console.error("Error fetching OD history:", error);
    }
  };

  // Fetch student details from backend
  const fetchStudentDetails = async (registerNumber) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${registerNumber}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching student details:", error);
      return null;
    }
  };

  // Handle register number input changes
  const handleRegisterNumberChange = async (index, value) => {
    const newStudents = [...students];
    newStudents[index].registerNumber = value;

    const studentDetails = await fetchStudentDetails(value);
    if (studentDetails) {
      newStudents[index] = {
        ...newStudents[index],
        name: studentDetails.name,
        semester: studentDetails.semester,
        section: studentDetails.section,
        attendancePercentage: studentDetails.attendancePercentage
      };
      if (index === 0) setTutorName(studentDetails.tutor);
    } else {
      newStudents[index] = {
        ...newStudents[index],
        name: "",
        semester: "",
        section: "",
        attendancePercentage: ""
      };
      if (index === 0) setTutorName("");
    }

    setStudents(newStudents);
  };

  // Add a new student row
  const addStudentRow = async () => {
    const registerNumber = prompt("Enter register number:");
    if (registerNumber) {
      const studentDetails = await fetchStudentDetails(registerNumber);
      if (studentDetails) {
        // Send invitation email via backend
        await axios.post("http://localhost:5000/api/send-invitation", {
          email: studentDetails.email,
          eventName,
          fromDate,
          toDate,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });

        setStudents([...students, {
          registerNumber,
          name: studentDetails.name,
          semester: studentDetails.semester,
          section: studentDetails.section,
          attendancePercentage: studentDetails.attendancePercentage,
        }]);
      } else {
        alert("Student not found!");
      }
    }
  };

  // Submit OD form
  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/od/submit", {
        eventName,
        fromDate,
        toDate,
        numberOfDays,
        tutorName,
        students,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      
      alert("OD submitted successfully!");
      fetchOdHistory();
      setActiveTab("odHistory");
    } catch (error) {
      console.error("Error submitting OD:", error);
      alert("Failed to submit OD");
    }
  };

  // Calculate number of days when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const timeDiff = to - from;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
      setNumberOfDays(daysDiff);
    }
  }, [fromDate, toDate]);

  // Check if form is valid
  const isFormValid = () => {
    if (!eventName || !fromDate || !toDate || !tutorName) return false;
    return students.every(student => 
      student.registerNumber && 
      student.name && 
      student.semester && 
      student.section && 
      student.attendancePercentage
    );
  };

  // Initialize component
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/");
    }
    fetchCurrentUser();
    fetchOdHistory();
  }, [navigate]);

  // Profile Section Component
  const ProfileSection = () => (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
          {currentUser?.name?.charAt(0) || "U"}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
          <ProfileDetail label="Full Name" value={currentUser?.name} icon={<User className="text-blue-500" />} />
          <ProfileDetail label="Email" value={currentUser?.email} icon={<span className="text-blue-500">@</span>} />
          <ProfileDetail label="Register Number" value={currentUser?.registerNumber} icon={<span className="text-blue-500">#</span>} />
        </div>
        
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">Academic Details</h3>
          <ProfileDetail label="Semester" value={currentUser?.semester} icon={<span className="text-blue-500">S</span>} />
          <ProfileDetail label="Tutor" value={currentUser?.tutorName || "Not assigned"} icon={<span className="text-blue-500">T</span>} />
        </div>
      </div>
    </div>
  );

  // Reusable Profile Detail Component
  const ProfileDetail = ({ label, value, icon }) => (
    <div className="flex items-start">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800 mt-1">{value || "-"}</p>
      </div>
    </div>
  );

  const ODRequestForm = () => (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Department of Computer Science</h1>
        <h2 className="text-xl font-semibold text-gray-600 mt-2">On Duty Request Form</h2>
      </div>
      
      <div className="space-y-8">
        <div>
          <label className="block text-gray-700 mb-2 font-medium">Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter event name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-medium">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Number of Days</label>
            <input
              type="text"
              value={numberOfDays}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Tutor Name</label>
            <input
              type="text"
              value={tutorName}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Student Details</h3>
            <button
              onClick={addStudentRow}
              className="flex items-center space-x-1 bg-black text-white px-4 py-2 rounded-lg"
            >
              <UserRoundPlus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.registerNumber}
                        onChange={(e) => handleRegisterNumberChange(index, e.target.value)}
                        className={`w-full p-2 border rounded ${index === 0 ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        readOnly={index === 0}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.name}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.semester}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.section}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.attendancePercentage}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid()}
            className={`px-8 py-3 rounded-lg text-white font-medium ${isFormValid() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'} transition-colors`}
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );

  // Sidebar Component
  const Sidebar = () => (
    <aside className={`bg-white p-4 shadow-md flex flex-col justify-between ${isCollapsed ? 'w-20' : 'w-52'} transition-all relative`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute -right-3 top-4 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="mt-8">
        <nav className="space-y-4">
          <div 
            onClick={() => { setActiveTab("events"); setShowProfile(false); }}
            className={`flex items-center p-2 rounded-md ${activeTab === "events" && !showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <Calendar className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Events</span>}
          </div>

          <div 
            onClick={() => { setActiveTab("odRequest"); setShowProfile(false); }}
            className={`flex items-center p-2 rounded-md ${activeTab === "odRequest" && !showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <FilePlus className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">OD Request</span>}
          </div>

          <div 
            onClick={() => { setActiveTab("odHistory"); setShowProfile(false); }}
            className={`flex items-center p-2 rounded-md ${activeTab === "odHistory" && !showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <History className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">OD History</span>}
          </div>

          <div 
            onClick={() => { setShowProfile(true); setActiveTab(""); }}
            className={`flex items-center p-2 rounded-md ${showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <User className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Profile</span>}
          </div>

          <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
            <HelpCircle className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Help</span>}
          </a>
        </nav>
      </div>

      <div className="border-t border-gray-200">
        <div className="flex items-center justify-between p-2">
          {!isCollapsed && currentUser && (
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
                <div className="text-sm font-medium text-gray-700">{currentUser.name}</div>
                <div 
                  className="text-xs text-gray-500 truncate"
                  data-tooltip-id="email-tooltip"
                  data-tooltip-content={currentUser.email || "user@example.com"}
                >
                  {currentUser.email || "user@example.com"}
                </div>
                <Tooltip id="email-tooltip" />
              </div>
            </div>
          )}
          <div className="flex items-center cursor-pointer" onClick={() => {
            localStorage.clear();
            navigate("/");
          }}>
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
        </div>
      </div>
    </aside>
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-black text-white p-4 flex items-center justify-between w-full shadow-md">
        <img src="/assets/ODCSE Logo.png" alt="Logo" className="h-10 w-auto filter brightness-0 invert" />
        <h1 className="text-lg font-semibold">Student Dashboard</h1>
      </div>

      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          {showProfile ? (
            <ProfileSection />
          ) : activeTab === "events" ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6">Upcoming Events</h2>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming events</p>
              </div>
            </div>
          ) : activeTab === "odRequest" ? (
            <ODRequestForm />
          ) : activeTab === "odHistory" ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6">OD History</h2>
              {odHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left">Event Name</th>
                        <th className="p-3 text-left">Dates</th>
                        <th className="p-3 text-left">Days</th>
                        <th className="p-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {odHistory.map((od, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3">{od.eventName}</td>
                          <td className="p-3">
                            {new Date(od.fromDate).toLocaleDateString()} - {new Date(od.toDate).toLocaleDateString()}
                          </td>
                          <td className="p-3">{od.numberOfDays}</td>
                          <td className="p-3">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              od.status === "Approved" ? "bg-green-100 text-green-800" :
                              od.status === "Rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {od.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No OD requests found</p>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default UserDashBoard;