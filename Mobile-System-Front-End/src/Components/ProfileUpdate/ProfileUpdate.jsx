import React, { useState, useEffect } from 'react';
import S3ImageUpload from '../S3ImageUpload/S3ImageUpload';
import S3ImageDisplay from '../S3ImageDisplay/S3ImageDisplay';
import axios from 'axios';
import './ProfileUpdate.css';

const ProfileUpdate = ({ user, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
      setProfilePicture(user.profilePicture || null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (uploadResult) => {
    console.log('Image upload successful:', uploadResult);
    setProfilePicture(uploadResult.fileUrl);
    setError('');
  };

  const handleImageUploadError = (error) => {
    console.error('Image upload error:', error);
    setError('Failed to upload image. Please try again.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('/api/customer/update-profile', {
        name: formData.name,
        profilePicture: profilePicture
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setMessage('Profile updated successfully!');
        onProfileUpdate?.(response.data.customer);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-update">
      <h2>Update Profile</h2>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="disabled-input"
          />
          <small>Email cannot be changed</small>
        </div>

        <div className="form-group">
          <label>Profile Picture</label>
          <div className="image-upload-section">
            {profilePicture && (
              <div className="current-image">
                <S3ImageDisplay
                  src={profilePicture}
                  alt="Current profile picture"
                  className="profile-image-preview"
                />
              </div>
            )}
            
            <S3ImageUpload
              onUploadSuccess={handleImageUpload}
              onUploadError={handleImageUploadError}
              userId={user?._id}
              userRole="customers"
              maxSize={5 * 1024 * 1024}
              className="profile-upload"
            />
          </div>
        </div>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdate;

