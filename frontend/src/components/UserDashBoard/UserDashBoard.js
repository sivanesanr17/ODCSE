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
  Download,
  Search,
  MapPin,
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
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isViewingEvent, setIsViewingEvent] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showRegisterNumberPopup, setShowRegisterNumberPopup] = useState(false);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showInvitationSent, setShowInvitationSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [students, setStudents] = useState([{
    registerNumber: currentUser?.registerNumber || '',
    name: currentUser?.name || '',
    semester: currentUser?.semester || '',
    section: currentUser?.section || '',
    attendancePercentage: currentUser?.attendancePercentage || '',
    isRequester: true // This should properly identify the main student
  }]);

  const removeStudent = (index) => {
    const newStudents = [...students];
    newStudents.splice(index, 1);
    setStudents(newStudents);
  };
  
  // Submit OD form
const handleSubmit = async () => {
  try {
    setIsProcessing(true);
    setPopupMessage("Submitting OD request...");
    setShowPopup(true);

    const response = await axios.post(
      "http://localhost:5000/api/od/submit",
      {
        eventName,
        fromDate,
        toDate,
        numberOfDays,
        tutorName,
        students,
      },
      {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      setPopupMessage("OD submitted successfully!");
      setIsSuccess(true);
      
      // Clear form after successful submission
      setEventName("");
      setFromDate("");
      setToDate("");
      setNumberOfDays(0);
      setStudents([{
        registerNumber: currentUser?.registerNumber || '',
        name: currentUser?.name || '',
        semester: currentUser?.semester || '',
        section: currentUser?.section || '',
        attendancePercentage: currentUser?.attendancePercentage || '',
        isRequester: true
      }]);
      setPendingStudents([]);
      
      fetchOdHistory();
      setActiveTab("odHistory");
    } else {
      setPopupMessage(response.data.message || "Failed to submit OD");
      setIsSuccess(false);
    }
  } catch (error) {
    console.error("Error submitting OD:", error);
    setPopupMessage(error.response?.data?.message || "Failed to submit OD");
    setIsSuccess(false);
  } finally {
    setIsProcessing(false);
  }
};

  // Fetch current user data from backend
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const userEmail = localStorage.getItem("userEmail");
      
      if (!userEmail) {
        navigate("/");
        return;
      }
  
      const response = await axios.get("http://localhost:5000/api/auth/current-user", {
        params: { email: userEmail },
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      
      if (!response.data) {
        throw new Error("No user data received");
      }
  
      setCurrentUser(response.data);
      // Set initial student data with isRequester: true
      setStudents([{
        registerNumber: response.data.registerNumber,
        name: response.data.name,
        semester: response.data.semester,
        section: response.data.section,
        attendancePercentage: response.data.attendancePercentage,
        isRequester: true // Make sure this is set
      }]);
      setTutorName(response.data.tutorName || "");
    } catch (error) {
      console.error("Error fetching current user:", error);
      if (error.response?.status === 404) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  

  const Popup = ({ message, isSuccess, onClose }) => {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: isSuccess ? '#4CAF50' : '#f44336',
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

  const RegisterNumberPopup = ({ onClose, onSubmit }) => {
    const [registerNumber, setRegisterNumber] = useState("");
  
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        width: '300px'
      }}>
        <h3 className="text-lg font-semibold mb-4">Add Student</h3>
        <input
          type="text"
          value={registerNumber}
          onChange={(e) => setRegisterNumber(e.target.value)}
          placeholder="Enter register number"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(registerNumber)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Submit
          </button>
        </div>
      </div>
    );
  };

  const cancelInvitation = async (invitationId) => {
    try {
      setIsProcessing(true);
      setPopupMessage("Cancelling invitation...");
      setShowPopup(true);
  
      await axios.delete(
        `http://localhost:5000/api/auth/cancel-invitation/${invitationId}`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("authToken")}` 
          }
        }
      );
  
      // Remove from pending list by invitationId
      setPendingStudents(prev => 
        prev.filter(student => student.invitationId !== invitationId)
      );
  
      setPopupMessage("Invitation cancelled successfully");
      setIsSuccess(true);
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      setPopupMessage("Failed to cancel invitation");
      setIsSuccess(false);
    } finally {
      setIsProcessing(false);
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
      const response = await axios.get(
        `http://localhost:5000/api/auth/students/${registerNumber}`, 
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("authToken")}` 
          }
        }
      );
      
      if (response.data.success && response.data.data) {
        return {
          _id: response.data.data._id,
          email: response.data.data.email,
          name: response.data.data.name,
          semester: response.data.data.semester,
          section: response.data.data.section,
          attendancePercentage: response.data.data.attendancePercentage,
          tutorName: response.data.data.tutorName
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching student details:", error);
      return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsViewingEvent(true);
  };
  
  const handleBackToEvents = () => {
    setIsViewingEvent(false);
    setSelectedEvent(null);
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/get-events", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          'Content-Type': 'application/json'
        }
      });
      
      const eventsData = response.data.events || response.data || [];
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
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
// Modify the addStudentRow function to verify tutor match
const addStudentRow = async (registerNumber) => {
  if (!registerNumber) return;

  try {
    setIsProcessing(true);
    setPopupMessage("Verifying student and tutor...");
    setShowPopup(true);

    // Check if trying to add self
    if (registerNumber === currentUser.registerNumber) {
      setPopupMessage("You cannot add yourself as an invited student");
      setIsSuccess(false);
      setIsProcessing(false);
      return;
    }

    // Verify required fields
    if (!eventName || !fromDate || !toDate || !currentUser?.name || !currentUser?.email) {
      const missingFields = [];
      if (!eventName) missingFields.push('event name');
      if (!fromDate) missingFields.push('from date');
      if (!toDate) missingFields.push('to date');
      if (!currentUser?.name) missingFields.push('your name');
      if (!currentUser?.email) missingFields.push('your email');
      
      setPopupMessage(`Please fill in: ${missingFields.join(', ')} before adding students`);
      setIsSuccess(false);
      setIsProcessing(false);
      return;
    }

    // Get student details
    const studentDetails = await fetchStudentDetails(registerNumber);
    
    if (!studentDetails) {
      setPopupMessage("Student not found with this register number!");
      setIsSuccess(false);
      setIsProcessing(false);
      return;
    }

    // Verify tutor match
    if (studentDetails.tutorName && currentUser.tutorName) {
      const normalizedStudentTutor = studentDetails.tutorName.trim().toLowerCase();
      const normalizedCurrentTutor = currentUser.tutorName.trim().toLowerCase();
      
      if (normalizedStudentTutor !== normalizedCurrentTutor) {
        setPopupMessage("This student has a different tutor. You can only invite students with the same tutor.");
        setIsSuccess(false);
        setIsProcessing(false);
        return;
      }
    }

    // Check if already added
    if (students.some(s => s.registerNumber === registerNumber)) {
      setPopupMessage("Student already added to this request");
      setIsSuccess(false);
      setIsProcessing(false);
      return;
    }

    // Check if invitation is pending
    if (pendingStudents.some(s => s.registerNumber === registerNumber)) {
      setPopupMessage("Invitation already sent to this student");
      setIsSuccess(false);
      setIsProcessing(false);
      return;
    }

    // Format dates
    const formattedFromDate = new Date(fromDate).toISOString().split('T')[0];
    const formattedToDate = new Date(toDate).toISOString().split('T')[0];

    // Prepare invitation data
    const invitationData = {
      odRequestId: `od-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      registerNumber: registerNumber,
      recipientEmail: studentDetails.email,
      eventName: eventName,
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email
    };

    // Send invitation
    const response = await axios.post(
      "http://localhost:5000/api/auth/send-invitation",
      invitationData,
      {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const invitationId = response.data?._id || 
                       response.data?.invitation?._id || 
                       response.data?.invitationId;
    
    if (!invitationId) {
      throw new Error("No invitation ID received in response");
    }
    // Add to pending list
    setPendingStudents(prev => [
      ...prev,
      {
        registerNumber,
        name: studentDetails.name,
        semester: studentDetails.semester,
        section: studentDetails.section || '',
        attendancePercentage: studentDetails.attendancePercentage || '',
        status: "pending",
        invitationId: invitationId  // Use the safely extracted ID
      }
    ]);


    setPopupMessage(`Invitation sent successfully to ${studentDetails.name}`);
    setIsSuccess(true);
    
  } catch (error) {
    console.error('Full invitation error:', error);
    let errorMessage = 'Failed to send invitation';
    
    if (error.response) {
      if (error.response.data?.missingFields) {
        errorMessage += `. Missing fields: ${error.response.data.missingFields.join(', ')}`;
      } else if (error.response.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      }
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    setPopupMessage(errorMessage);
    setIsSuccess(false);
  } finally {
    setIsProcessing(false);
    setShowPopup(true);
    setShowRegisterNumberPopup(false);
  }
};

  // Function to check invitation status periodically
// Add this useEffect to check for invitation status updates
useEffect(() => {
  let isMounted = true;
  let intervalId;

  const checkInvitations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/check-invitations",
        { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
      );

      if (!isMounted || !response.data?.success) return;

      const invitations = response.data.invitations || [];
      
      // Process accepted invitations
      invitations.forEach(invitation => {
        if (invitation.status === 'accepted') {
          // Check if already in students list
          const isAlreadyAdded = students.some(
            s => s.registerNumber === invitation.registerNumber
          );
          
          if (!isAlreadyAdded) {
            // Add to students list
            setStudents(prev => [
              ...prev,
              {
                registerNumber: invitation.registerNumber,
                name: invitation.name || '',
                semester: invitation.semester || '',
                section: invitation.section || '',
                attendancePercentage: invitation.attendancePercentage || '',
                isRequester: false,
                invitationId: invitation._id
              }
            ]);
            
            // Remove from pending list
            setPendingStudents(prev => 
              prev.filter(student => student.registerNumber !== invitation.registerNumber)
            );
          }
        }
      });

      // Update pending students status
      setPendingStudents(prev => 
        prev.map(pending => {
          const invitation = invitations.find(i => 
            i.registerNumber === pending.registerNumber
          );
          return invitation ? { ...pending, status: invitation.status } : pending;
        })
      );
    } catch (error) {
      console.error("Error checking invitations:", error);
    }
  };

  // Initial check
  checkInvitations();
  
  // Set up interval to check every 30 seconds
  intervalId = setInterval(checkInvitations, 30000);

  return () => {
    isMounted = false;
    clearInterval(intervalId);
  };
}, [students]);

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
                
                {/* <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0 mr-2" />
                  <span>{formatDate(event.date)}</span>
                </div> */}
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
const EventDetails = ({ event, onBack }) => {
  if (!event) return null;

  const handleApplyOD = () => {
    // Format dates properly for the form inputs
    const formattedFromDate = event.date.split('T')[0];
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 1);
    const formattedToDate = endDate.toISOString().split('T')[0];
  
    // Update all relevant states
    setEventName(event.name);
    setFromDate(formattedFromDate);
    setToDate(formattedToDate);
    setActiveTab("odRequest");
    setIsViewingEvent(false);
  };

  const handleDownloadBrochure = async () => {
    if (event.filePath) {
      try {
        // Fetch the file from the server
        const response = await fetch(event.filePath);
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get file extension from the original filename
        const fileExtension = event.filePath.split('.').pop().toLowerCase();
        
        // Create a clean filename using the event name
        const cleanEventName = event.name
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .toLowerCase();
        
        // Set the download filename with event name and original extension
        link.setAttribute('download', `${cleanEventName}_brochure.${fileExtension}`);
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download brochure');
      }
    } else {
      alert("No brochure available for this event");
    }
  };
  
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
          {/* Updated header section with buttons on the right */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadBrochure}
                className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Brochure
              </button>
              
              <button
                onClick={handleApplyOD}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <FilePlus className="w-4 h-4 mr-2" />
                Apply for OD
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <div>
                  <p className="font-medium">Event Date</p>
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
            
            {event.registrationStart && event.registrationEnd && (
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Registration Period</p>
                    <p>
                      {formatDate(event.registrationStart)} - {' '}
                      {formatDate(event.registrationEnd)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
          </div>
        </div>
      </div>
    </div>
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
    fetchEvents(); // Add this line
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

  const ODRequestForm = () => {
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
  
    // Search students in backend
    const searchStudents = async () => {
      try {
        if (searchInput.length < 3) {
          setPopupMessage("Please enter at least 3 characters to search");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }
    
        const response = await axios.get(
          "http://localhost:5000/api/auth/search-students",
          {
            params: { query: searchInput },
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              'Content-Type': 'application/json'
            }
          }
        );
    
        if (response.data?.success) {
          setSearchResults(response.data.students || []);
        } else {
          setSearchResults([]);
          setPopupMessage("No students found");
          setIsSuccess(false);
          setShowPopup(true);
        }
      } catch (error) {
        console.error("Error searching students:", error);
        setSearchResults([]);
        setPopupMessage("Error searching students");
        setIsSuccess(false);
        setShowPopup(true);
      }
    };
  
    // Select student from search results
    const selectStudent = async (student) => {
      try {
        // Check if trying to invite self
        if (student.registerNumber === currentUser.registerNumber) {
          setPopupMessage("You cannot send an invitation to yourself");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }
    
        // Check if already in students list
        const isAlreadyAdded = students.some(
          s => s.registerNumber === student.registerNumber
        );
        
        if (isAlreadyAdded) {
          setPopupMessage("Student already added to this request");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }
    
        // Check if already in pending list
        const isAlreadyPending = pendingStudents.some(
          s => s.registerNumber === student.registerNumber
        );
        
        if (isAlreadyPending) {
          setPopupMessage("Invitation already sent to this student");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }
    
        // 1. Immediately show "Sending..." popup
        setIsProcessing(true);
        setPopupMessage("Sending invitation...");
        setShowPopup(true);
        
        // 2. Prepare and send invitation
        const invitationData = {
          odRequestId: `od-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          registerNumber: student.registerNumber,
          recipientEmail: student.email,
          eventName: eventName,
          fromDate: new Date(fromDate).toISOString().split('T')[0],
          toDate: new Date(toDate).toISOString().split('T')[0],
          requesterName: currentUser.name,
          requesterEmail: currentUser.email
        };
    
        const response = await axios.post(
          "http://localhost:5000/api/auth/send-invitation",
          invitationData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              'Content-Type': 'application/json'
            }
          }
        );
    
        const invitationId = response.data?.invitationId || response.data?._id;
    
        // 3. Add to pending list
        setPendingStudents(prev => [
          ...prev,
          {
            registerNumber: student.registerNumber,
            name: student.name,
            semester: student.semester,
            section: student.section || '',
            attendancePercentage: student.attendancePercentage || '',
            status: "pending",
            invitationId: invitationId
          }
        ]);
    
        // 4. Update popup to success
        setPopupMessage(`Invitation sent to ${student.name}`);
        setIsSuccess(true);
        
      } catch (error) {
        console.error("Error sending invitation:", error);
        setPopupMessage("Failed to send invitation");
        setIsSuccess(false);
      } finally {
        setIsProcessing(false);
      }
    };
  
    // Handle input changes
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      switch (name) {
        case "eventName":
          setEventName(value);
          break;
        case "fromDate":
          setFromDate(value);
          break;
        case "toDate":
          setToDate(value);
          break;
        default:
          break;
      }
    };
  
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        {/* Form header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Department of Computer Science</h1>
          <h2 className="text-xl font-semibold text-gray-600 mt-2">On Duty Request Form</h2>
        </div>
        
        <div className="space-y-8">
          {/* Event Name */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Event Name</label>
            <input
              type="text"
              name="eventName"
              value={eventName}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
  
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">From Date</label>
              <input
                type="date"
                name="fromDate"
                value={fromDate || ""}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">To Date</label>
              <input
                type="date"
                name="toDate"
                value={toDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                min={fromDate}
              />
            </div>
          </div>
  
          {/* Days and Tutor */}
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
  
          {/* Student Details Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Student Details</h3>
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchResults([]);
                  setShowSearchResults(true);
                }}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserRoundPlus className="w-5 h-5" />
                <span>Add Student</span>
              </button>
            </div>
  
            {showSearchResults && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center mb-4">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search by name or register number"
                />
                <button
                  onClick={searchStudents}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              
              {searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Register No.</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Semester</th>
                        <th className="p-2 text-left">Tutor</th>
                        <th className="p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                    {searchResults.map((student, index) => {
                    const isAlreadyAdded = students.some(s => s.registerNumber === student.registerNumber);
                    const isAlreadyPending = pendingStudents.some(s => s.registerNumber === student.registerNumber);
                    
                    return (
                      <tr 
                        key={index} 
                        className={`border-b border-gray-200 ${
                          isAlreadyAdded || isAlreadyPending ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-2">{student.registerNumber}</td>
                        <td className="p-2">{student.name}</td>
                        <td className="p-2">{student.semester}</td>
                        <td className="p-2">{student.tutorName}</td>
                        <td className="p-2">
                          <button
                            onClick={() => !isAlreadyAdded && !isAlreadyPending && selectStudent(student)}
                            className={`px-2 py-1 rounded ${
                              student.tutorName === currentUser.tutorName && 
                              student.registerNumber !== currentUser.registerNumber &&
                              !isAlreadyAdded &&
                              !isAlreadyPending
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                            }`}
                            disabled={
                              student.tutorName !== currentUser.tutorName || 
                              student.registerNumber === currentUser.registerNumber ||
                              isAlreadyAdded ||
                              isAlreadyPending
                            }
                          >
                            {student.tutorName === currentUser.tutorName 
                              ? student.registerNumber === currentUser.registerNumber
                                ? "Yourself"
                                : isAlreadyAdded
                                  ? "Added"
                                  : isAlreadyPending
                                    ? "Pending"
                                    : "Select" 
                              : "Different Tutor"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {searchInput ? "No students found" : "Enter search terms to find students"}
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
  
          {/* Current Students Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.registerNumber}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.name}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.semester}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.attendancePercentage}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Only show Remove button for invited students (not the requester) */}
                      {index > 0 && !student.isRequester && (
                        <button
                          onClick={() => {
                            // Remove from students list
                            setStudents(prev => prev.filter((_, i) => i !== index));
                            // If it was from an invitation, cancel that invitation
                            if (student.invitationId) {
                              cancelInvitation(student.invitationId);
                            }
                          }}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {pendingStudents.filter(s => s.status === 'pending').length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Pending Invitations</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingStudents.filter(s => s.status === 'pending').map((student, index) => (
                    <tr key={`pending-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.registerNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => cancelInvitation(student.invitationId)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </div>
  
          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`px-8 py-3 rounded-lg text-white font-medium ${
                isFormValid() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
              } transition-colors`}
            >
              Submit Request
            </button>
          </div>
        </div>
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
        <h1 className="text-lg font-semibold">Student Dashboard</h1>
      </div>

      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        {showProfile ? (
          <ProfileSection />
        ) : isViewingEvent ? (
          <EventDetails event={selectedEvent} onBack={handleBackToEvents} />
        ) : activeTab === "events" ? (
          <EventsComponent />
        ) : activeTab === "odRequest" ? (
              <ODRequestForm 
                addStudentRow={addStudentRow}
                showRegisterNumberPopup={showRegisterNumberPopup}
                setShowRegisterNumberPopup={setShowRegisterNumberPopup}
              />
        ) : activeTab === "odHistory" ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* ... your existing OD History code ... */}
          </div>
        ) : null}
      </main>
      </div>
      {showPopup && (
      <Popup 
        message={popupMessage} 
        isSuccess={isSuccess} 
        onClose={() => setShowPopup(false)}
      />
    )}
    </div>
  );
};

export default UserDashBoard;