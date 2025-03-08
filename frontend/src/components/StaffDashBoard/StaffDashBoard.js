import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaUpload, FaHistory, FaRegBell, FaUserCircle } from "react-icons/fa";
import styles from "./staffdashboard.module.css";

const StaffDashboard = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/"); // Redirect to login if not authenticated
    }
  }, [navigate]);

  const displayName = username ? username.replace("-", " ") : "Guest";

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <img src="/assets/ODCSE Logo.png" alt="Logo" className={styles.logo} />
        <ul className={styles.navList}>
          <li className={styles.smallText} onClick={() => navigate("/events")}> 
            <FaCalendarAlt className={styles.navIcon} /> Events
          </li>
          <li className={styles.smallText} onClick={() => navigate("/upload-events")}> 
            <FaUpload className={styles.navIcon} /> Upload Events
          </li>
          <li className={styles.smallText} onClick={() => navigate("/history")}> 
            <FaHistory className={styles.navIcon} /> History
          </li>
        </ul>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <FaRegBell className={styles.bellIcon} onClick={() => navigate("/notifications")} />
            <FaUserCircle className={styles.userIcon} onClick={() => navigate("/profile")} />
          </div>
        </div>
        <h1 className={styles.title}>Welcome, {displayName}!</h1>
      </div>
    </div>
  );
};

export default StaffDashboard;
