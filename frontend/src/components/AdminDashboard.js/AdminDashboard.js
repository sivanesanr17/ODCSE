import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Users, HelpCircle, LogOut, ChevronLeft, ChevronRight, UserPlus, UserMinus, UserPen, UserRoundCog, GraduationCap,Save } from "lucide-react";
import { Tooltip } from 'react-tooltip';
import { Search, Trash2 } from "lucide-react"; // Add these to your existing imports


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [odRequests, setOdRequests] = useState([]);
  const [showAddOptions, setShowAddOptions] = useState(true);
  const [showRemoveOptions, setShowRemoveOptions] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToBeDeleted, setUserToBeDeleted] = useState(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showChangeTutor, setShowChangeTutor] = useState(false);
  const [fromRegister, setFromRegister] = useState('');
  const [toRegister, setToRegister] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState('');
  const [changeTutorStep, setChangeTutorStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    semester: '',
    tutorName: '',
    email: '',
    password: ''
  });
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    password: '',
    staffID: '',
    designation: ''
  });
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: '' // 'success' or 'error'
  });
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
        textAlign: 'center'
      }}>
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
      </div>
    );
  };

  const [selectedType, setSelectedType] = useState(null);

  const [editSelectedType, setEditSelectedType] = useState(null);
  const [editIdentifier, setEditIdentifier] = useState('');
  const [editUserData, setEditUserData] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    registerNumber: '',
    semester: '',
    tutorName: '',
    email: '',
    password: '',
    staffID: '',
    designation: '',
    removeSignature: false
  });

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/");
      return;
    }

    const fetchAllData = async () => {
      await fetchUsers();
      await fetchOdRequests();
      await fetchStaffList();
    };

    fetchAllData();
  }, [navigate]);

  const fetchStaffList = async () => {
    setLoadingStaff(true);
    setFetchError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/auth/staff-list', {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}` 
        }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data received");
      }
      
      setStaffList(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      setFetchError(error.response?.data?.error || error.message);
    } finally {
      setLoadingStaff(false);
    }
  };

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
    // Reset all other states
    setShowChangeTutor(false);
    setShowRemoveOptions(false);
    setShowStudentForm(false);
    setShowStaffForm(false);
    setSelectedType(null);
    setEditSelectedType(null);
    
    // Activate add options
    setShowAddOptions(true);
  };


  const handleStaffClick = () => {
    setShowStaffForm(true);
    setShowAddOptions(false);
    setShowRemoveOptions(false);
  };

  const handleEditClick = () => {
    // Reset all other states
    setShowChangeTutor(false); 
    setShowAddOptions(false);
    setShowRemoveOptions(false);
    setShowStudentForm(false);
    setShowStaffForm(false);
    setSelectedType(null);
    setUserToDelete(null);
    setIdentifier('');
    
    // Activate Edit mode
    setEditSelectedType('select');
    setEditIdentifier('');
    setEditUserData(null);
    setEditFormData({
      name: '',
      registerNumber: '',
      semester: '',
      tutorName: '',
      email: '',
      password: '',
      staffID: '',
      designation: ''
    });
  };
  

  const handleEditSearch = async (e) => {
    e.preventDefault();
    
    if (!editIdentifier.trim()) {
      setAlert({
        show: true,
        message: 'Please enter an identifier',
        type: 'error'
      });
      return;
    }
  
    try {
      const endpoint = editSelectedType === 'student' 
        ? `http://localhost:5000/api/auth/get-student/${editIdentifier}`
        : `http://localhost:5000/api/auth/get-staff/${editIdentifier}`;
  
      const response = await axios.get(endpoint, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}` 
        }
      });
  
      if (response.data.success) {
        const userData = response.data.data;
        setEditUserData(userData);
        
        // Set form data based on user type
        if (editSelectedType === 'student') {
          setEditFormData({
            name: userData.name,
            registerNumber: userData.registerNumber,
            semester: userData.semester,
            tutorName: userData.tutorName,
            email: userData.email,
            password: '', // Password is not retrieved for security
            staffID: '',
            designation: ''
          });
        } else {
          setEditFormData({
            name: userData.name,
            registerNumber: '',
            semester: '',
            tutorName: '',
            email: userData.email,
            password: '', // Password is not retrieved for security
            staffID: userData.staffID,
            designation: userData.designation
          });
        }
      } else {
        setAlert({
          show: true,
          message: response.data.message || 'User not found',
          type: 'error'
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'User not found in database',
        type: 'error'
      });
    }
  };
  
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditSave = async (e) => {
    e.preventDefault();
    
    // For staff edits, we'll need to use FormData if there's a signature file
    if (editSelectedType === 'staff' && (editFormData.signature || editFormData.removeSignature)) {
      const formData = new FormData();
      formData.append('name', editFormData.name);
      formData.append('email', editFormData.email);
      formData.append('staffID', editFormData.staffID);
      formData.append('designation', editFormData.designation);
      
      if (editFormData.password) {
        formData.append('password', editFormData.password);
      }
      
      if (editFormData.signature) {
        formData.append('signature', editFormData.signature);
      }
      
      if (editFormData.removeSignature) {
        formData.append('removeSignature', 'true');
      }
  
      // You'll need to update your API endpoint to handle multipart form data
      // for staff updates with signatures
      setShowSaveConfirmation(true);
      return;
    }
    
    // Original save logic for non-file updates
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmation(false);
    
    try {
      const endpoint = editSelectedType === 'student' 
        ? `http://localhost:5000/api/auth/update-student/${editUserData._id}`
        : `http://localhost:5000/api/auth/update-staff/${editUserData._id}`;
  
      const payload = editSelectedType === 'student' ? {
        name: editFormData.name,
        registerNumber: editFormData.registerNumber,
        semester: editFormData.semester,
        tutorName: editFormData.tutorName,
        email: editFormData.email,
        ...(editFormData.password && { password: editFormData.password })
      } : {
        name: editFormData.name,
        staffID: editFormData.staffID,
        designation: editFormData.designation,
        email: editFormData.email,
        ...(editFormData.password && { password: editFormData.password })
      };
  
      const response = await axios.put(endpoint, payload, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.success) {
        setAlert({
          show: true,
          message: 'User updated successfully!',
          type: 'success'
        });
        
        // Refresh data
        if (editSelectedType === 'student') {
          await fetchUsers();
        } else {
          await fetchStaffList();
        }
        
        // Reset form
        setEditFormData({
          name: '',
          registerNumber: '',
          semester: '',
          tutorName: '',
          email: '',
          password: '',
          staffID: '',
          designation: ''
        });
        setEditUserData(null);
        setEditIdentifier('');
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to update user',
        type: 'error'
      });
    }
  };

  const handleStudentClick = () => {
    setShowStudentForm(true);
    setShowAddOptions(false);
    setShowRemoveOptions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      setAlert({
        show: true,
        message: 'Password must be at least 8 characters',
        type: 'error'
      });
      return;
    }
  
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/add-student',
        {
          name: formData.name,
          registerNumber: formData.registerNumber,
          password: formData.password,
          semester:formData.semester,
          tutorName: formData.tutorName,
          email: formData.email
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        setAlert({
          show: true,
          message: `Student ${formData.name} registered successfully!`,
          type: 'success'
        });
        
        setTimeout(() => {
          setAlert({...alert, show: false});
          setFormData({
            name: '',
            registerNumber: '',
            semester: '',
            tutorName: '',
            email: '',
            password: ''
          });
          setShowStudentForm(false);
          setShowAddOptions(true);
          fetchUsers();
        }, 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                     error.message || 
                     'Registration failed. Please try again.';
      
      setAlert({
        show: true,
        message: errorMsg,
        type: 'error'
      });
    }
  };

// In your AdminDashboard component, update the handleStaffSubmit function:
const handleStaffSubmit = async (e) => {
  e.preventDefault();
  
  if (staffFormData.password.length < 8) {
    setAlert({
      show: true,
      message: 'Password must be at least 8 characters',
      type: 'error'
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('name', staffFormData.name);
    formData.append('email', staffFormData.email);
    formData.append('password', staffFormData.password);
    formData.append('staffID', staffFormData.staffID);
    formData.append('designation', staffFormData.designation);
    
    // Append signature file if exists
    if (staffFormData.signature) {
      formData.append('signature', staffFormData.signature);
    }

    // Log FormData contents for debugging
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const response = await axios.post(
      'http://localhost:5000/api/auth/add-staff',
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      setAlert({
        show: true,
        message: `Staff ${staffFormData.name} registered successfully!`,
        type: 'success'
      });
      
      setTimeout(() => {
        setAlert({...alert, show: false});
        setStaffFormData({
          name: '',
          email: '',
          password: '',
          staffID: '',
          designation: '',
          signature: null
        });
        setShowStaffForm(false);
        setShowAddOptions(true);
        fetchStaffList();
      }, 3000);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 
                   error.message || 
                   'Staff registration failed. Please try again.';
    
    setAlert({
      show: true,
      message: errorMsg,
      type: 'error'
    });
  }
};

// Add this new handler for file input
const handleSignatureUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setStaffFormData(prev => ({
      ...prev,
      signature: file
    }));
  }
};
  
  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleTutorSearch = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/get-students-by-range',
        {
          fromRegister,
          toRegister
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      
      if (response.data.success) {
        setSelectedStudents(response.data.students);
        setChangeTutorStep(2);
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Error fetching students',
        type: 'error'
      });
    }
  };

  const handleConfirmTutorChange = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/change-tutor',
        {
          fromRegister,
          toRegister,
          newTutorId: selectedTutor
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      
      console.log("Full response:", response); // Add this line
      
      if (response.data.success) {
        setAlert({
          show: true,
          message: response.data.message || 'Tutor changed successfully!',
          type: 'success'
        });
        
        // Reset form
        setChangeTutorStep(1);
        setFromRegister('');
        setToRegister('');
        setSelectedTutor('');
        setSelectedStudents([]);
      } else {
        // Handle case where success is false
        setAlert({
          show: true,
          message: response.data.message || 'Operation failed without error',
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Full error:", error); // Add this line
      console.error("Error response data:", error.response?.data); // Add this line
      
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Error changing tutor',
        type: 'error'
      });
    }
  };

  const handleChangeTutor = () => {
    // Reset all other states (including Edit)
    setEditSelectedType(null);  // <-- Add this
    setShowAddOptions(false);
    setShowRemoveOptions(false);
    setShowStudentForm(false);
    setShowStaffForm(false);
    setSelectedType(null);
    
    // Activate Change Tutor mode
    setShowChangeTutor(true);
    setChangeTutorStep(1);
    setFromRegister('');
    setToRegister('');
    setSelectedTutor('');
    setSelectedStudents([]);
  };

  const handleBackToOptions = () => {
    setShowStudentForm(false);
    setShowStaffForm(false);
    setShowRemoveOptions(false);
    setShowAddOptions(true);
  };

  const handleDeleteClick = (user) => {
    setUserToBeDeleted(user);
    setShowDeleteConfirmation(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!userToBeDeleted) return;
    
    try {
      const endpoint = selectedType === 'student' 
        ? `http://localhost:5000/api/auth/remove-student/${userToBeDeleted._id}`
        : `http://localhost:5000/api/auth/remove-staff/${userToBeDeleted._id}`;
  
      const response = await axios.delete(endpoint, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}` 
        }
      });
  
      if (response.data.success) {
        setAlert({
          show: true,
          message: `${selectedType === 'student' ? 'Student' : 'Staff'} deleted successfully!`,
          type: 'success'
        });
        
        // Reset states
        setUserToDelete(null);
        setUserToBeDeleted(null);
        setIdentifier('');
        setShowDeleteConfirmation(false);
        
        // Refresh data
        fetchUsers();
        fetchStaffList();
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to delete user',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
  
    try {
      const endpoint = selectedType === 'student' 
        ? `http://localhost:5000/api/auth/remove-student/${userToDelete._id}`
        : `http://localhost:5000/api/auth/remove-staff/${userToDelete._id}`;
  
      const response = await axios.delete(endpoint, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}` 
        }
      });
  
      if (response.data.success) {
        setAlert({
          show: true,
          message: `${selectedType === 'student' ? 'Student' : 'Staff'} deleted successfully!`,
          type: 'success'
        });
        
        // Reset states
        setUserToDelete(null);
        setIdentifier('');
        setSelectedType(null);
        setShowRemoveOptions(true);
        
        // Refresh data
        fetchUsers();
        fetchStaffList();
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to delete user',
        type: 'error'
      });
    }
  };
  
  const handleSearchUserToDelete = async (e) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      setAlert({
        show: true,
        message: 'Please enter an identifier',
        type: 'error'
      });
      return;
    }
  
    try {
      const endpoint = selectedType === 'student' 
        ? `http://localhost:5000/api/auth/get-student/${identifier}`
        : `http://localhost:5000/api/auth/get-staff/${identifier}`;
  
      const response = await axios.get(endpoint, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("authToken")}` 
        }
      });
  
      if (response.data.success) {
        setUserToDelete(response.data.data);
        // Don't show success alert here - just set the user data
      } else {
        setAlert({
          show: true,
          message: response.data.message || 'Student not found',
          type: 'error'
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Student not found in database',
        type: 'error'
      });
      setUserToDelete(null);
    }
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
              <div 
                onClick={handleAddClick}
                className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Add</span>}
              </div>

              <div 
                onClick={() => {
                  // Reset all edit states
                  setEditSelectedType(null);
                  setEditUserData(null);
                  setEditIdentifier('');
                  
                  // Reset other section states
                  setShowAddOptions(false);
                  setShowStudentForm(false);
                  setShowStaffForm(false);
                  setShowChangeTutor(false);
                  setSelectedType(null);
                  
                  // Activate remove options
                  setShowRemoveOptions(true);
                }}
                className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <UserMinus className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Remove</span>}
              </div>

              {/* Edit Button - Paste your code here */}
              <div 
                onClick={handleEditClick}
                className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <UserPen className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">Edit</span>}
              </div>

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
                    <div 
                      className="text-sm font-medium text-gray-700"
                      data-tooltip-id="name-tooltip"
                      data-tooltip-content={localStorage.getItem("userName") || "John Doe"}
                    >
                      {localStorage.getItem("userName") || "John Doe"}
                    </div>
                    <div 
                      className="text-xs text-gray-500 truncate"
                      data-tooltip-id="email-tooltip"
                      data-tooltip-content={localStorage.getItem("userEmail") || "johndoe@gmail.com"}
                    >
                      {localStorage.getItem("userEmail") || "johndoe@gmail.com"}
                    </div>
                    <Tooltip id="name-tooltip" />
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
        {alert.show && (
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
              message={alert.message} 
              isSuccess={alert.type === 'success'} 
              onClose={() => setAlert({...alert, show: false}) }
            />
          </div>
        )}
          {showChangeTutor ? (
              <div className="max-w-3xl mx-auto">   
                <div className="bg-white rounded-xl shadow-lg p-8 relative top-15">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    Tutor Change Form
                  </h1>   

                  {changeTutorStep === 1 && (
                    <form onSubmit={handleTutorSearch} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="fromRegister" className="block text-sm font-medium text-gray-700 mb-1">
                            From Register Number
                          </label>
                          <input
                            type="text"
                            id="fromRegister"
                            value={fromRegister}
                            onChange={(e) => setFromRegister(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label htmlFor="toRegister" className="block text-sm font-medium text-gray-700 mb-1">
                            To Register Number
                          </label>
                          <input
                            type="text"
                            id="toRegister"
                            value={toRegister}
                            onChange={(e) => setToRegister(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Search className="w-5 h-5 inline mr-2" />
                        Search Students
                      </button>
                    </form>
                  )}

                  {changeTutorStep === 2 && (
                    <div className="space-y-6">
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Register Number
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current Tutor
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedStudents.map((student) => (
                              <tr key={student._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {student.registerNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {student.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {student.tutorName || 'Not assigned'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select New Tutor *</label>
                        <select
                          value={selectedTutor}
                          onChange={(e) => setSelectedTutor(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                          required
                        >
                          <option value="">Select Tutor</option>
                          {staffList.map((tutor) => (
                            <option key={tutor._id} value={tutor._id}>
                              {tutor.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <button
                        onClick={() => setChangeTutorStep(3)}
                        disabled={!selectedTutor}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <UserPlus className="w-5 h-5 inline mr-2" />
                        Proceed to Confirmation
                      </button>
                    </div>
                  )}

                  {changeTutorStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">Confirmation</h3>
                        <p className="text-yellow-700">
                          You are about to change the tutor for {selectedStudents.length} students to{' '}
                          <span className="font-medium">
                            {staffList.find(t => t._id === selectedTutor)?.name || selectedTutor}
                          </span>. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={handleConfirmTutorChange}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Confirm Tutor Change
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ):editSelectedType ? (
              <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="max-w-4xl w-full">
                  {editSelectedType === 'select' ? (
                    <>
                      <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit User</h1>
                        <p className="text-gray-600">Choose an option to edit user details</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <button 
                          className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl hover:scale-105 group border border-gray-200"
                          onClick={() => setEditSelectedType('student')}
                        >
                          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto group-hover:bg-blue-200">
                            <GraduationCap className="w-8 h-8 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">Edit Student</h2>
                          <p className="text-gray-600">Update student details and academic information</p>
                        </button>
                        
                        <button 
                          className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl hover:scale-105 group border border-gray-200"
                          onClick={() => setEditSelectedType('staff')}
                        >
                          <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 mx-auto group-hover:bg-indigo-200">
                            <Users className="w-8 h-8 text-indigo-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-800 mb-2">Edit Staff</h2>
                          <p className="text-gray-600">Update staff member details and role information</p>
                        </button>
                      </div>
                    </>
                  ) : !editUserData ? (
                    <div className="max-w-2xl mx-auto">
                      <button
                        onClick={() => {
                          setEditSelectedType('select');
                          setEditIdentifier('');
                          setEditUserData(null);
                        }}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-14 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to options
                      </button>
            
                      <div className="bg-white rounded-xl shadow-lg p-8 relative -top-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                          Edit {editSelectedType === 'student' ? 'Student' : 'Staff Member'}
                        </h2>
            
                        <form onSubmit={handleEditSearch} className="space-y-6">
                          <div>
                            <label htmlFor="editIdentifier" className="block text-sm font-medium text-gray-700 mb-5">
                              Enter {editSelectedType === 'student' ? 'Register Number' : 'Staff ID'}
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="editIdentifier"
                                name="editIdentifier"
                                value={editIdentifier}
                                onChange={(e) => setEditIdentifier(e.target.value)}
                                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                autoComplete="off"
                                placeholder={`Enter ${editSelectedType === 'student' ? 'student register number' : 'staff ID'}`}
                              />
                              <Search className="absolute right-4 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                          </div>
            
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Search User
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto">
                      <button
                        onClick={() => {
                          setEditUserData(null);
                          setEditIdentifier('');
                        }}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-14 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to search
                      </button>
            
                      <div className="bg-white rounded-xl shadow-lg p-8 relative -top-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                          Edit {editSelectedType === 'student' ? 'Student' : 'Staff Member'}
                        </h2>
            
                        <div className="mt-8">
                          <form onSubmit={handleEditSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column */}
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                  <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                    autoComplete="off"
                                  />
                                </div>
            
                                {editSelectedType === 'student' ? (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Register Number</label>
                                      <input
                                        type="text"
                                        name="registerNumber"
                                        value={editFormData.registerNumber}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                        autoComplete="off"
                                      />
                                    </div>
            
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                      <select
                                        name="semester"
                                        value={editFormData.semester}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                        autoComplete="off"
                                      >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                          <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                                      <input
                                        type="text"
                                        name="staffID"
                                        value={editFormData.staffID}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                        autoComplete="off"
                                      />
                                    </div>
            
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                      <select
                                        name="designation"
                                        value={editFormData.designation}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                        autoComplete="off"
                                      >
                                        <option value="">Select Designation</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                      </select>
                                    </div>
                                  </>
                                )}
                              </div>
            
                              {/* Right Column */}
                              <div className="space-y-4">
                                {editSelectedType === 'student' ? (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Tutor</label>
                                    <input
                                      type="text"
                                      value={editUserData.tutorName || 'Not assigned'}
                                      readOnly
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                      type="text"
                                      value="Computer Science and Engineering"
                                      readOnly
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                    />
                                  </div>
                                )}
            
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                  <input
                                    type="email"
                                    name="email"
                                    value={editFormData.email}
                                    onChange={handleEditInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                    autoComplete="off"
                                  />
                                </div>
                              </div>
                            </div>

                              {/* PASTE THE SIGNATURE UPLOAD SECTION HERE */}
                              {editUserData?.signature?.url && (
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Signature</label>
                                  <div className="flex items-center">
                                    <img 
                                      src={editUserData.signature.url} 
                                      alt="Current signature" 
                                      className="h-16 w-auto border border-gray-300 rounded"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditFormData(prev => ({
                                          ...prev,
                                          removeSignature: true
                                        }));
                                      }}
                                      className="ml-2 text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {(!editUserData?.signature?.url || editFormData.removeSignature) && (
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editFormData.removeSignature ? 'Upload New Signature' : 'Signature Upload'}
                                  </label>
                                  <div className="flex items-center">
                                    <label className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                                      <span className="text-sm font-medium text-gray-700">
                                        {editFormData.signature ? editFormData.signature.name : 'Choose file'}
                                      </span>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          if (e.target.files[0]) {
                                            setEditFormData(prev => ({
                                              ...prev,
                                              signature: e.target.files[0],
                                              removeSignature: false
                                            }));
                                          }
                                        }}
                                      />
                                    </label>
                                    {editFormData.signature && (
                                      <button 
                                        type="button"
                                        onClick={() => setEditFormData(prev => ({ 
                                          ...prev, 
                                          signature: null,
                                          removeSignature: true
                                        }))}
                                        className="ml-2 text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Upload a clear image of the staff member's signature (JPG, PNG)
                                  </p>
                                </div>
                              )}
            
                            <button
                              type="submit"
                              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6 flex items-center justify-center"
                            >
                              <Save className="w-5 h-5 mr-2" />
                              Save Changes
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ): showStudentForm ? (
              <div className="flex items-center justify-center py-8">
              <div className="w-full max-w-4xl mx-4 mt-0">
                <button
                  onClick={handleBackToOptions}
                  className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to options
                </button>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Registration</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          autoComplete="off"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          minLength={3}
                          maxLength={50}
                          pattern="[A-Za-z ]+"
                          title="Only alphabetic characters allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Register Number *</label>
                        <input
                          type="text"
                          name="registerNumber"
                          autoComplete="off"
                          value={formData.registerNumber}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          pattern="[A-Za-z0-9]+"
                          title="Alphanumeric characters only"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                        <select
                          name="semester"
                          value={formData.semester}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Semester</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutor *</label>
                        <select
                          name="tutorName"
                          value={formData.tutorName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={loadingStaff || fetchError}
                        >
                          <option value="">Select Tutor</option>
                          {staffList.map((staff) => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                        {alert.show && (
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
                            message={alert.message} 
                            isSuccess={alert.type === 'success'} 
                            onClose={() => setAlert({...alert, show: false})} 
                          />
                        </div>
                      )}
                        
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          name="email"
                          autoComplete="off"
                          value={staffFormData.email}
                          onChange={handleStaffInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                          title="Enter a valid email address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          name="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          minLength={8}
                          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                          title="Must contain at least one uppercase, one lowercase, and one number"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum 8 characters with at least one uppercase, one lowercase, and one number
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6 disabled:opacity-50"
                    disabled={loadingStaff || fetchError}
                  >
                    {loadingStaff ? 'Loading...' : 'Register Student'}
                  </button>
                </form>
                </div>
              </div>
            </div>
            ): showStaffForm ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-full max-w-4xl mx-4 mt-0">
                  <button
                    onClick={handleBackToOptions}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to options
                  </button>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Staff Registration</h2>
                    
                    <form onSubmit={handleStaffSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Full Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                              type="text"
                              name="name"
                              autoComplete="off"
                              value={staffFormData.name}
                              onChange={handleStaffInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                              minLength={3}
                              maxLength={50}
                              pattern="[A-Za-z ]+"
                              title="Only alphabetic characters allowed"
                            />
                          </div>
            
                          {/* Staff ID */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID *</label>
                            <input
                              type="text"
                              name="staffID"
                              autoComplete="off"
                              value={staffFormData.staffID}
                              onChange={handleStaffInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                              pattern="[A-Za-z0-9]+"
                              title="Alphanumeric characters only"
                            />
                          </div>
            
                          {/* Department (fixed value) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <input
                              type="text"
                              name="department"
                              value="Computer Science and Engineering"
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                        </div>
            
                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Designation */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                            <select
                              name="designation"
                              value={staffFormData.designation}
                              onChange={handleStaffInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select Designation</option>
                              <option value="Professor">Professor</option>
                              <option value="Associate Professor">Associate Professor</option>
                              <option value="Assistant Professor">Assistant Professor</option>
                            </select>
                          </div>
            
                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              name="email"
                              autoComplete="off"
                              value={staffFormData.email}
                              onChange={handleStaffInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                              title="Enter a valid email address"
                            />
                          </div>
            
                          {/* Password */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input
                              type="password"
                              name="password"
                              autoComplete="new-password"
                              value={staffFormData.password}
                              onChange={handleStaffInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                              minLength={8}
                              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                              title="Must contain at least one uppercase, one lowercase, and one number"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Minimum 8 characters with at least one uppercase, one lowercase, and one number
                            </p>
                          </div>
                        </div>
                      </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Signature Upload</label>
                      <div className="flex items-center">
                        <label className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                          <span className="text-sm font-medium text-gray-700">
                            {staffFormData.signature ? staffFormData.signature.name : 'Choose file'}
                          </span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleSignatureUpload}
                          />
                        </label>
                        {staffFormData.signature && (
                          <button 
                            type="button"
                            onClick={() => setStaffFormData(prev => ({ ...prev, signature: null }))}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a clear image of the staff member's signature (JPG, PNG)
                      </p>
                    </div>
            
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6"
                      >
                        Register Staff
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : showAddOptions ? (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
              <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
                  <p className="text-gray-600">Choose an option to add a new user to the system</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Add Student Card */}
                  <button 
                    className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl hover:scale-105 group"
                    onClick={handleStudentClick}
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto group-hover:bg-blue-200">
                      <GraduationCap className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Student</h2>
                    <p className="text-gray-600">Register a new student to the system with their academic details</p>
                  </button>

                  {/* Add Staff Card */}
                  <button 
                    className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl hover:scale-105 group"
                    onClick={handleStaffClick}
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 mx-auto group-hover:bg-indigo-200">
                      <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Staff</h2>
                    <p className="text-gray-600">Register a new staff member with their role and department</p>
                  </button>
                </div>
              </div>
            </div>
          ) : showRemoveOptions ? (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
              <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">User Removal</h1>
                  <p className="text-gray-600">Select an option to remove a user from the system</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Remove Student Card */}
                  <button 
                    className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl hover:scale-105 group"
                    onClick={() => {
                      setSelectedType('student');
                      setShowRemoveOptions(false);
                    }}
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto group-hover:bg-red-200">
                      <GraduationCap className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Remove Student</h2>
                    <p className="text-gray-600">Remove a student and their associated academic records</p>
                    <div className="mt-4 text-sm text-red-600">
                      <UserMinus className="w-4 h-4 inline-block mr-1" />
                      This action cannot be undone
                    </div>
                  </button>

                  {/* Remove Staff Card */}
                  <button 
                    className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl hover:scale-105 group"
                    onClick={() => {
                      setSelectedType('staff');
                      setShowRemoveOptions(false);
                    }}
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto group-hover:bg-red-200">
                      <Users className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Remove Staff</h2>
                    <p className="text-gray-600">Remove a staff member from the system</p>
                    <div className="mt-4 text-sm text-red-600">
                      <UserMinus className="w-4 h-4 inline-block mr-1" />
                      This action cannot be undone
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ): selectedType ? (
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => {
                  setSelectedType(null);
                  setShowRemoveOptions(true);
                  setUserToDelete(null);
                  setIdentifier('');
                }}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-10 transition-colors pt-10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to options
              </button>

              <div className="bg-white rounded-xl shadow-lg p-8 -mt-3">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Remove {selectedType === 'student' ? 'Student' : 'Staff Member'}
                </h2>

                {!userToDelete ? (
                  <form onSubmit={handleSearchUserToDelete} className="space-y-6">
                    <div>
                      <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                        Enter {selectedType === 'student' ? 'Register Number' : 'Staff ID'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="identifier"
                          name="identifier"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                          autoComplete="off"
                          placeholder={`Enter ${selectedType === 'student' ? 'student register number' : 'staff ID'}`}
                        />
                        <Search className="absolute right-4 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Search User
                    </button>
                  </form>
                ) : (
                  <div className="mt-8 border-t pt-3">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">User Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm text-gray-600">Name:</div>
                        <div className="text-sm font-medium">{userToDelete.name}</div>
                        
                        {selectedType === 'student' ? (
                          <>
                            <div className="text-sm text-gray-600">Register Number:</div>
                            <div className="text-sm font-medium">{userToDelete.registerNumber}</div>
                            
                            <div className="text-sm text-gray-600">Semester:</div>
                            <div className="text-sm font-medium">{userToDelete.semester}</div>

                            <div className="text-sm text-gray-600">Tutor Name:</div>
                            <div className="text-sm font-medium">{userToDelete.tutorName}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-600">Staff ID:</div>
                            <div className="text-sm font-medium">{userToDelete.staffID}</div>
                            
                            <div className="text-sm text-gray-600">Designation:</div>
                            <div className="text-sm font-medium">{userToDelete.designation}</div>

                            <div className="text-sm text-gray-600">Department:</div>
                            <div className="text-sm font-medium">{userToDelete.department}</div>
                          </>
                        )}
                        
                        <div className="text-sm text-gray-600">Email:</div>
                        <div className="text-sm font-medium">{userToDelete.email}</div>
                      </div>

                      <button
                        onClick={() => handleDeleteClick(userToDelete)}
                        className="mt-6 w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ):null}

          {alert.show && (
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
                message={alert.message} 
                isSuccess={alert.type === 'success'} 
                onClose={() => setAlert({...alert, show: false})}
              />
            </div>
          )}
        {showDeleteConfirmation && userToBeDeleted && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}>
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '5px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Confirm Deletion</h3>
              <p style={{ color: '#666' }}>
                Are you sure you want to delete {userToBeDeleted.name}? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginRight: '10px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {showSaveConfirmation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}>
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '5px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Confirm Changes</h3>
              <p style={{ color: '#666' }}>
                Are you sure you want to save these changes?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowSaveConfirmation(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginRight: '10px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;