import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import styles from "./userdashboard.module.css";

const UserDashBoard = () => {
  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/"); // Redirect to login if not authenticated
    }
  }, [navigate]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <img src="/assets/ODCSE Logo.png" alt="Logo" className={styles.logo} />
        <FaUserCircle className={styles.userIcon} onClick={() => navigate("/profile")} />
      </div>
      <h1 className={styles.title}>Welcome {username} to User Dashboard</h1>
      <p className={styles.description}>
        This is the user panel where you can view events, upload events, and check your history.
      </p>
    </div>
  );
};

export default UserDashBoard;
