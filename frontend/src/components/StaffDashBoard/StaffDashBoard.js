import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  FilePlus,
  History,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Download,
  Info,
  Trash2,
  Users,
  Mail, Check, X,
  FileText, // Add this if needed
  Clock, // Add this if needed
  Upload
} from "lucide-react";
import { Tooltip } from 'react-tooltip';


const StaffDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [odHistory, setOdHistory] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentsList, setStudentsList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isViewingEvent, setIsViewingEvent] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: "",
    venue: ""
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };



  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    venue: "",
    date: "",
    registrationStart: "",
    registrationEnd: "",
    file: null,
    fileName: "",
    currentImage: ""
  });

  // Add this component to your main dashboard
  const ODRequestsComponent = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewingDetails, setIsViewingDetails] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState({});
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Add this line

    // Fetch attendance data from Google Sheets
    const fetchAttendanceData = async () => {
      try {
        setIsLoadingAttendance(true);
        const response = await axios.get(
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vSEkkY3vo7pKVyQPZjKq7_OXPEG9QMbxhZyk9J-f_b--buyQRR4AU4f8Ltq9IBQv2eMDamEJy3jMc2O/pub?output=csv"
        );

        const rows = response.data.split('\n').filter(row => row.trim() !== '');
        if (rows.length < 2) return {};

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const regNoIndex = headers.findIndex(h => h.includes('register') || h.includes('regno'));
        const attendanceIndex = headers.findIndex(h => h.includes('att') || h.includes('attendance'));

        if (regNoIndex === -1 || attendanceIndex === -1) {
          console.error("Required columns not found");
          return {};
        }

        const attendanceMap = {};
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(',');
          if (columns.length > Math.max(regNoIndex, attendanceIndex)) {
            const regNo = columns[regNoIndex].trim();
            let attendance = columns[attendanceIndex].trim();
            attendance = attendance.replace('%', '').trim();
            if (regNo && attendance && !isNaN(attendance)) {
              attendanceMap[regNo] = attendance;
            }
          }
        }

        return attendanceMap;
      } catch (error) {
        console.error("Error fetching attendance:", error);
        return {};
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    // Fetch pending OD requests for this tutor
    const fetchPendingRequests = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/auth/od/tutor-requests",
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
          }
        );

        // Filter for pending requests only
        const pending = response.data.requests.filter(
          request => request.status === "pending"
        );

        setPendingRequests(pending);
      } catch (error) {
        console.error("Error fetching OD requests:", error);
        setPendingRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Load attendance data when component mounts
    useEffect(() => {
      const loadData = async () => {
        const data = await fetchAttendanceData();
        setAttendanceData(data);
      };
      loadData();
      fetchPendingRequests();
    }, []);

    // Format date helper function
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Handle approve/reject action
    // In the ODRequestsComponent, update the handleRequestAction function:
    const handleRequestAction = async (requestId, action, comments = "") => {
      try {
        setIsProcessing(true);
        setPopupMessage(`Processing ${action} request...`);
        setIsSuccess(false);
        setShowPopup(true);
    
        // Add a timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
        const response = await axios.put(
          `http://localhost:5000/api/auth/od/request/${requestId}/status`,
          { status: action, comments },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
          }
        );

    
        clearTimeout(timeoutId);
    
        if (response.data.success) {
          setPopupMessage(`Request ${action} successfully!`);
          setIsSuccess(true);
          fetchPendingRequests();
          setIsViewingDetails(false);
        } else {
          setPopupMessage(response.data.message || `Failed to ${action} request`);
          setIsSuccess(false);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error ${action}ing request:`, error);
        
        let errorMessage = `Failed to ${action} request: `;
        if (error.response) {
          // Server responded with a status code outside 2xx
          errorMessage += error.response.data.message || error.response.statusText;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage += "No response from server";
        } else if (error.name === 'AbortError') {
          errorMessage = "Request timed out";
        } else {
          // Something happened in setting up the request
          errorMessage += error.message;
        }
    
        setPopupMessage(errorMessage);
        setIsSuccess(false);
      } finally {
        setIsProcessing(false);
      }
    };

    useEffect(() => {
      // Reset popup after 3 seconds if not processing
      if (showPopup && !isProcessing) {
        const timer = setTimeout(() => {
          setShowPopup(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [showPopup, isProcessing]);

    // Render attendance cell with color coding
    const renderAttendanceCell = (registerNumber) => {
      if (isLoadingAttendance) return "Loading...";
      const attendance = attendanceData[registerNumber] || "N/A";
      const attendanceValue = parseFloat(attendance) || 0;
      let textColor = "text-gray-900";

      if (attendanceValue < 75) {
        textColor = "text-red-600 font-semibold";
      } else if (attendanceValue < 85) {
        textColor = "text-yellow-600";
      } else {
        textColor = "text-green-600";
      }

      return (
        <span className={`${textColor}`}>
          {attendance}%
        </span>
      );
    };

    // Detailed view of a single request
    const RequestDetailsView = ({ request, onBack }) => {
      const [comments, setComments] = useState("");
      const [showCommentsField, setShowCommentsField] = useState(false);

      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Requests
          </button>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {request.eventName}
                </h2>
                <p className="text-gray-600">
                  {formatDate(request.fromDate)} -{" "}
                  {formatDate(request.toDate)}
                </p>
              </div>
              <div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Request Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Request ID</p>
                        <p className="font-medium">
                          {request.requestId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted On</p>
                        <p className="font-medium">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Venue</p>
                        <p className="font-medium">{request.venue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Number of Days</p>
                        <p className="font-medium">
                          {request.numberOfDays}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Requester Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">
                          {request.requester.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Register No.</p>
                        <p className="font-medium">
                          {request.requester.registerNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Semester</p>
                        <p className="font-medium">
                          {request.requester.semester}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Attendance</p>
                        <p className="font-medium">
                          {renderAttendanceCell(request.requester.registerNumber)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Participants
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Register No.
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {request.participants.map((participant, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {participant.registerNumber}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {participant.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {renderAttendanceCell(participant.registerNumber)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {request.supportingDocuments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Supporting Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {request.supportingDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-2" />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {doc.name}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Approval Actions
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    if (showCommentsField && comments) {
                      handleRequestAction(request._id, "rejected", comments);
                    } else if (!showCommentsField) {
                      setShowCommentsField(true);
                    } else {
                      setPopupMessage("Please enter comments for rejection");
                      setIsSuccess(false);
                      setShowPopup(true);
                    }
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X className="w-5 h-5 mr-2" />
                  {showCommentsField ? "Confirm Reject" : "Reject Request"}
                </button>

                {showCommentsField && (
                  <div className="flex-1">
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter reason for rejection"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows="2"
                    />
                  </div>
                )}

                <button
                  onClick={() => handleRequestAction(request._id, "approved")}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (isViewingDetails && selectedRequest) {
      return (
        <RequestDetailsView
          request={selectedRequest}
          onBack={() => setIsViewingDetails(false)}
        />
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Pending OD Requests</h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Request ID</th>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Event</th>
                  <th className="p-3 text-left">Dates</th>
                  <th className="p-3 text-left">Days</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">{request.requestId}</td>
                    <td className="p-3">
                      {request.requester.name}
                    </td>
                    <td className="p-3">{request.eventName}</td>
                    <td className="p-3">
                      {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                    </td>
                    <td className="p-3">{request.numberOfDays}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsViewingDetails(true);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No pending OD requests</p>
          </div>
        )}
      </div>
    );
  };

  // Fetch current staff data from backend
  const fetchCurrentStaff = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/staff", {
        params: { email: localStorage.getItem("userEmail") },
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setCurrentStaff(response.data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
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

  // Fetch students list
  const fetchStudentsList = async () => {
    try {
      const tutorName = localStorage.getItem("userName"); // Get logged-in tutor's name
      const encodedTutorName = encodeURIComponent(tutorName); // Encode for URL

      const response = await axios.get(
        `http://localhost:5000/api/auth/students-by-tutor?tutorName=${encodedTutorName}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        }
      );

      if (response.data.success) {
        setStudentsList(response.data.students);
      } else {
        console.error("No students found for this tutor");
        setStudentsList([]);
      }
    } catch (error) {
      console.error("Error fetching students list:", error);
      setStudentsList([]);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsViewingEvent(true);
  };

  const handleBackToEvents = () => {
    setIsViewingEvent(false);
    setSelectedEvent(null);
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("authToken");
      console.log("Fetching events with token:", token); // Debug token

      const response = await axios.get("http://localhost:5000/api/auth/get-events", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Backend response:", response.data); // Debug response

      // Use this simple transformation
      const eventsData = response.data.events || response.data || [];
      console.log("Events data to set:", eventsData); // Debug before setting

      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      console.error("Error details:", error.response?.data); // More error details
      setEvents([]);
    }
  };

  // Approve/Reject OD request
  const handleOdAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/od/${id}`, { action }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      alert(`OD request ${action}d successfully!`);
      fetchOdHistory();
    } catch (error) {
      console.error(`Error ${action}ing OD request:`, error);
      alert(`Failed to ${action} OD request`);
    }
  };

  // Initialize component
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/");
    }
    fetchCurrentStaff();
    fetchOdHistory();
    fetchStudentsList();
    fetchEvents(); // Call the proper fetchEvents function
  }, [navigate]);

  // Profile Section Component
  const ProfileSection = () => (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Staff Profile</h2>
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
          {currentStaff?.name?.charAt(0) || "S"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
          <ProfileDetail label="Full Name" value={currentStaff?.name} icon={<span className="text-blue-500">👤</span>} />
          <ProfileDetail label="Email" value={currentStaff?.email} icon={<span className="text-blue-500">@</span>} />
          <ProfileDetail label="Staff ID" value={currentStaff?.staffId} icon={<span className="text-blue-500">#</span>} />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">Professional Details</h3>
          <ProfileDetail label="Department" value={currentStaff?.department || "Computer Science"} icon={<span className="text-blue-500">🏛️</span>} />
          <ProfileDetail label="Role" value={currentStaff?.role || "Staff"} icon={<span className="text-blue-500">👔</span>} />
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
  // Then update the Popup component to handle processing state:
  const Popup = ({ message, isSuccess, onClose, isProcessing }) => {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: isSuccess ? '#4CAF50' : isProcessing ? '#2196F3' : '#f44336',
        color: 'white',
        padding: '20px',
        borderRadius: '5px',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        textAlign: 'center',
        minWidth: '300px'
      }}>
        {isProcessing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              animation: 'spin 1s linear infinite',
              marginRight: '10px'
            }}></div>
            <span>{message}</span>
          </div>
        ) : (
          <>
            <p>{message}</p>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'white',
                color: isSuccess ? '#4CAF50' : '#f44336',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              OK
            </button>
          </>
        )}
      </div>
    );
  };


  const handleEditEvent = (event) => {
    setEditingEventId(event._id);
    setEditFormData({
      name: event.name,
      description: event.description,
      venue: event.venue,
      date: event.date.split('T')[0],
      registrationStart: event.registrationStart?.split('T')[0] || "",
      registrationEnd: event.registrationEnd?.split('T')[0] || "",
      file: null,
      fileName: "",
      currentImage: event.filePath
    });
  };
  // Events Component
  // Events Component
  const EventsComponent = () => {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Upcoming Events</h1>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                onClick={() => handleEventClick(event)}
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={event.filePath || "https://via.placeholder.com/300"}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {event.name || "Untitled Event"}
                  </h2>

                  <div className="flex items-start text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 mr-2" />
                    <span className="break-words">
                      {event.venue || "Venue not specified"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No events found</p>
          </div>
        )}
      </div>
    );
  };

  // EventDetails Component
  const EventDetails = ({
    event,
    onBack,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    handleDeleteEvent,
    navigate
  }) => {
    if (!event) return null;

    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Events
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-64 md:h-96 overflow-hidden">
            <img
              src={event.filePath || "https://via.placeholder.com/800x400"}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Registration Start Date</p>
                    <p>{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p>{event.venue}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {event.registrationStart && event.registrationEnd && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-2" />
                    <div>
                      <p className="font-medium">Registration Period</p>
                      <p>
                        {formatDate(event.registrationStart)} - {' '}
                        {formatDate(event.registrationEnd)}
                      </p>
                    </div>
                  </div>
                )}
                {event.registrationEnd && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-2" />
                    <div>
                      <p className="font-medium">Registration End Date</p>
                      <p>{formatDate(event.registrationEnd)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Info className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Registration Status</p>
                    <p className="text-green-600 font-medium">Open</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
            </div>
          </div>
        </div>

        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteEvent(event._id);
                    setShowDeleteConfirmation(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setIsProcessing(true); // Add this line
      setPopupMessage("Deleting event...");
      setShowPopup(true);

      const response = await axios.delete(`http://localhost:5000/api/auth/remove-events/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });

      if (response.data.success) {
        setPopupMessage(`Event "${response.data.deletedEvent.name}" deleted successfully!`);
        setIsSuccess(true);
        fetchEvents(); // Refresh events list
        setIsViewingEvent(false); // Close details view
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete event";
      setPopupMessage(errorMsg);
      setIsSuccess(false);
    } finally {
      setIsProcessing(false); // Add this line
    }
  };

  // EditEvent Component
  const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [eventForm, setEventForm] = useState({
      name: "",
      description: "",
      venue: "",
      date: "",
      registrationStart: "",
      registrationEnd: "",
      file: null,
      fileName: "",
      currentImage: ""
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
      const fetchEventData = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/auth/edit-events/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
          });

          const eventData = response.data;
          setEventForm({
            name: eventData.name,
            description: eventData.description,
            venue: eventData.venue,
            date: eventData.date.split('T')[0],
            registrationStart: eventData.registrationStart?.split('T')[0] || "",
            registrationEnd: eventData.registrationEnd?.split('T')[0] || "",
            file: null,
            fileName: "",
            currentImage: eventData.filePath
          });
        } catch (error) {
          console.error("Error fetching event data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventData();
    }, [id]);

    const handleInputChange = (field, value) => {
      setEventForm(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, JPEG, PNG, and PDF files are allowed');
        return;
      }

      setEventForm(prev => ({
        ...prev,
        file,
        fileName: file.name
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!eventForm.file || !eventForm.name || !eventForm.description ||
        !eventForm.venue || !eventForm.registrationStart || !eventForm.registrationEnd) {
        setPopupMessage('Please fill all fields and upload a file');
        setIsSuccess(false);
        setShowPopup(true);
        return;
      }

      setIsUploading(true);
      setIsProcessing(true); // Add this line
      setPopupMessage("Uploading event...");
      setShowPopup(true);

      try {
        const formData = new FormData();
        formData.append('name', eventForm.name);
        formData.append('description', eventForm.description);
        formData.append('venue', eventForm.venue);
        formData.append('registrationStart', eventForm.registrationStart);
        formData.append('registrationEnd', eventForm.registrationEnd);
        formData.append('file', eventForm.file);

        const response = await axios.post(
          "http://localhost:5000/api/auth/add-events",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          setPopupMessage(response.data.message || "Event uploaded successfully!");
          setIsSuccess(true);

          // Reset form
          setEventForm({
            name: "",
            description: "",
            venue: "",
            registrationStart: "",
            registrationEnd: "",
            file: null,
            fileName: ""
          });
          setAfter7Days(false);
        } else {
          setPopupMessage(response.data.message || "Event upload failed");
          setIsSuccess(false);
        }
      } catch (error) {
        console.error("Error uploading event:", error);
        const errorMessage = error.response?.data?.message ||
          error.message ||
          "Failed to upload event";
        setPopupMessage(errorMessage);
        setIsSuccess(false);
      } finally {
        setIsUploading(false);
        setIsProcessing(false); // Add this line
      }
    };

    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Event</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Event Name *</label>
              <input
                type="text"
                value={eventForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Venue *</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event venue"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Event Date *</label>
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Update Image (Optional)</label>
              <div className="flex items-center">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300">
                  {eventForm.fileName ? "Change File" : "Choose File"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                </label>
                {eventForm.fileName && (
                  <span className="ml-3 text-sm text-gray-600">
                    {eventForm.fileName}
                  </span>
                )}
              </div>
              {eventForm.currentImage && !eventForm.fileName && (
                <p className="mt-2 text-sm text-gray-500">Current image will be kept</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Registration Start Date</label>
              <input
                type="date"
                value={eventForm.registrationStart}
                onChange={(e) => handleInputChange('registrationStart', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Registration End Date</label>
              <input
                type="date"
                value={eventForm.registrationEnd}
                onChange={(e) => handleInputChange('registrationEnd', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min={eventForm.registrationStart}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Event Description *</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows="4"
              placeholder="Enter event description"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate(`/staff-dashboard/events/${id}`)}
              className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !eventForm.name || !eventForm.description ||
                !eventForm.venue || !eventForm.date}
              className={`px-8 py-3 rounded-lg text-white font-medium ${!isUploading && eventForm.name && eventForm.description &&
                eventForm.venue && eventForm.date
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-400 cursor-not-allowed'
                } transition-colors`}
            >
              {isUploading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Upload Events Component
  const UploadEventsComponent = ({ fetchEvents }) => {
    const [eventForm, setEventForm] = useState({
      name: "",
      description: "",
      venue: "", // Added venue field
      registrationStart: "",
      registrationEnd: "",
      file: null,
      fileName: ""
    });
    const [after7Days, setAfter7Days] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleInputChange = (field, value) => {
      setEventForm(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, JPEG, PNG, and PDF files are allowed');
        return;
      }

      setEventForm(prev => ({
        ...prev,
        file,
        fileName: file.name
      }));
    };

    const handleAfter7DaysChange = (e) => {
      const isChecked = e.target.checked;
      setAfter7Days(isChecked);

      if (isChecked && eventForm.registrationStart) {
        const startDate = new Date(eventForm.registrationStart);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);

        const formattedEndDate = endDate.toISOString().split('T')[0];
        handleInputChange('registrationEnd', formattedEndDate);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validate form fields
      if (!eventForm.file || !eventForm.name || !eventForm.description ||
        !eventForm.venue || !eventForm.registrationStart || !eventForm.registrationEnd) {
        setPopupMessage('Please fill all fields and upload a file');
        setIsSuccess(false);
        setShowPopup(true);
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('name', eventForm.name);
        formData.append('description', eventForm.description);
        formData.append('venue', eventForm.venue); // Added venue to form data
        formData.append('registrationStart', eventForm.registrationStart);
        formData.append('registrationEnd', eventForm.registrationEnd);
        formData.append('file', eventForm.file);

        const response = await axios.post(
          "http://localhost:5000/api/auth/add-events",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          setPopupMessage(response.data.message || "Event uploaded successfully!");
          setIsSuccess(true);
          setShowPopup(true);

          // Reset form
          setEventForm({
            name: "",
            description: "",
            venue: "",
            registrationStart: "",
            registrationEnd: "",
            file: null,
            fileName: ""
          });
          setAfter7Days(false);
        } else {
          setPopupMessage(response.data.message || "Event upload failed");
          setIsSuccess(false);
          setShowPopup(true);
        }
      } catch (error) {
        console.error("Error uploading event:", error);
        const errorMessage = error.response?.data?.message ||
          error.message ||
          "Failed to upload event";
        setPopupMessage(errorMessage);
        setIsSuccess(false);
        setShowPopup(true);
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload New Event</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Event Name *</label>
              <input
                type="text"
                value={eventForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Venue *</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event venue"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Upload File (JPG, PNG) *</label>
              <div className="flex items-center">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300">
                  {eventForm.fileName ? "Change File" : "Choose File"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                  />
                </label>
                {eventForm.fileName && (
                  <span className="ml-3 text-sm text-gray-600">
                    {eventForm.fileName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Registration Start Date *</label>
              <input
                type="date"
                value={eventForm.registrationStart}
                onChange={(e) => {
                  handleInputChange('registrationStart', e.target.value);
                  if (after7Days) {
                    const startDate = new Date(e.target.value);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 7);
                    handleInputChange('registrationEnd', endDate.toISOString().split('T')[0]);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Registration End Date *</label>
              <input
                type="date"
                value={eventForm.registrationEnd}
                onChange={(e) => handleInputChange('registrationEnd', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                min={eventForm.registrationStart}
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="after7Days"
                  checked={after7Days}
                  onChange={handleAfter7DaysChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="after7Days" className="ml-2 block text-sm text-gray-700">
                  Set end date 7 days after start date
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Event Description *</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows="4"
              placeholder="Enter event description"
              required
            />
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isUploading || !eventForm.name || !eventForm.description ||
                !eventForm.venue || !eventForm.registrationStart ||
                !eventForm.registrationEnd || !eventForm.file}
              className={`px-8 py-3 rounded-lg text-white font-medium ${!isUploading && eventForm.name && eventForm.description &&
                eventForm.venue && eventForm.registrationStart &&
                eventForm.registrationEnd && eventForm.file
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-400 cursor-not-allowed'
                } transition-colors`}
            >
              {isUploading ? 'Uploading...' : 'Upload Event'}
            </button>
          </div>
        </form>
        {/* Add this for the popup */}
        {showPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}>
            <Popup
              message={popupMessage}
              isSuccess={isSuccess}
              isProcessing={isProcessing}
              onClose={() => setShowPopup(false)}
            />
          </div>
        )}
      </div>
    );
  };
  // History Component
  const HistoryComponent = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">OD Requests History</h2>
      {odHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Event</th>
                <th className="p-3 text-left">Dates</th>
                <th className="p-3 text-left">Days</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {odHistory.map((od, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{od.studentName}</td>
                  <td className="p-3">{od.eventName}</td>
                  <td className="p-3">
                    {new Date(od.fromDate).toLocaleDateString()} - {new Date(od.toDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">{od.numberOfDays}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${od.status === "Approved" ? "bg-green-100 text-green-800" :
                      od.status === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                      {od.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {od.status === "Pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOdAction(od._id, "approve")}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOdAction(od._id, "reject")}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
  );

  // Students List Component
  const StudentsListComponent = () => {
    const tutorName = localStorage.getItem("userName");

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Students List</h2>
            <p className="text-sm text-gray-500">Tutor: {tutorName}</p>
          </div>
        </div>

        {studentsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Reg No.</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Semester</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((student) => (
                  <tr key={student._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">{student.registerNumber}</td>
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">Semester {student.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No students assigned to you</p>
          </div>
        )}
      </div>
    );
  };

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
            onClick={() => {
              setActiveTab("events");
              setShowProfile(false);
              fetchEvents(); // Fetch events when clicking the tab
            }}
            className={`flex items-center p-2 rounded-md ${activeTab === "events" && !showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <Calendar className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Events</span>}
          </div>
          <div
            onClick={() => { setActiveTab("uploadEvents"); setShowProfile(false); }}
            className={`flex items-center p-2 rounded-md ${activeTab === "uploadEvents" && !showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <Upload className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Upload Events</span>}
          </div>

          <div
            onClick={() => { setActiveTab("odRequests"); setShowProfile(false); }}
            className={`flex items-center p-2 rounded-md ${activeTab === "odRequests" && !showProfile ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <Mail className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">OD Requests</span>}
          </div>

          <div
            onClick={() => {
              setActiveTab("studentsList");
              setShowProfile(false);
              fetchStudentsList(); // Fetch students when clicking the tab
            }}
            className={`flex items-center p-2 rounded-md ${activeTab === "studentsList" && !showProfile ? "bg-gray-100" : ""
              } text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
          >
            <Users className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Students List</span>}
          </div>

          <a href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
            <HelpCircle className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Help</span>}
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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
                  }}
                  alt="User Avatar"
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <div
                  className="text-sm font-medium text-gray-700"
                  data-tooltip-id="name-tooltip"
                  data-tooltip-content={localStorage.getItem("userName") || "Staff Member"}
                >
                  {localStorage.getItem("userName") || "Staff Member"}
                </div>
                <div
                  className="text-xs text-gray-500 truncate"
                  data-tooltip-id="email-tooltip"
                  data-tooltip-content={localStorage.getItem("userEmail") || "staff@example.com"}
                >
                  {localStorage.getItem("userEmail") || "staff@example.com"}
                </div>
                <Tooltip id="name-tooltip" />
                <Tooltip id="email-tooltip" />
              </div>
            </div>
          )}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
          >
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
        <h1 className="text-lg font-semibold">Staff Dashboard</h1>
      </div>

      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          {showProfile ? (
            <ProfileSection />
          ) : isViewingEvent ? (
            <EventDetails
              event={selectedEvent}
              onBack={handleBackToEvents}
              showDeleteConfirmation={showDeleteConfirmation}
              setShowDeleteConfirmation={setShowDeleteConfirmation}
              handleDeleteEvent={handleDeleteEvent}
              navigate={navigate}
            />
          ) : activeTab === "events" ? (
            <EventsComponent />
          ) : activeTab === "uploadEvents" ? (
            <UploadEventsComponent />
          ) : activeTab === "odRequests" ? (
            <ODRequestsComponent />
          ) : activeTab === "studentsList" ? (
            <StudentsListComponent />
          ) : null}

          {showPopup && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}>
              <Popup
                message={popupMessage}
                isSuccess={isSuccess}
                onClose={() => setShowPopup(false)}
              />
            </div>
          )}
        </main>

      </div>
    </div>

  );
};

export default StaffDashboard;

