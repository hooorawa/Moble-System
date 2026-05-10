import React, { useEffect, useState } from "react";
import "./AdminAttendanceList.css";

const ATTENDANCE_STORAGE_KEY = "adminAttendanceRecords";

const AdminAttendanceList = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY) || "[]");
    setRecords(stored);
  }, []);

  const clearAllRecords = () => {
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    setRecords([]);
  };

  return (
    <div className="admin-attendance-list-page">
      <div className="attendance-list-header">
        <h2>Attendance List</h2>
        {records.length > 0 && (
          <button className="attendance-clear-btn" onClick={clearAllRecords}>
            Clear All
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="attendance-empty-state">
          No attendance records yet. Mark attendance from the Attendance section.
        </div>
      ) : (
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Note</th>
                <th>Marked At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.employeeName}</td>
                  <td>{record.attendanceDate}</td>
                  <td>{record.status}</td>
                  <td>{record.note || "-"}</td>
                  <td>{new Date(record.markedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceList;
