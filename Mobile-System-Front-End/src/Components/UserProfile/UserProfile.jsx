import React from 'react';
import './UserProfile.css';

const UserProfile = ({ className = '', showEmail = true, showRole = false, size = 'medium' }) => {
  // Get user information from localStorage
  const userName = localStorage.getItem('name') || 'Guest User';
  const userEmail = localStorage.getItem('email') || 'guest@mobilesystem.com';
  const userRole = localStorage.getItem('role') || 'customer';

  const getInitials = (name) => {
    if (!name || name === 'Guest User') return 'G';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'user-profile-small';
      case 'large': return 'user-profile-large';
      default: return 'user-profile-medium';
    }
  };

  return (
    <div className={`user-profile ${getSizeClass()} ${className}`}>
      <div className="user-profile-avatar">
        <span className="avatar-text">{getInitials(userName)}</span>
      </div>
      <div className="user-profile-info">
        <div className="user-profile-name">{userName}</div>
        {showEmail && (
          <div className="user-profile-email">{userEmail}</div>
        )}
        {showRole && (
          <div className="user-profile-role">{userRole}</div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
