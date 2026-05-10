import React, { useEffect, useState } from "react";
import "./Adminlogin.css";
import { useNavigate, useLocation } from "react-router-dom";
import cross_icon from "../../../Assets/cross_icon.png";
import { setAdminSession } from "../../../utils/authSession";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateBtn, setAnimateBtn] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("highlight") === "1") {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnimateBtn(true);
    setTimeout(() => setAnimateBtn(false), 400);

    try {
      const response = await fetch("${API_BASE_URL}/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setAdminSession(data.admin);
        navigate("/admin/dashboard");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup" style={{ backgroundColor: "white" }}>
      <form onSubmit={handleSubmit} className={`login-popup-container ${highlight ? "admin-highlight" : ""}`}>
        <div className="login-popup-title">
          <h2>Admin Login</h2>
          <img onClick={() => navigate("/")} src={cross_icon} alt="" />
        </div>
        <div className="login-popup-input">
          <input
            name="email"
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={animateBtn ? "popup-btn" : ""} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        {/* <p>
          Not an admin? <span onClick={() => navigate("/")}>Go to Home</span>
        </p> */}
      </form>
    </div>
  );
};

export default AdminLogin;
