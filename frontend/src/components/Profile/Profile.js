import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdArrowBack } from "react-icons/md";

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
          params: { email: userEmail },
        });

        setUserDetails(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch user details. Please try again.");
        setLoading(false);
        navigate("/");
      }
    };

    fetchUserDetails();
  }, [navigate]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-[Poppins]">
      {/* Back Button */}
      <button
        className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-gray-600 transition"
        onClick={() => navigate(-1)}
      >
        <MdArrowBack className="text-2xl mr-1" />
        <span className="text-sm">Back</span>
      </button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.designation}</p>
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
