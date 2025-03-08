import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching profile for email:", email); // Debugging
        const response = await axios.get(`http://localhost:5000/api/user/profile?email=${email}`);
        console.log("API Response:", response.data); // Debugging

        if (response.data) {
          setUserDetails(response.data);
        } else {
          setError("User not found");
        }
      } catch (error) {
        console.error("Error fetching profile:", error); // Debugging
        setError("Failed to fetch profile details");
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchProfile();
    } else {
      setError("Email is required");
      setLoading(false);
    }
  }, [email]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-container">
      <h1>Profile Details</h1>
      {userDetails && (
        <div className="profile-details">
          <p><strong>Name:</strong> {userDetails.name}</p>
          {userDetails.registerNumber && <p><strong>Register Number:</strong> {userDetails.registerNumber}</p>}
          {userDetails.semester && <p><strong>Semester:</strong> {userDetails.semester}</p>}
          {userDetails.tutorName && <p><strong>Tutor Name:</strong> {userDetails.tutorName}</p>}
          {userDetails.role === "staff" && <p><strong>Designation:</strong> {userDetails.designation}</p>}
          <p><strong>Email:</strong> {userDetails.email}</p>
        </div>
      )}
      <button onClick={() => navigate(-1)}>Back to Dashboard</button>
    </div>
  );
};

export default Profile;