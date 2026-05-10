import { API_BASE_URL } from './../../../../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddressBook.css';

const AddressBook = () => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phoneNumber: '',
    postalCode: ''
  });

  // Fetch addresses 
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(API_BASE_URL + '/address/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched addresses data:', data);
        setAddresses(data.addresses || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch addresses:', errorData);
        
        // Check if it's an authentication error
        if (response.status === 401 || errorData.message?.includes('Not Authorized') || errorData.message?.includes('Invalid or expired token')) {
          alert('Your session has expired. Please login again.');
          // Clear user data and redirect to login
          localStorage.clear();
          window.location.href = '/login';
        } else {
          setAddresses([]);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city || !formData.phoneNumber || !formData.postalCode) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      const addressData = {
        ...formData
      };
      
      let url = API_BASE_URL + '/address/add';
      let method = 'POST';
      
      // If editing, use update endpoint
      if (editingAddress) {
        url = `${API_BASE_URL}/address/update/${editingAddress._id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(addressData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Added/Updated address data:', data);
        
        if (editingAddress) {
          // Update existing address in the list
          setAddresses(prev => prev.map(addr => 
            addr._id === editingAddress._id ? data.address : addr
          ));
          alert('Address updated successfully!');
        } else {
          // Add new address to the list
          setAddresses(prev => [...prev, data.address]);
          alert('Address added successfully!');
        }
        
        setFormData({
          name: '',
          address: '',
          city: '',
          phoneNumber: '',
          postalCode: ''
        });
        setShowAddForm(false);
        setEditingAddress(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to add address:', errorData);
        
        // Check if it's an authentication error
        if (response.status === 401 || errorData.message?.includes('Not Authorized') || errorData.message?.includes('Invalid or expired token')) {
          alert('Your session has expired. Please login again.');
          // Clear user data and redirect to login
          localStorage.clear();
          window.location.href = '/login';
        } else {
          alert(errorData.message || 'Failed to add address');
        }
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Error adding address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      phoneNumber: '',
      postalCode: ''
    });
    setShowAddForm(false);
    setEditingAddress(null);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city,
      phoneNumber: address.phoneNumber,
      postalCode: address.postalCode
    });
    setShowAddForm(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/address/delete/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Deleted address:', data);
        setAddresses(prev => prev.filter(addr => addr._id !== addressId));
        alert('Address deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete address:', errorData);
        
        // Check if it's an authentication error
        if (response.status === 401 || errorData.message?.includes('Not Authorized') || errorData.message?.includes('Invalid or expired token')) {
          alert('Your session has expired. Please login again.');
          // Clear user data and redirect to login
          localStorage.clear();
          window.location.href = '/login';
        } else {
          alert('Failed to delete address: ' + (errorData.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error deleting address. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="address-book">
      <div className="address-book-container">
        <div className="address-book-header">
          <h1>Address Book</h1>
          <button 
            className="add-address-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add Address
          </button>
        </div>

        {showAddForm && (
          <div className="add-address-form-container">
            <div className="add-address-form">
              <div className="form-header">
                <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                <button 
                  className="close-form-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="address-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="postalCode">Postal Code </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Enter postal code"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? (editingAddress ? 'Updating...' : 'Adding...') : (editingAddress ? 'Update Address' : 'Add Address')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="addresses-list">
          <h2>Your Addresses ({addresses.length})</h2>
          
          {loading && addresses.length === 0 ? (
            <div className="loading">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="no-addresses">
              <p>No addresses found. Add your first address above.</p>
            </div>
          ) : (
            <div className="addresses-grid">
              {addresses.map((address, index) => {
                console.log('Rendering address:', address, 'at index:', index);
                return (
                  <div key={address._id || index} className="address-card">
                    <div className="address-header">
                      <h3>{address?.name || 'No Name'}</h3>
                      <span className="address-type">Default</span>
                    </div>
                    
                    <div className="address-details">
                      <p className="address-line">{address?.address || 'No Address'}</p>
                      <p className="address-line">{address?.city || 'No City'}, {address?.postalCode || 'No Postal Code'}</p>
                      <p className="address-line">Phone: {address?.phoneNumber || 'No Phone'}</p>
                    </div>
                    
                  <div className="address-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(address)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(address._id)}
                    >
                      Delete
                    </button>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressBook;
