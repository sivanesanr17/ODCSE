import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

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
          params: {
            email: userEmail,
          },
        });

        setUserDetails(response.data);
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        navigate("/");
      }
    };

    fetchUserDetails();
  }, [navigate]);

  if (!userDetails) {
    return <div>Loading...</div>;
  }

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
                <p className="mt-1 text-sm text-gray-900">{userDetails.tutorName}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;