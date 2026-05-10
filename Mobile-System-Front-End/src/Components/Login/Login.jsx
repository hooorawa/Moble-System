// src/Components/Login/Login.jsx
import React, { useState } from "react";
import "./Login.css";
import cross_icon from "../../Assets/cross_icon.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setCustomerSession, setAdminSession } from "../../utils/authSession";

import { SERVER_URL } from '../../config';

const url = SERVER_URL;

const Login = ({ SetShowLogin, initialMode = 'signin' }) => {
  const [CurrState, setCurrState] = useState(initialMode === 'signup' ? "Sign Up" : "Login"); // Sign Up or Login
  const [animateBtn, setAnimateBtn] = useState(false);
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((d) => ({ ...d, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();

    let newUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    if (CurrState === "Login") {
      newUrl += "/api/customer/login";
    } else {
      newUrl += "/api/customer/register";
    }

    setAnimateBtn(true);
    setTimeout(() => setAnimateBtn(false), 400);

    try {
      const response = await axios.post(newUrl, data, { withCredentials: true });
      if (response.data.success) {
        // Check if it's an admin login
        if (response.data.role === 'admin') {
          // Set admin session
          setAdminSession(response.data.admin);
          SetShowLogin(false, 'signin');
          alert("Admin login successful!");
          // Redirect to admin dashboard
          navigate("/admin/dashboard");
        } else {
          // Set customer session
          setCustomerSession({
            token: response.data.token,
            role: response.data.role || "customer",
            name: response.data.name || data.name,
            email: response.data.email || data.email
          });
          
          SetShowLogin(false, 'signin');
          alert(`Successfully ${CurrState === "Login" ? "logged in" : "registered"}!`);
        }
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Server error";
      const failedUrl = error.config?.url || newUrl;
      alert(`${errorMsg}\n\nFailed to reach: ${failedUrl}\n\nPlease check if your Backend URL is correct in Netlify settings.`);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{CurrState}</h2>
          <img onClick={() => SetShowLogin(false, 'signin')} src={cross_icon} alt="" />
        </div>
        <div className="login-popup-input">
          {CurrState === "Login" ? null : (
            <>
              <input
                name="name"
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                placeholder="Your Name"
                required
              />
            </>
          )}
          <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Your Email" required />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Your Password"
            required
          />
        </div>
        <button type="submit" className={animateBtn ? "popup-btn" : ""}>
          {CurrState === "Sign Up" ? "Create account" : "Login"}
        </button>
        {/* Policy agreement removed to allow login without ticking */}
        {CurrState === "Login" ? (
          <p>
            Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account? <span onClick={() => setCurrState("Login")}>Login </span>
          </p>
        )}
      </form>
    </div>
  );
};

export default Login;
