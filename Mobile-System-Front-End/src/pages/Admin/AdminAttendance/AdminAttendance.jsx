import { API_BASE_URL } from './../../../config';
import React, { useMemo, useState, useEffect } from "react";
import "./AdminAttendance.css";

const ATTENDANCE_STORAGE_KEY = "adminAttendanceRecords";

const attendanceStatusOptions = ["Present", "Absent", "Late", "Half Day"];

const AdminAttendance = () => {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [status, setStatus] = useState("Present");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setEmployeeError("");
      const response = await fetch(`${API_BASE_URL}/employer/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      const contentType = response.headers.get("Content-Type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const employeeList = (data.employers || []).map((emp) => emp.name).filter(Boolean);
        setEmployees(employeeList);
        if (employeeList.length > 0) {
          setEmployeeName(employeeList[0]);
        }
      } else {
        console.error("Failed to fetch employees or invalid response format");
        const errorText = await response.text();
        console.error("Response body:", errorText);
        setEmployeeError("Failed to fetch employees");
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployeeError("Error loading employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newRecord = {
      id: Date.now(),
      employeeName,
      attendanceDate,
      status,
      note: note.trim(),
      markedAt: new Date().toISOString()
    };

    const existingRecords = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY) || "[]");
    existingRecords.unshift(newRecord);
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(existingRecords));

    setNote("");
    setMessage(`Attendance marked for ${employeeName}.`);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  return (
    <div className="admin-attendance-page">
      <div className="admin-attendance-card">
        <h2>Mark Employee Attendance</h2>
        <p className="attendance-subtitle">Record daily attendance for your employees.</p>

        {employeeError && <div className="attendance-error-message">{employeeError}</div>}

        {loading ? (
          <div className="attendance-loading">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="attendance-error-message">No employees found. Please add employees first.</div>
        ) : (
          <form onSubmit={handleSubmit} className="attendance-form">
            <div className="attendance-field">
              <label htmlFor="employeeName">Employee</label>
              <select
                id="employeeName"
                value={employeeName}
                onChange={(event) => setEmployeeName(event.target.value)}
              >
                {employees.map((employee) => (
                  <option key={employee} value={employee}>
                    {employee}
                  </option>
                ))}
              </select>
            </div>

            <div className="attendance-field">
              <label htmlFor="attendanceDate">Date</label>
              <input
                id="attendanceDate"
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                required
              />
            </div>

            <div className="attendance-field">
              <label htmlFor="attendanceStatus">Status</label>
              <select
                id="attendanceStatus"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {attendanceStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="attendance-field">
              <label htmlFor="attendanceNote">Note (optional)</label>
              <textarea
                id="attendanceNote"
                rows="3"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a short remark"
              />
            </div>

            <button type="submit" className="attendance-submit-btn">
              Mark Attendance
            </button>
          </form>
        )}

        {message && <div className="attendance-success-message">{message}</div>}
      </div>
    </div>
  );
};

export default AdminAttendance;
