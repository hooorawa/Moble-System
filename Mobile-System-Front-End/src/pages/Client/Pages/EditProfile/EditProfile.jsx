import { API_BASE_URL } from './../../../../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditProfile.css';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userEmail = localStorage.getItem('email');
    const userToken = localStorage.getItem('token');
    
    if (!userEmail || !userToken) {
      setError('Please login to edit your profile.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    // Get current user data from localStorage
    const currentName = localStorage.getItem('name') || '';
    
    setFormData({
      name: currentName
    });
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate name is not empty
    if (!formData.name || formData.name.trim() === '') {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    try {
      // Create FormData to handle both name and profile picture
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      const response = await axios.post(
        API_BASE_URL + '/customer/update-profile',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        // Update localStorage with new data
        localStorage.setItem('name', formData.name);
        
        // Update profile picture URL if it was changed
        if (response.data.customer.profilePicture) {
          localStorage.setItem('profilePicture', response.data.customer.profilePicture);
        }
        
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized') || error.response?.data?.message?.includes('Invalid or expired token')) {
        setError('Your session has expired. Please login again.');
        // Clear user data and redirect to login
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h1>Edit Profile</h1>
        <p>Update your personal information</p>
      </div>

      <div className="edit-profile-content">
        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <h3>Profile Picture</h3>
            <div className="profile-picture-upload">
              <div className="current-avatar">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="avatar-preview" />
                ) : (
                  <div className="avatar-placeholder">
                    <span className="avatar-text">{getInitials(formData.name)}</span>
                  </div>
                )}
              </div>
              <div className="upload-controls">
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                <label htmlFor="profilePicture" className="upload-btn">
                  Choose New Picture
                </label>
                <p className="upload-hint">JPG, PNG, GIF or WebP. Max size 5MB.</p>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="personal-info-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="error-message">
              <span>❌ {error}</span>
            </div>
          )}

          {success && (
            <div className="success-message">
              <span>✅ {success}</span>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
