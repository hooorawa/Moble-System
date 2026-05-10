import { API_BASE_URL } from './../../../../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import hideIcon from '../../../../Assets/hide.png';
import './ChangePassword.css';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userEmail = localStorage.getItem('email');
    const userToken = localStorage.getItem('token');
    
    if (!userEmail || !userToken) {
      setError('Please login to change your password.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        API_BASE_URL + 'api') + 'customer/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccess('Password changed successfully!');
        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Redirect to profile after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized') || error.response?.data?.message?.includes('Invalid or expired token')) {
        setError('Your session has expired. Please login again.');
        // Clear user data and redirect to login
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setError(error.response?.data?.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: 'Weak', color: '#dc3545' };
    if (password.length < 8) return { strength: 2, text: 'Fair', color: '#ffc107' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 4, text: 'Strong', color: '#28a745' };
    }
    return { strength: 3, text: 'Good', color: '#17a2b8' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="change-password-container">
      <div className="change-password-header">
        <h1>Change Password</h1>
        <p>Update your account password for better security</p>
      </div>

      <div className="change-password-content">
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('current')}
              >
                <img 
                  src={hideIcon} 
                  alt={showPasswords.current ? 'Hide password' : 'Show password'} 
                  className="password-toggle-icon"
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('new')}
              >
                <img 
                  src={hideIcon} 
                  alt={showPasswords.new ? 'Hide password' : 'Show password'} 
                  className="password-toggle-icon"
                />
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.strength / 4) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
            
            <div className="password-requirements">
              <p>Password requirements:</p>
              <ul>
                <li className={formData.newPassword.length >= 8 ? 'valid' : 'invalid'}>
                  At least 8 characters
                </li>
                <li className={formData.newPassword !== formData.currentPassword && formData.newPassword ? 'valid' : 'invalid'}>
                  Different from current password
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                <img 
                  src={hideIcon} 
                  alt={showPasswords.confirm ? 'Hide password' : 'Show password'} 
                  className="password-toggle-icon"
                />
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="password-match">
                {formData.newPassword === formData.confirmPassword ? (
                  <span className="match-success"> Passwords match</span>
                ) : (
                  <span className="match-error"> Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-message">
              <span> {success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
