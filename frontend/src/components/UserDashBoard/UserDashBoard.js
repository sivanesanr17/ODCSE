import React, { useEffect, useState, useCallback, useRef } from "react";
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
  FileText,
  User
} from "lucide-react";
import { Tooltip } from 'react-tooltip';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isViewingEvent, setIsViewingEvent] = useState(false);
  // Add this at the top of your ODRequestForm component
  const eventNameRef = useRef(null);
  const venueRef = useRef(null);
  const searchInputRef = useRef(null);
  const [venue, setVenue] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showRegisterNumberPopup, setShowRegisterNumberPopup] = useState(false);
  const [isTwoDays, setIsTwoDays] = useState(false);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showInvitationSent, setShowInvitationSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [students, setStudents] = useState([{
    registerNumber: '',
    name: '',
    semester: '',
    section: '',
    attendancePercentage: '',
    isRequester: true
  }]);

  const fetchAttendanceData = async () => {
    try {
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

          // Clean attendance value
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
    }
  };


  const generateODPDF = async (request) => {
    try {
      setIsGeneratingPDF(true);
      setPopupMessage("Generating OD...");
      setShowPopup(true);

      // First fetch the attendance data
      const attendanceMap = await fetchAttendanceData();

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [220, 160],
        compress: true,
        hotfixes: ["px_scaling"],
        putOnlyUsedFonts: true,
        precision: 3
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;

      const logoUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwqx4u1x4rWoMbRpO51KZ__P_AvN4k8hRuDg&s';

      const logoWidth = 15;
      const logoHeight = 15;
      const logoX = 12;
      const logoY = 15;
      const contentOffsetY = 5;

      // Add centered logo
      doc.addImage(logoUrl, 'JPEG', logoX, logoY, logoWidth, logoHeight);

      // Add approved date at top right if available
      const approvalDate = request.tutorApproval?.date || request.updatedAt || request.createdAt;
      if (approvalDate) {
        const formattedApprovalDate = formatDateForPDF(approvalDate);
        doc.setFontSize(5);
        doc.setTextColor(100); // Gray color
        doc.text(`Approved on: ${formattedApprovalDate}`, pageWidth - 10, 10, { align: 'right' });
        doc.setTextColor(0); // Reset to black
      }

      // Header text under the logo
      const headerY = logoY + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY', 28, headerY);

      doc.setFontSize(10.5);
      doc.text('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', 35, headerY + 6);

      // Title below header
      doc.setFontSize(11);
      doc.text('ON-DUTY FORM', centerX, headerY + 18, { align: 'center' });

      // Event Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const eventDetails = [
        `Event Name      : ${request.eventName}`,
        `Venue               : ${request.venue}`,
        `From                 : ${formatDateForPDF(request.fromDate)}`,
        `To                     : ${formatDateForPDF(request.toDate)}`,
        `Number of Days : ${request.numberOfDays}`
      ];

      const margin = 15;
      const detailsStartY = headerY + 30;
      const lineHeight = 7;

      eventDetails.forEach((detail, index) => {
        doc.text(detail, margin, detailsStartY + index * lineHeight);
      });

      // Student Table
      const tableStartY = detailsStartY + eventDetails.length * lineHeight + 2;

      // Prepare table data with attendance from attendanceMap
      const tableData = request.participants.map(p => [
        p.registerNumber,
        p.name,
        p.semester,
        attendanceMap[p.registerNumber] ? `${attendanceMap[p.registerNumber]}%` :
          (p.attendancePercentage ? `${p.attendancePercentage}%` : 'N/A')
      ]);

      autoTable(doc, {
        startY: tableStartY,
        margin: { left: margin, right: margin },
        head: [['Register No.', 'Name', 'Semester', 'Attendance %']],
        body: tableData,
        styles: {
          fontSize: 10,
          halign: 'center'
        },
        headStyles: {
          fillColor: [220, 220, 220],
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'left' },
          2: { halign: 'center' },
          3: { halign: 'center' }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // Signatures section at the bottom
      doc.setFontSize(10);
      const sectionOffset = 50;
      const sigLineLength = 30;
      const signatureY = pageHeight - 30;
      const signatureImageHeight = 15;
      const signatureImageWidth = 30;

      // Fetch tutor signature from staff database
      let tutorSignatureUrl = null;
      try {
        const response = await axios.get(
          `http://localhost:5000/api/auth/get-staff-signature`,
          {
            params: { name: request.tutorName || currentUser?.tutorName || "Unknown" },
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
          }
        );

        if (response.data?.success && response.data.signatureUrl) {
          tutorSignatureUrl = response.data.signatureUrl;
        }
      } catch (error) {
        console.error("Error fetching tutor signature:", error);
      }
      const tutorNameToShow = request.tutorName || currentUser?.tutorName || 'Tutor';

      const approvedByTextWidth = doc.getStringUnitWidth('Approved By') * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const approvedByX = centerX - sectionOffset - approvedByTextWidth / 2;

      doc.text('Approved By', approvedByX, 187);

      if (tutorSignatureUrl) {
        try {
          const signatureX = 18;
          const signatureYPos = 190;
          doc.addImage(tutorSignatureUrl, 'PNG',
            signatureX, signatureYPos,
            signatureImageWidth, signatureImageHeight);

          doc.text(tutorNameToShow,
            centerX - sectionOffset, signatureY + 14, { align: 'center' });
        } catch (error) {
          console.error("Error adding signature:", error);
          doc.text(tutorNameToShow,
            centerX - sectionOffset, signatureY + 14, { align: 'center' });
        }
      } else {
        doc.text(tutorNameToShow,
          centerX - sectionOffset, signatureY + 14, { align: 'center' });
      }

      // Add ODCSE Logo below 'Generated By'
      const odcseLogoUrl = 'https://res.cloudinary.com/dwpdgfqnr/image/upload/v1744635382/vhafo9xudbnba39yzc0h.png';
      const logoGeneratedWidth = 28;
      const logoGeneratedHeight = 10;
      const logoGeneratedX = 117;
      const logoGeneratedY = 190;

      // Generated By section
      doc.text('Generated By', 120, 187);
      try {
        doc.addImage(odcseLogoUrl, 'PNG', logoGeneratedX, logoGeneratedY, logoGeneratedWidth, logoGeneratedHeight);
      } catch (error) {
        console.error("Error adding ODCSE logo:", error);
      }

      doc.save(`OD_${request.eventName}_${request.requestId}.pdf`);

      setShowPopup(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPopupMessage("Failed to generate OD");
      setIsSuccess(false);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Helper function for date formatting in PDF
  const formatDateForPDF = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };


  const OdHistory = ({ odHistory, currentUser, generateODPDF }) => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewingDetails, setIsViewingDetails] = useState(false);
    const [attendanceData, setAttendanceData] = useState({});
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

    // Add this function to fetch attendance data
    // Enhanced fetch function with better error handling
    const fetchAttendanceData = async () => {
      try {
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

            // Clean attendance value
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
      }
    };

    // Load attendance data when component mounts
    useEffect(() => {
      const loadData = async () => {
        const data = await fetchAttendanceData();
        setAttendanceData(data);
      };
      loadData();
    }, []);

    const renderAttendanceCell = (registerNumber) => {
      if (isLoadingAttendance) return "Loading...";
      return attendanceData[registerNumber] ? `${attendanceData[registerNumber]}%` : "N/A";
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const getStatusBadge = (status) => {
      const statusClasses = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        completed: "bg-blue-100 text-blue-800",
      };

      return (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    };

    const getApprovalFlowStatus = (request) => {
      const flowStatus = [];
      const tutorName = request.tutorName || currentUser?.tutorName || "Unknown";

      // Check if tutorApproval exists and has a status
      if (request.tutorApproval) {
        flowStatus.push({
          stage: tutorName,
          status: request.tutorApproval.status,
          date: request.tutorApproval.date,
          comments: request.tutorApproval.comments
        });
      } else if (request.status) {
        // If no tutorApproval object but request has a status, use that
        flowStatus.push({
          stage: tutorName,
          status: request.status,
          date: request.updatedAt || request.createdAt
        });
      } else {
        // Default to pending if no status information is available
        flowStatus.push({
          stage: tutorName,
          status: "pending"
        });
      }

      return flowStatus;
    };


    if (isViewingDetails && selectedRequest) {
      const approvalFlow = getApprovalFlowStatus(selectedRequest);

      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <button
            onClick={() => setIsViewingDetails(false)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to History
          </button>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedRequest.eventName}
                </h2>
                <p className="text-gray-600">
                  {formatDate(selectedRequest.fromDate)} -{" "}
                  {formatDate(selectedRequest.toDate)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(selectedRequest.status)}
                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => generateODPDF(selectedRequest)}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-1"></div>
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    Download OD
                  </button>
                )}
              </div>
            </div>

            {/* Approval Flow Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Approval Status
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-4">
                  {approvalFlow.map((stage, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-4">
                        {stage.stage.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-700 mt-1">{stage.stage}</p>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full mt-2 ${stage.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : stage.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800" // All other cases show as yellow (pending)
                            }`}>
                            {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                          </span>
                        </div>
                        {stage.date && (
                          <p className="text-xs text-gray-500 -mt-1">
                            {formatDate(stage.date)}
                          </p>
                        )}
                        {stage.comments && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Comments:</span> {stage.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rest of your existing details view */}
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
                          {selectedRequest.requestId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted On</p>
                        <p className="font-medium">
                          {formatDate(selectedRequest.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Venue</p>
                        <p className="font-medium">{selectedRequest.venue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Number of Days</p>
                        <p className="font-medium">
                          {selectedRequest.numberOfDays}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRequest.decision && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Decision Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Decision By</p>
                          <p className="font-medium">
                            {selectedRequest.decision.by}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Decision Date</p>
                          <p className="font-medium">
                            {formatDate(selectedRequest.decision.at)}
                          </p>
                        </div>
                        {selectedRequest.decision.comments && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-500">Comments</p>
                            <p className="font-medium">
                              {selectedRequest.decision.comments}
                            </p>
                          </div>
                        )}
                        {selectedRequest.decision.signatureUrl && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-500">Signature</p>
                            <img
                              src={selectedRequest.decision.signatureUrl}
                              alt="Tutor signature"
                              className="h-20 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                      {selectedRequest.participants.map((participant, idx) => (
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

            {selectedRequest.supportingDocuments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Supporting Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedRequest.supportingDocuments.map((doc, idx) => (
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
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">OD Request History</h1>

        {odHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {odHistory.map((request) => {
                  const approvalFlow = getApprovalFlowStatus(request);
                  const tutorStatus = approvalFlow[0]; // First item is tutor status

                  return (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.eventName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tutorStatus.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : tutorStatus.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {tutorStatus.status.charAt(0).toUpperCase() + tutorStatus.status.slice(1)}
                          </span>
                          {tutorStatus.status === "approved" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateODPDF(request);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Download OD"
                              disabled={isGeneratingPDF}
                            >
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsViewingDetails(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No OD requests found</p>
          </div>
        )}
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
    fetchEvents();
  }, [navigate]);


  // Fetch current user data from backend
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const userEmail = localStorage.getItem("userEmail");

      if (!userEmail) {
        navigate("/");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/auth/user", {
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
        attendancePercentage: response.data.attendancePercentage,
        isRequester: true
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

  // Fetch OD history from backend
  // Fetch OD history from backend
  const fetchOdHistory = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/od/student-requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      setOdHistory(response.data.requests || []);
    } catch (error) {
      console.error("Error fetching OD history:", error);
      setOdHistory([]);
    }
  };

  // Fetch events from backend
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

  // Handle two-day checkbox change
  useEffect(() => {
    if (isTwoDays && fromDate) {
      const from = new Date(fromDate);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      setToDate(to.toISOString().split('T')[0]);
    }
  }, [isTwoDays, fromDate]);

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

  // Format date helper function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setVenue(event.venue || "");
    setIsViewingEvent(true);
  };

  // Handle back to events
  const handleBackToEvents = () => {
    setIsViewingEvent(false);
    setSelectedEvent(null);
  };

  // Remove student from list
  const removeStudent = (index) => {
    const newStudents = [...students];
    newStudents.splice(index, 1);
    setStudents(newStudents);
  };

  // Submit OD form
  // In your frontend handleSubmit function
  const handleSubmit = async () => {
    try {
      // First check for pending students
      if (pendingStudents.length > 0) {
        setPopupMessage("Cannot submit request while student invitations are pending");
        setIsSuccess(false);
        setShowPopup(true);
        return;
      }

      setIsProcessing(true);
      setPopupMessage("Submitting request...");
      setShowPopup(true);

      const formData = new FormData();
      formData.append("eventName", eventName);
      formData.append("fromDate", fromDate);
      formData.append("toDate", toDate);
      formData.append("numberOfDays", numberOfDays);
      formData.append("venue", venue);
      formData.append("students", JSON.stringify(students));

      if (documents && documents.length > 0) {
        documents.forEach((file) => {
          formData.append("documents", file);
        });
      }

      const response = await axios.post(
        "http://localhost:5000/api/auth/od/submit",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setPopupMessage("OD submitted successfully!");
        setIsSuccess(true);

        // Clear form
        setEventName("");
        setFromDate("");
        setToDate("");
        setVenue("");
        setNumberOfDays(0);
        setStudents([{
          registerNumber: currentUser?.registerNumber || "",
          name: currentUser?.name || "",
          semester: currentUser?.semester || "",
          section: currentUser?.section || "",
          attendancePercentage: currentUser?.attendancePercentage || "",
          isRequester: true,
        }]);
        setPendingStudents([]);
        setDocuments([]);

        // Refresh history
        fetchOdHistory();
        setActiveTab("odHistory");
      } else {
        setPopupMessage(response.data.message || "Failed to submit OD");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Error submitting OD:", error);
      setPopupMessage(
        error.response?.data?.message || "Failed to submit OD request"
      );
      setIsSuccess(false);
    } finally {
      setIsProcessing(false);
      // Don't hide the popup immediately if it's a success message
      if (!isSuccess) {
        setTimeout(() => setShowPopup(false), 3000);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
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

  const isFormValid = useCallback(() => {
    // Check required fields
    if (!eventName?.trim() || !fromDate || !toDate || !tutorName?.trim()) {
      return false;
    }

    // Check all students have required fields
    const allStudentsValid = students.every(student =>
      student.registerNumber?.trim() &&
      student.name?.trim() &&
      student.semester?.trim()
    );

    // Check if there are any pending students
    const hasPendingStudents = pendingStudents.length > 0;

    return allStudentsValid && !hasPendingStudents;
  }, [eventName, fromDate, toDate, tutorName, students, pendingStudents]);

  // Cancel invitation
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

  // Check for invitation status updates
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
          prev.filter(pending =>
            invitations.some(i =>
              i.registerNumber === pending.registerNumber &&
              i.status === 'pending'
            )
          )
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

  // Popup Component
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

  // RegisterNumberPopup Component
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
  const EventDetails = ({ event, onBack }) => {
    const handleApplyOD = () => {
      const formattedFromDate = event.date.split('T')[0];
      const endDate = new Date(event.date);
      endDate.setDate(endDate.getDate() + 1);
      const formattedToDate = endDate.toISOString().split('T')[0];

      // Set the state directly
      setEventName(event.name || "");
      setVenue(event.venue || "");
      setFromDate(formattedFromDate);
      setToDate(formattedToDate);

      setActiveTab("odRequest");
      setIsViewingEvent(false);
    };



    const handleDownloadBrochure = async () => {
      if (event.filePath) {
        try {
          const response = await fetch(event.filePath);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          const fileExtension = event.filePath.split('.').pop().toLowerCase();
          const cleanEventName = event.name
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();

          link.setAttribute('download', `${cleanEventName}_brochure.${fileExtension}`);
          document.body.appendChild(link);
          link.click();
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

  // Add this custom hook at the top of your component
  const useInputFocus = (initialValue = '') => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    const handleChange = (e) => {
      setValue(e.target.value);
    };

    const focus = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    return {
      value,
      setValue,
      handleChange,
      ref: inputRef,
      focus
    };
  };


  // ODRequestForm Component
  const ODRequestForm = () => {
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const eventNameInput = useInputFocus(eventName);
    const venueInput = useInputFocus(venue);
    const [attendanceData, setAttendanceData] = useState({});
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

    const fetchAttendanceData = async () => {
      try {
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

            // Clean attendance value
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
      }
    };


    useEffect(() => {
      eventNameInput.setValue(eventName);
    }, [eventName]);

    useEffect(() => {
      venueInput.setValue(venue);
    }, [venue]);

    useEffect(() => {
      const loadAttendanceData = async () => {
        setIsLoadingAttendance(true);
        const data = await fetchAttendanceData();
        setAttendanceData(data);
        setIsLoadingAttendance(false);
      };
      loadAttendanceData();
    }, []);

    // Function to render attendance cell with color coding
    const renderAttendanceCell = (participant) => {
      if (isLoadingAttendance) {
        return <div className="text-sm text-gray-500">Loading...</div>;
      }

      const attendance = attendanceData[participant.registerNumber] ||
        participant.attendancePercentage ||
        "N/A";

      // Add color coding based on attendance percentage
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
        <div className={`text-sm ${textColor}`}>
          {attendance}%
        </div>
      );
    };

    // Improved input handling with better structure
    // Replace the handleInputChange function in your ODRequestForm component
    const handleInputChange = (field, value) => {
      switch (field) {
        case "eventName":
          setEventName(value);
          break;
        case "venue":
          setVenue(value);
          break;
        case "fromDate":
          setFromDate(value);
          if (isTwoDays && value) {
            const from = new Date(value);
            const to = new Date(from);
            to.setDate(to.getDate() + 1);
            setToDate(to.toISOString().split('T')[0]);
          }
          break;
        case "toDate":
          setToDate(value);
          break;
        default:
          break;
      }
    };



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
        if (student.registerNumber === currentUser.registerNumber) {
          setPopupMessage("You cannot send an invitation to yourself");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }

        const isAlreadyAdded = students.some(
          s => s.registerNumber === student.registerNumber
        );

        if (isAlreadyAdded) {
          setPopupMessage("Student already added to this request");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }

        const isAlreadyPending = pendingStudents.some(
          s => s.registerNumber === student.registerNumber
        );

        // Check if previously declined (by checking the database)
        const invitationCheck = await axios.get(
          `http://localhost:5000/api/auth/check-invitations`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`
            },
            params: {
              registerNumber: student.registerNumber
            }
          }
        );

        if (isAlreadyPending) {
          setPopupMessage("Invitation already sent to this student");
          setIsSuccess(false);
          setShowPopup(true);
          return;
        }

        setIsProcessing(true);
        setPopupMessage("Sending invitation...");
        setShowPopup(true);

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

    return (
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <div className="flex items-start justify-center mb-8 space-x-4">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwqx4u1x4rWoMbRpO51KZ__P_AvN4k8hRuDg&s"
            alt="College Logo"
            className="w-16 h-16 object-contain -mt-1"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold">PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY</h1>
            <h2 className="text-base">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h2>
            <h2 className="text-lg font-semibold text-gray-600 mt-2">ON-DUTY FORM</h2>
          </div>
        </div>
        <div className="space-y-6">

          {/* Event Name - Fixed */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Event Name *</label>
            <input
              autoFocus
              ref={eventNameInput.ref}
              type="text"
              value={eventNameInput.value}
              onChange={(e) => {
                eventNameInput.handleChange(e);
                setEventName(e.target.value);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter event name"
              required
            />
          </div>

          {/* Dates Section - Fixed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">From Date *</label>
              <input
                type="date"
                value={fromDate || ""}
                onChange={(e) => {
                  const newFromDate = e.target.value;
                  setFromDate(newFromDate);
                  if (isTwoDays && newFromDate) {
                    const from = new Date(newFromDate);
                    const to = new Date(from);
                    to.setDate(to.getDate() + 1);
                    setToDate(to.toISOString().split('T')[0]);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">To Date *</label>
              <input
                type="date"
                value={toDate || ""}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                min={fromDate}
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="twoDays"
                  checked={isTwoDays}
                  onChange={(e) => setIsTwoDays(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="twoDays" className="ml-2 block text-sm text-gray-700">
                  Two-day event (automatically sets To Date)
                </label>
              </div>
            </div>
          </div>

          {/* Days and Tutor - Improved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Number of Days</label>
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                {numberOfDays}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Tutor Name</label>
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                {tutorName}
              </div>
            </div>
          </div>


          {/* Student Details Section - Improved */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Student Details *</h3>
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
                              className={`border-b border-gray-200 ${isAlreadyAdded || isAlreadyPending ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                              <td className="p-2">{student.registerNumber}</td>
                              <td className="p-2">{student.name}</td>
                              <td className="p-2">{student.semester}</td>
                              <td className="p-2">{student.tutorName}</td>
                              <td className="p-2">
                                <button
                                  onClick={() => !isAlreadyAdded && !isAlreadyPending && selectStudent(student)}
                                  className={`px-2 py-1 rounded ${student.tutorName === currentUser.tutorName &&
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

            {/* Current Students Table - Improved */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Register No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span>Attendance %</span>
                        <div
                          className="ml-1 cursor-help"
                          data-tooltip-id="attendance-tooltip"
                          data-tooltip-content="Attendance data fetched from college records"
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                        </div>
                        <Tooltip id="attendance-tooltip" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.registerNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.semester}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderAttendanceCell(student)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index > 0 && !student.isRequester && (
                          <button
                            onClick={() => {
                              setStudents(prev => prev.filter((_, i) => i !== index));
                              if (student.invitationId) {
                                cancelInvitation(student.invitationId);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
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
                <h4 className="text-lg font-medium text-gray-700 mb-3">Pending Invitations
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Must be resolved before submission
                  </span>
                </h4>
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

          {/* Submit Button - Improved */}
          <div className="flex justify-end mt-8">
            {pendingStudents.length > 0 ? (
              <div
                className="relative"
                data-tooltip-id="pending-tooltip"
                data-tooltip-content="Cannot submit while invitations are pending"
              >
                <button
                  disabled
                  className="px-8 py-3 rounded-lg bg-gray-400 text-white font-medium cursor-not-allowed"
                >
                  Submit Request
                </button>
                <Tooltip id="pending-tooltip" />
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || isProcessing}
                className={`px-8 py-3 rounded-lg text-white font-medium ${isFormValid()
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
                  } transition-colors`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Request"
                )}
              </button>
            )}
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
            <FileText className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">OD Form</span>}
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
            <ODRequestForm />
          ) : activeTab === "odHistory" ? (
            <OdHistory
              odHistory={odHistory}
              currentUser={currentUser}
              generateODPDF={generateODPDF}  // Add this line
            />
          ) : null}
        </main>
      </div>
      {showPopup && (
        <Popup
          message={popupMessage}
          isSuccess={isSuccess}
          onClose={() => setShowPopup(false)}
          isProcessing={isGeneratingPDF || isProcessing}
        />
      )}
    </div>
  );
};

export default UserDashBoard;