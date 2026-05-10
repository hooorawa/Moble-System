import React, { useEffect, useState } from 'react';
import './AdminSupplies.css';
import supplies_icon from '../../../Assets/supplies.png';
import ApiService from '../../../services/api';

const AdminSupplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: '',
    reciepNo: '',
    brand: '',
    modal: '',
    quantity: '',
    buyingPrice: '',
    supplierName: '',
    address: '',
    mobileNumber: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getSuppliers();
      if (response.success) {
        setSupplies(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSupply = async (e) => {
    e.preventDefault();

    const required = [
      'date',
      'reciepNo',
      'brand',
      'modal',
      'quantity',
      'buyingPrice',
      'supplierName',
      'address',
      'mobileNumber'
    ];

    const hasEmptyRequired = required.some((field) => !String(form[field]).trim());
    if (hasEmptyRequired) {
      return;
    }

    const payload = {
      date: form.date,
      reciepNo: form.reciepNo.trim(),
      brand: form.brand.trim(),
      modal: form.modal.trim(),
      quantity: Number(form.quantity),
      buyingPrice: Number(form.buyingPrice),
      supplierName: form.supplierName.trim(),
      address: form.address.trim(),
      mobileNumber: form.mobileNumber.trim()
    };

    try {
      if (editingId) {
        const response = await ApiService.updateSupplier(editingId, payload);
        if (response.success) {
          setSupplies((prev) =>
            prev.map((item) => ((item._id || item.id) === editingId ? response.data : item))
          );
          setEditingId(null);
        }
      } else {
        const response = await ApiService.createSupplier(payload);
        if (response.success) {
          setSupplies((prev) => [response.data, ...prev]);
        }
      }

      setForm({
        date: '',
        reciepNo: '',
        brand: '',
        modal: '',
        quantity: '',
        buyingPrice: '',
        supplierName: '',
        address: '',
        mobileNumber: ''
      });
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert(error.message || 'Failed to save supplier data');
    }
  };

  const handleDeleteSupply = async (supplyId) => {
    try {
      const response = await ApiService.deleteSupplier(supplyId);
      if (response.success) {
        setSupplies((prev) => prev.filter((item) => (item._id || item.id) !== supplyId));

        if (editingId === supplyId) {
          setEditingId(null);
          setForm({
            date: '',
            reciepNo: '',
            brand: '',
            modal: '',
            quantity: '',
            buyingPrice: '',
            supplierName: '',
            address: '',
            mobileNumber: ''
          });
        }
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert(error.message || 'Failed to delete supplier data');
    }
  };

  const handleEditSupply = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      date: item.date || '',
      reciepNo: item.reciepNo || '',
      brand: item.brand || '',
      modal: item.modal || '',
      quantity: String(item.quantity ?? ''),
      buyingPrice: String(item.buyingPrice ?? ''),
      supplierName: item.supplierName || '',
      address: item.address || '',
      mobileNumber: item.mobileNumber || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      date: '',
      reciepNo: '',
      brand: '',
      modal: '',
      quantity: '',
      buyingPrice: '',
      supplierName: '',
      address: '',
      mobileNumber: ''
    });
  };

  const totalQty = supplies.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="sidebar-section supplies-section">
      <div className="section-header">
        <div className="section-icon">
          <img src={supplies_icon} alt="Supplies" />
        </div>
        <h3>Supplies</h3>
      </div>

      <form onSubmit={handleAddSupply} className="quick-add-form">
        <h4 className="form-subtitle">Item Details</h4>
        <input
          type="date"
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.reciepNo}
          onChange={(e) => handleChange('reciepNo', e.target.value)}
          placeholder="Reciep No"
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.brand}
          onChange={(e) => handleChange('brand', e.target.value)}
          placeholder="Brand"
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.modal}
          onChange={(e) => handleChange('modal', e.target.value)}
          placeholder="Model"
          className="quick-input"
          required
        />
        <input
          type="number"
          value={form.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          placeholder="Quantity"
          min="0"
          className="quick-input"
          required
        />
        <input
          type="number"
          value={form.buyingPrice}
          onChange={(e) => handleChange('buyingPrice', e.target.value)}
          placeholder="Buying Price"
          min="0"
          step="0.01"
          className="quick-input"
          required
        />

        <h4 className="form-subtitle">Supplier Details</h4>
        <input
          type="text"
          value={form.supplierName}
          onChange={(e) => handleChange('supplierName', e.target.value)}
          placeholder="Supplier Name"
          className="quick-input"
          required
        />
        <input
          type="text"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Address"
          className="quick-input span-2"
          required
        />
        <input
          type="text"
          value={form.mobileNumber}
          onChange={(e) => handleChange('mobileNumber', e.target.value)}
          placeholder="Mobile Number"
          className="quick-input"
          required
        />
        <button type="submit" className="quick-btn add-btn">{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button type="button" className="quick-btn cancel-btn" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <div className="table-wrap">
        {loading ? (
          <p className="empty-msg">Loading suppliers...</p>
        ) : supplies.length === 0 ? (
          <p className="empty-msg">No supplies</p>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reciep No</th>
                <th>Brand</th>
                <th>Modal</th>
                <th>Qty</th>
                <th>Buying Price</th>
                <th>Supplier</th>
                <th>Address</th>
                <th>Mobile</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((item) => (
                <tr key={item._id || item.id}>
                  <td>{item.date}</td>
                  <td>{item.reciepNo}</td>
                  <td>{item.brand}</td>
                  <td>{item.modal}</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.buyingPrice || 0).toFixed(2)}</td>
                  <td>{item.supplierName}</td>
                  <td>{item.address}</td>
                  <td>{item.mobileNumber}</td>
                  <td>
                    <div className="records-actions">
                      <button
                        type="button"
                        className="action-btn edit-btn"
                        onClick={() => handleEditSupply(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteSupply(item._id || item.id)}
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
        <span>Total: {supplies.length} items | {totalQty} qty</span>
      </div>
    </div>
  );
};

export default AdminSupplies;
