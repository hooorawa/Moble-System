import { SERVER_URL } from './../../../../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user information from localStorage
    const userName = localStorage.getItem('name') || 'Guest User';
    const userEmail = localStorage.getItem('email') || 'guest@mobilesystem.com';
    const userRole = localStorage.getItem('role') || 'customer';
    const userProfilePicture = localStorage.getItem('profilePicture') || '';

    setUser({
      name: userName,
      email: userEmail,
      role: userRole,
      profilePicture: userProfilePicture
    });
    setLoading(false);
  }, []);

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleChangePassword = () => {
    navigate('/profile/change-password');
  };

  const getInitials = (name) => {
    if (!name || name === 'Guest User') return 'G';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user.profilePicture ? (
                <img 
                  src={`${SERVER_URL}${user.profilePicture}`} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <span className="avatar-text">{getInitials(user.name)}</span>
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-email">{user.email}</p>
              <span className="profile-role">{user.role}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="profile-action-btn primary"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
            <button 
              className="profile-action-btn secondary"
              onClick={handleChangePassword}
            >
              Change Password
            </button>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h3>Account Information</h3>
            <div className="detail-item">
              <label>Full Name:</label>
              <span>{user.name}</span>
            </div>
            <div className="detail-item">
              <label>Email Address:</label>
              <span>{user.email}</span>
            </div>
            <div className="detail-item">
              <label>Account Type:</label>
              <span className="role-badge">{user.role}</span>
            </div>
            <div className="detail-item">
              <label>Member Since:</label>
              <span>Recently joined</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/orders')}
              >
                View My Orders
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/account/address')}
              >
                Manage Addresses
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/cart')}
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
