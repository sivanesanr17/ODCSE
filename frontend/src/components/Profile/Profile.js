import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPencilAlt } from "react-icons/fa";

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [isEditingTutor, setIsEditingTutor] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState("");
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const authToken = localStorage.getItem("authToken");
      const userEmail = localStorage.getItem("userEmail");

      if (!authToken || !userEmail) {
        navigate("/");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/auth/user", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          params: { email: userEmail },
        });

        setUserDetails(response.data);
        setSelectedTutor(response.data.tutorName);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch user details. Please try again.");
        setLoading(false);
        navigate("/");
      }
    };

    fetchUserDetails();
  }, [navigate]);

  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/staff-list");
        setStaffList(response.data);
        setStaffLoading(false);
      } catch (error) {
        setError("Failed to fetch staff list. Please try again.");
        setStaffLoading(false);
      }
    };

    fetchStaffList();
  }, []);

  const handleTutorUpdate = async () => {
    if (isSaving) return; // Prevent double click
    setIsSaving(true);
    setError("");
  
    try {
      const authToken = localStorage.getItem("authToken");
      const userEmail = localStorage.getItem("userEmail").trim().toLowerCase();
  
      await axios.put(
        "http://localhost:5000/api/auth/update-tutor",
        {
          email: userEmail,
          tutorName: selectedTutor,
          studentName: userDetails.name,
          semester: userDetails.semester,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
  
      setUserDetails({ ...userDetails, tutorName: selectedTutor });
      setIsEditingTutor(false);
      setSuccessMessage("✅ Tutor updated successfully!");
      setTimeout(() => setSuccessMessage(""), 1000);
    } catch (error) {
      setError("Failed to update tutor name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{userDetails.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{userDetails.email}</p>
          </div>
          {userDetails.role === "staff" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Staff ID</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.staffID}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Register Number</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.registerNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.semester}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tutor Name</label>
                {isEditingTutor ? (
                  <div className="flex items-center">
                    <select
                      value={selectedTutor}
                      onChange={(e) => setSelectedTutor(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md text-sm"
                    >
                      {staffLoading ? (
                        <option>Loading staff...</option>
                      ) : (
                        staffList.map((staff) => (
                          <option key={staff._id} value={staff.name}>
                            {staff.name}
                          </option>
                        ))
                      )}
                    </select>
                                      <button
                    onClick={handleTutorUpdate}
                    className={`ml-2 px-2 py-1 text-white rounded-md text-sm ${
                      isSaving ? 'bg-gray-400' : 'bg-blue-500'
                    }`}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>

                  </div>
                ) : (
                  <div className="flex items-center">
                    <p className="mt-1 text-sm text-gray-900">{userDetails.tutorName}</p>
                    <button
                      onClick={() => setIsEditingTutor(true)}
                      className="ml-2 text-gray-500"
                    >
                      <FaPencilAlt />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {successMessage && <div className="text-green-500 mt-4 text-sm">{successMessage}</div>}
      </div>
    </div>
  );
};

export default Profile;
