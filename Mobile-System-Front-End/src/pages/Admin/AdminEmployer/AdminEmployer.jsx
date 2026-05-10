import React, { useState, useEffect } from 'react';
import './AdminEmployer.css';
import employer_icon from '../../../Assets/employee.png';
import { isAdminSessionActive } from '../../../utils/authSession';

const DEFAULT_PERMISSIONS = {
  categories: false,
  brands: false,
  variations: false,
  products: false,
  stock: false,
  orders: false,
  paymentRecords: false,
  billingInvoice: false,
  cardReload: false,
  employers: false,
  attendance: false,
  attendanceList: false,
  services: false,
  supplies: false
};

const PERMISSION_OPTIONS = [
  { key: 'categories', label: 'Categories' },
  { key: 'brands', label: 'Brands' },
  { key: 'variations', label: 'Variations' },
  { key: 'products', label: 'Products' },
  { key: 'stock', label: 'Stock Management' },
  { key: 'orders', label: 'Orders' },
  { key: 'paymentRecords', label: 'Payment Records' },
  { key: 'billingInvoice', label: 'Billing & Invoice' },
  { key: 'cardReload', label: 'Card and Reload' },
  { key: 'employers', label: 'Employers' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'attendanceList', label: 'Attendance List' },
  { key: 'services', label: 'Services' },
  { key: 'supplies', label: 'Supplies' }
];

const AdminEmployer = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [employerName, setEmployerName] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPassword, setEmployerPassword] = useState('');
  const [employerRole, setEmployerRole] = useState('cashier');
  const [updateEmployerName, setUpdateEmployerName] = useState('');
  const [updateEmployerEmail, setUpdateEmployerEmail] = useState('');
  const [updateEmployerPassword, setUpdateEmployerPassword] = useState('');
  const [updateEmployerRole, setUpdateEmployerRole] = useState('cashier');
  const [editingEmployer, setEditingEmployer] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // Fetch employers on component mount
  useEffect(() => {
    fetchEmployers();
    fetchRoles();
    // Get current user info
    const adminData = localStorage.getItem("admin");
    if (adminData && isAdminSessionActive()) {
      setCurrentUser(JSON.parse(adminData));
    } else {
      setCurrentUser(null);
    }
  }, []);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employer/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Fetched employers:', data);

        const validEmployers = (data.employers || []).filter(employer => 
          employer && 
          employer._id && 
          typeof employer === 'object'
        );

        console.log('Valid employers after filtering:', validEmployers);
        setEmployers(validEmployers);
      } else {
        console.error('Failed to fetch employers or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setEmployers([]);
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/role/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const contentType = response.headers.get('Content-Type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Fetched roles:', data);
        setAvailableRoles(data.roles || []);
      } else {
        console.error('Failed to fetch roles or invalid response format');
        const errorText = await response.text();
        console.error('Response body:', errorText);
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setAvailableRoles([]);
    }
  };

  const handleAddEmployer = async (e) => {
    e.preventDefault();
    
    if (!employerName.trim() || !employerEmail.trim() || !employerPassword.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employer/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          name: employerName.trim(),
          email: employerEmail.trim(),
          password: employerPassword.trim(),
          role: employerRole
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Added employer:', data);
        setEmployers(prev => [...prev, data.employer]);
        setEmployerName('');
        setEmployerEmail('');
        setEmployerPassword('');
        setEmployerRole('cashier');
        setShowAddForm(false);
        setErrorMessage('');
        alert('Employer added successfully!');
      } else {
        console.log('Error response:', data);
        setErrorMessage(data.message || 'Failed to add employer');
      }
    } catch (error) {
      console.error('Error adding employer:', error);
      setErrorMessage('Error adding employer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployer = async (employerId) => {
    if (!window.confirm('Are you sure you want to delete this employer?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employer/delete/${employerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Deleted employer:', data);
        setEmployers(prev => prev.filter(emp => emp.id !== employerId));
        alert('Employer deleted successfully!');
      } else {
        console.log('Delete failed:', data);
        alert(data.message || 'Failed to delete employer');
      }
    } catch (error) {
      console.error('Error deleting employer:', error);
      alert('Error deleting employer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployer = async (e) => {
    e.preventDefault();
    
    if (!updateEmployerName.trim() || !updateEmployerEmail.trim()) {
      setErrorMessage('Please fill in name and email');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const updateData = {
        name: updateEmployerName.trim(),
        email: updateEmployerEmail.trim(),
        role: updateEmployerRole
      };

      // Only include password if it's provided
      if (updateEmployerPassword.trim()) {
        updateData.password = updateEmployerPassword.trim();
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employer/update/${editingEmployer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setEmployers(prev => prev.map(emp => 
          emp._id === editingEmployer._id ? data.employer : emp
        ));
        setUpdateEmployerName('');
        setUpdateEmployerEmail('');
        setUpdateEmployerPassword('');
        setUpdateEmployerRole('cashier');
        setShowUpdateForm(false);
        setEditingEmployer(null);
        setErrorMessage('');
        alert('Employer updated successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to update employer');
      }
    } catch (error) {
      console.error('Error updating employer:', error);
      setErrorMessage('Error updating employer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployer = (employer) => {
    setEditingEmployer(employer);
    setUpdateEmployerName(employer.name);
    setUpdateEmployerEmail(employer.email);
    setUpdateEmployerPassword('');
    setUpdateEmployerRole(employer.role);
    setShowUpdateForm(true);
    setErrorMessage('');
  };

  const handleCancelUpdate = () => {
    setUpdateEmployerName('');
    setUpdateEmployerEmail('');
    setUpdateEmployerPassword('');
    setUpdateEmployerRole('cashier');
    setShowUpdateForm(false);
    setEditingEmployer(null);
    setErrorMessage('');
  };

  const handleCancel = () => {
    setEmployerName('');
    setEmployerEmail('');
    setEmployerPassword('');
    setEmployerRole('cashier');
    setShowAddForm(false);
    setErrorMessage('');
  };

  // Filter employers based on search term
  const filteredEmployers = employers.filter(employer =>
    employer.name && employer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug: Log available roles
  console.log('Available roles:', availableRoles);

  // Handle adding new role
  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      alert('Please enter a role name');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/role/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newRoleName.trim(),
          displayName: newRoleName.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh roles list
        await fetchRoles();
        setEmployerRole(data.role.name); // Set the new role as selected
        setNewRoleName('');
        setShowAddRoleForm(false);
        alert('Role added successfully!');
      } else {
        alert(data.message || 'Failed to add role');
      }
    } catch (error) {
      console.error('Error adding role:', error);
      alert('Error adding role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection change
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    if (selectedRole === 'add_new') {
      setShowAddRoleForm(true);
      setNewRoleName('');
    } else {
      setEmployerRole(selectedRole);
      setShowAddRoleForm(false);
    }
  };

  // Handle update role selection change
  const handleUpdateRoleChange = (e) => {
    const selectedRole = e.target.value;
    if (selectedRole === 'add_new') {
      setShowAddRoleForm(true);
      setNewRoleName('');
    } else {
      setUpdateEmployerRole(selectedRole);
      setShowAddRoleForm(false);
    }
  };

  // Cancel add role
  const handleCancelAddRole = () => {
    setShowAddRoleForm(false);
    setNewRoleName('');
  };

  // Handle deleting a role
  const handleDeleteRole = async (roleToDelete) => {
    if (window.confirm(`Are you sure you want to delete the role "${roleToDelete}"? This will affect any employers with this role.`)) {
      try {
        setLoading(true);
        
        // Find the role ID
        const role = availableRoles.find(r => r.name === roleToDelete);
        if (!role) {
          alert('Role not found');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/role/delete/${role._id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Refresh roles list
          await fetchRoles();
          
          // If the deleted role was selected, reset to first available role
          if (employerRole === roleToDelete) {
            const remainingRoles = availableRoles.filter(r => r.name !== roleToDelete);
            setEmployerRole(remainingRoles.length > 0 ? remainingRoles[0].name : 'cashier');
          }
          if (updateEmployerRole === roleToDelete) {
            const remainingRoles = availableRoles.filter(r => r.name !== roleToDelete);
            setUpdateEmployerRole(remainingRoles.length > 0 ? remainingRoles[0].name : 'cashier');
          }
          
          alert(`Role "${roleToDelete}" has been deleted successfully!`);
        } else {
          alert(data.message || 'Failed to delete role');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        alert('Error deleting role. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenPermissions = (employer) => {
    setSelectedEmployer(employer);
    setPermissions({
      ...DEFAULT_PERMISSIONS,
      ...(employer.permissions || {})
    });
    setShowPermissionModal(true);
    setErrorMessage('');
  };

  const handleClosePermissions = () => {
    setShowPermissionModal(false);
    setSelectedEmployer(null);
    setPermissions(DEFAULT_PERMISSIONS);
    setErrorMessage('');
  };

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employer/permissions/${selectedEmployer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ permissions })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update the employer in the list
        setEmployers(prev => prev.map(emp => 
          emp._id === selectedEmployer._id ? data.employer : emp
        ));
        setShowPermissionModal(false);
        setSelectedEmployer(null);
        alert('Permissions updated successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setErrorMessage('Error updating permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-employer-page">
      <div className="admin-employer-container">
        <div className="admin-employer-header">
          <div className="admin-employer-title-section">
            <img src={employer_icon} alt="Employer" className="admin-employer-header-icon" />
            <h1>Employer Management</h1>
          </div>
          {currentUser && currentUser.type === 'admin' && (
            <button 
              className="admin-employer-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              Add Employer
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="admin-employer-form-container">
            <div className="admin-employer-form">
              <div className="admin-employer-form-header">
                <h2>Add New Employer</h2>
                <button 
                  className="admin-employer-close-form-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddEmployer} className="admin-employer-form">
                {errorMessage && (
                  <div className="admin-employer-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-employer-form-group">
                  <label htmlFor="employerName">Name</label>
                  <input
                    type="text"
                    id="employerName"
                    value={employerName}
                    onChange={(e) => {
                      setEmployerName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter employer name"
                    required
                  />
                </div>

                <div className="admin-employer-form-group">
                  <label htmlFor="employerEmail">Email</label>
                  <input
                    type="email"
                    id="employerEmail"
                    value={employerEmail}
                    onChange={(e) => {
                      setEmployerEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter employer email"
                    required
                  />
                </div>

                <div className="admin-employer-form-group">
                  <label htmlFor="employerPassword">Password</label>
                  <input
                    type="password"
                    id="employerPassword"
                    value={employerPassword}
                    onChange={(e) => {
                      setEmployerPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="admin-employer-form-group">
                  <label htmlFor="employerRole">Role</label>
                  <div className="admin-employer-role-selector">
                     <select
                       id="employerRole"
                       value={employerRole}
                       onChange={handleRoleChange}
                       required
                     >
                       {availableRoles.length > 0 ? (
                         availableRoles.map((role) => (
                           <option key={role._id} value={role.name}>
                             {role.displayName}
                           </option>
                         ))
                       ) : (
                         <>
                           <option value="cashier">Cashier</option>
                           <option value="manager">Manager</option>
                         </>
                       )}
                       <option value="add_new">+ Add New Role</option>
                     </select>
                    
                    {/* Show delete button for custom roles (not default ones) */}
                    {employerRole && availableRoles.find(r => r.name === employerRole && !r.isDefault) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(employerRole)}
                        className="admin-employer-delete-role-btn"
                        title={`Delete role "${employerRole}"`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {showAddRoleForm && (
                    <div className="admin-employer-add-role-form">
                      <div className="admin-employer-add-role-input-group">
                        <input
                          type="text"
                          placeholder="Enter new role name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="admin-employer-new-role-input"
                        />
                        <div className="admin-employer-add-role-actions">
                          <button
                            type="button"
                            onClick={handleAddRole}
                            className="admin-employer-confirm-role-btn"
                            disabled={!newRoleName.trim() || availableRoles.some(r => r.name === newRoleName.toLowerCase())}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAddRole}
                            className="admin-employer-cancel-role-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="admin-employer-form-actions">
                  <button 
                    type="button" 
                    className="admin-employer-cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-employer-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Employer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpdateForm && (
          <div className="admin-employer-form-container">
            <div className="admin-employer-form">
              <div className="admin-employer-form-header">
                <h2>Update Employer</h2>
                <button 
                  className="admin-employer-close-form-btn"
                  onClick={handleCancelUpdate}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateEmployer} className="admin-employer-form">
                {errorMessage && (
                  <div className="admin-employer-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-employer-form-group">
                  <label htmlFor="updateEmployerName">Name</label>
                  <input
                    type="text"
                    id="updateEmployerName"
                    value={updateEmployerName}
                    onChange={(e) => {
                      setUpdateEmployerName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter employer name"
                    required
                  />
                </div>

                <div className="admin-employer-form-group">
                  <label htmlFor="updateEmployerEmail">Email</label>
                  <input
                    type="email"
                    id="updateEmployerEmail"
                    value={updateEmployerEmail}
                    onChange={(e) => {
                      setUpdateEmployerEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter employer email"
                    required
                  />
                </div>

                <div className="admin-employer-form-group">
                  <label htmlFor="updateEmployerPassword">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    id="updateEmployerPassword"
                    value={updateEmployerPassword}
                    onChange={(e) => {
                      setUpdateEmployerPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="admin-employer-form-group">
                  <label htmlFor="updateEmployerRole">Role</label>
                  <div className="admin-employer-role-selector">
                     <select
                       id="updateEmployerRole"
                       value={updateEmployerRole}
                       onChange={handleUpdateRoleChange}
                       required
                     >
                       {availableRoles.length > 0 ? (
                         availableRoles.map((role) => (
                           <option key={role._id} value={role.name}>
                             {role.displayName}
                           </option>
                         ))
                       ) : (
                         <>
                           <option value="cashier">Cashier</option>
                           <option value="manager">Manager</option>
                         </>
                       )}
                       <option value="add_new">+ Add New Role</option>
                     </select>
                    
                    {/* Show delete button for custom roles (not default ones) */}
                    {updateEmployerRole && availableRoles.find(r => r.name === updateEmployerRole && !r.isDefault) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(updateEmployerRole)}
                        className="admin-employer-delete-role-btn"
                        title={`Delete role "${updateEmployerRole}"`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {showAddRoleForm && (
                    <div className="admin-employer-add-role-form">
                      <div className="admin-employer-add-role-input-group">
                        <input
                          type="text"
                          placeholder="Enter new role name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="admin-employer-new-role-input"
                        />
                        <div className="admin-employer-add-role-actions">
                          <button
                            type="button"
                            onClick={handleAddRole}
                            className="admin-employer-confirm-role-btn"
                            disabled={!newRoleName.trim() || availableRoles.some(r => r.name === newRoleName.toLowerCase())}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAddRole}
                            className="admin-employer-cancel-role-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="admin-employer-form-actions">
                  <button 
                    type="button" 
                    className="admin-employer-cancel-btn"
                    onClick={handleCancelUpdate}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-employer-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Employer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPermissionModal && (
          <div className="admin-employer-form-container">
            <div className="admin-employer-form">
              <div className="admin-employer-form-header">
                <h2>Manage Permissions - {selectedEmployer?.name}</h2>
                <button 
                  className="admin-employer-close-form-btn"
                  onClick={handleClosePermissions}
                >
                  ×
                </button>
              </div>
              
              <div className="admin-employer-permissions-content">
                {errorMessage && (
                  <div className="admin-employer-error-message">
                    {errorMessage}
                  </div>
                )}
                
                <div className="admin-employer-permissions-list">
                  <h3>Select sections this employer can access:</h3>

                  {PERMISSION_OPTIONS.map((option) => (
                    <div className="admin-employer-permission-item" key={option.key}>
                      <label className="admin-employer-permission-label">
                        <input
                          type="checkbox"
                          checked={permissions[option.key]}
                          onChange={() => handlePermissionChange(option.key)}
                        />
                        <span className="admin-employer-permission-text">{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="admin-employer-form-actions">
                  <button 
                    type="button" 
                    className="admin-employer-cancel-btn"
                    onClick={handleClosePermissions}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="admin-employer-submit-btn"
                    onClick={handleSavePermissions}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="admin-employer-employers-list">
          <div className="admin-employer-search-section">
            <h2>Employers ({filteredEmployers.length})</h2>
            <div className="admin-employer-search-container">
              <input
                type="text"
                placeholder="Search employers by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-employer-search-input"
              />
            </div>
          </div>
          
          {loading && employers.length === 0 ? (
            <div className="admin-employer-loading">Loading employers...</div>
          ) : filteredEmployers.length === 0 ? (
            <div className="admin-employer-no-employers">
              <p>{searchTerm ? `No employers found matching "${searchTerm}"` : 'No employers found. Add your first employer above.'}</p>
            </div>
          ) : (
            <div className="admin-employer-table-container">
              <table className="admin-employer-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployers
                    .filter(employer => employer && employer._id)
                    .map((employer) => (
                      <tr key={employer._id} className="admin-employer-table-row">
                        <td className="admin-employer-name-cell">
                          <strong>{employer.name || 'Unnamed Employer'}</strong>
                        </td>
                        <td className="admin-employer-email-cell">
                          {employer.email}
                        </td>
                         <td className="admin-employer-role-cell">
                           <span className={`admin-employer-role-badge ${employer.role}`}>
                             {availableRoles.find(r => r.name === employer.role)?.displayName || employer.role}
                           </span>
                         </td>
                        <td className="admin-employer-status-cell">
                          <span className={`admin-employer-status-badge ${employer.isActive ? 'active' : 'inactive'}`}>
                            {employer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="admin-employer-date-cell">
                          {employer.createdAt ? new Date(employer.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="admin-employer-actions-cell">
                          {currentUser && currentUser.type === 'admin' ? (
                            <>
                              <button 
                                className="admin-employer-edit-btn"
                                onClick={() => handleEditEmployer(employer)}
                                title="Edit employer"
                              >
                                Edit
                              </button>
                              <button 
                                className="admin-employer-permissions-btn"
                                onClick={() => handleOpenPermissions(employer)}
                                title="Manage permissions"
                              >
                                Permissions
                              </button>
                              <button 
                                className="admin-employer-delete-btn"
                                onClick={() => handleDeleteEmployer(employer._id)}
                                title="Delete employer"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="admin-employer-view-only">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEmployer;
