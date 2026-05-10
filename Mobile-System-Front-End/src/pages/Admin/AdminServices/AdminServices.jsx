import React, { useEffect, useState } from 'react';
import './AdminServices.css';
import services_icon from '../../../Assets/services.png';
import ApiService from '../../../services/api';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: '',
    services: '',
    serviceType: '',
    cost: '',
    remark: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getServices();
      if (response.success) {
        setServices(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();

    const required = ['date', 'services', 'serviceType', 'cost'];
    const hasEmptyRequired = required.some((field) => !String(form[field]).trim());
    if (hasEmptyRequired) {
      return;
    }

    try {
      if (editingId) {
        const response = await ApiService.updateService(editingId, {
          date: form.date,
          services: form.services,
          serviceType: form.serviceType,
          cost: form.cost,
          remark: form.remark
        });

        if (response.success) {
          setServices((prev) => prev.map((item) => (
            (item._id || item.id) === editingId ? response.data : item
          )));
          setEditingId(null);
        }
      } else {
        const response = await ApiService.createService({
          date: form.date,
          services: form.services,
          serviceType: form.serviceType,
          cost: form.cost,
          remark: form.remark
        });

        if (response.success) {
          setServices((prev) => [response.data, ...prev]);
        }
      }

      setForm({
        date: '',
        services: '',
        serviceType: '',
        cost: '',
        remark: ''
      });
    } catch (error) {
      console.error('Error creating service:', error);
      alert(error.message || 'Failed to save service');
    }
  };

  const handleEditService = (service) => {
    setEditingId(service._id || service.id);
    setForm({
      date: service.date || '',
      services: service.services || '',
      serviceType: service.serviceType || '',
      cost: String(service.cost ?? ''),
      remark: service.remark || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      date: '',
      services: '',
      serviceType: '',
      cost: '',
      remark: ''
    });
  };

  const handleDeleteService = async (serviceId) => {
    try {
      const response = await ApiService.deleteService(serviceId);
      if (response.success) {
        setServices((prev) => prev.filter((item) => (item._id || item.id) !== serviceId));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert(error.message || 'Failed to delete service');
    }
  };

  return (
    <div className="sidebar-section services-section">
      <div className="section-header">
        <div className="section-icon">
          <img src={services_icon} alt="Services" />
        </div>
        <h3>Services</h3>
      </div>

      <form onSubmit={handleAddService} className="quick-add-form">
        <input
          type="date"
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.services}
          onChange={(e) => handleChange('services', e.target.value)}
          placeholder="Services"
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.serviceType}
          onChange={(e) => handleChange('serviceType', e.target.value)}
          placeholder="Service Type"
          className="quick-input"
          required
        />
        <input
          type="number"
          value={form.cost}
          onChange={(e) => handleChange('cost', e.target.value)}
          placeholder="Cost"
          step="0.01"
          min="0"
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.remark}
          onChange={(e) => handleChange('remark', e.target.value)}
          placeholder="Remark"
          className="quick-input span-2"
        />
        <button type="submit" className="quick-btn add-btn">{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button type="button" className="quick-btn cancel-btn" onClick={handleCancelEdit}>Cancel</button>
        )}
      </form>

      <div className="table-wrap">
        {loading ? (
          <p className="empty-msg">Loading services...</p>
        ) : services.length === 0 ? (
          <p className="empty-msg">No services</p>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Services</th>
                <th>Service Type</th>
                <th>Cost</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service._id || service.id}>
                  <td>{service.date}</td>
                  <td>{service.time}</td>
                  <td>{service.services}</td>
                  <td>{service.serviceType}</td>
                  <td>{Number(service.cost || 0).toFixed(2)}</td>
                  <td>{service.remark}</td>
                  <td>
                    <div className="records-actions">
                      <button
                        type="button"
                        className="action-btn edit-btn"
                        onClick={() => handleEditService(service)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteService(service._id || service.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section-footer">
        <span>Total: {services.length} services</span>
      </div>
    </div>
  );
};

export default AdminServices;
