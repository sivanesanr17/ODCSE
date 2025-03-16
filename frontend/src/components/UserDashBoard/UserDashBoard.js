import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUserCircle, FaPlus } from "react-icons/fa";
import axios from "axios";

const UserDashBoard = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState("events"); // State to track active tab
  const [odHistory, setOdHistory] = useState([]); // State to store OD history

  // State for OD Form
  const [eventName, setEventName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [tutorName, setTutorName] = useState(""); // Tutor name will be autofilled
  const [students, setStudents] = useState([
    { registerNumber: "", name: "", semester: "", section: "", attendancePercentage: "" },
  ]);

  // Check if all fields are filled
  const isFormValid = () => {
    if (!eventName || !fromDate || !toDate || !tutorName) return false;

    for (const student of students) {
      if (
        !student.registerNumber ||
        !student.name ||
        !student.semester ||
        !student.section ||
        !student.attendancePercentage
      ) {
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/"); // Redirect to login if not authenticated
    }

    // Fetch OD history when the component mounts
    fetchOdHistory();
  }, [navigate]);

  // Function to fetch OD history
  const fetchOdHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/od/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setOdHistory(response.data); // Set OD history in state
    } catch (error) {
      console.error("Error fetching OD history:", error);
    }
  };

  // Calculate number of days when fromDate or toDate changes
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const timeDiff = to - from;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
      setNumberOfDays(daysDiff);
    }
  }, [fromDate, toDate]);

  // Fetch student details from the database
  const fetchStudentDetails = async (registerNumber) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${registerNumber}`);
      return response.data; // Returns { name, semester, section, attendancePercentage, tutor }
    } catch (error) {
      console.error("Error fetching student details:", error);
      return null;
    }
  };

  // Handle register number input
  const handleRegisterNumberChange = async (index, value) => {
    const newStudents = [...students];
    newStudents[index].registerNumber = value;

    // Fetch student details from the database
    const studentDetails = await fetchStudentDetails(value);
    if (studentDetails) {
      newStudents[index].name = studentDetails.name;
      newStudents[index].semester = studentDetails.semester;
      newStudents[index].section = studentDetails.section;
      newStudents[index].attendancePercentage = studentDetails.attendancePercentage;

      // Autofill tutor name based on the first student's register number
      if (index === 0) {
        setTutorName(studentDetails.tutor);
      }
    } else {
      newStudents[index].name = "";
      newStudents[index].semester = "";
      newStudents[index].section = "";
      newStudents[index].attendancePercentage = "";

      // Clear tutor name if the first student's register number is invalid
      if (index === 0) {
        setTutorName("");
      }
    }

    setStudents(newStudents);
  };

  // Add a new row for another student
  const addStudentRow = async () => {
    const registerNumber = prompt("Enter the register number of the student to be added:");
    if (registerNumber) {
      const studentDetails = await fetchStudentDetails(registerNumber);
      if (studentDetails) {
        // Send invitation email to the student
        await axios.post("http://localhost:5000/api/send-invitation", {
          email: studentDetails.email,
          eventName,
          fromDate,
          toDate,
        });

        // Add the student to the table
        setStudents([
          ...students,
          {
            registerNumber,
            name: studentDetails.name,
            semester: studentDetails.semester,
            section: studentDetails.section,
            attendancePercentage: studentDetails.attendancePercentage,
          },
        ]);
      } else {
        alert("Student not found!");
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/od/submit", {
        eventName,
        fromDate,
        toDate,
        numberOfDays,
        tutorName,
        students,
      });
      alert("OD form submitted successfully!");
      console.log("Submission Response:", response.data);
    } catch (error) {
      console.error("Error submitting OD form:", error);
      alert("Failed to submit OD form. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-black p-4 shadow-md">
        {/* Logo */}
        <img
          src="/assets/ODCSE Logo.png"
          alt="Logo"
          className="h-16 w-18 filter brightness-0 invert"
        />

        {/* Tabs for Events, Other OD, and History */}
        <div className="flex-grow flex justify-center gap-4">
          <button
            className={`py-2 px-4 text-lg font-medium ${
              activeTab === "events"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("events")}
          >
            Events
          </button>
          <button
            className={`py-2 px-4 text-lg font-medium ${
              activeTab === "otherOD"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("otherOD")}
          >
            Other OD
          </button>
          <button
            className={`py-2 px-4 text-lg font-medium ${
              activeTab === "history"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>

        {/* Profile Icon */}
        <FaUserCircle
          className="text-white text-3xl cursor-pointer"
          onClick={() => navigate("/profile")}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome {username} to User Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              This is the user panel where you can view events, manage your OD requests, and check your history.
            </p>

            {/* Content based on active tab */}
            <div className="mt-4">
              {activeTab === "events" ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Events</h2>
                  <p className="text-gray-600 mt-2">
                    List of events will be displayed here.
                  </p>
                </div>
              ) : activeTab === "otherOD" ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Other OD</h2>
                  {/* OD Form */}
                  <div className="mt-4">
                    {/* Event Name */}
                    <div className="mb-4">
                      <label className="block text-gray-700">Event Name</label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter event name"
                      />
                    </div>

                    {/* From and To Dates */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700">From</label>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700">To</label>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Number of Days */}
                    <div className="mb-4">
                      <label className="block text-gray-700">Number of Days</label>
                      <input
                        type="text"
                        value={numberOfDays}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    {/* Tutor Name */}
                    <div className="mb-4">
                      <label className="block text-gray-700">Tutor Name</label>
                      <input
                        type="text"
                        value={tutorName}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    {/* Student Table */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Student Details
                        </h3>
                        <FaPlus
                          className="text-blue-600 text-2xl cursor-pointer"
                          onClick={addStudentRow}
                        />
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="p-2 text-left">Register Number</th>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Semester</th>
                            <th className="p-2 text-left">Section</th>
                            <th className="p-2 text-left">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={student.registerNumber}
                                  onChange={(e) =>
                                    handleRegisterNumberChange(index, e.target.value)
                                  }
                                  className="w-full p-1 border border-gray-300 rounded-md"
                                  placeholder="Enter register number"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={student.name}
                                  readOnly
                                  className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={student.semester}
                                  readOnly
                                  className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={student.section}
                                  readOnly
                                  className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={student.attendancePercentage}
                                  readOnly
                                  className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center mt-6">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isFormValid()}
                        className={`px-6 py-2 ${
                          isFormValid()
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400 cursor-not-allowed"
                        } text-white rounded-md`}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">OD History</h2>
                  {odHistory.length > 0 ? (
                    <table className="w-full mt-4">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2 text-left">Event Name</th>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {odHistory.map((od, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="p-2">{od.eventName}</td>
                            <td className="p-2">{new Date(od.date).toLocaleDateString()}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded-full text-sm ${
                                  od.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : od.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {od.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-600 mt-2">No OD history found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashBoard;