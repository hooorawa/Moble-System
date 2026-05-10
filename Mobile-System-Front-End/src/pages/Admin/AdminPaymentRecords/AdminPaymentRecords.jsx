import React, { useEffect, useState } from 'react';
import './AdminPaymentRecords.css';
import ApiService from '../../../services/api';
import records_icon from '../../../Assets/records.png';

const AdminPaymentRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    customerMobile: '',
    paymentMethodType: '',
    paymentPlanType: 'full',
    totalPrice: '',
    paidPrice: '',
    advancePrice: '',
    monthlyInstallment: '',
    remainingBalance: '',
    totalInstallments: '',
    paidInstallments: '',
    remainingMonths: '',
    confirmedAt: '',
    paymentStatus: 'paid',
    notes: ''
  });

  const toSafeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const sanitizePriceInput = (value) => {
    const cleaned = String(value || '').replace(/[^\d.]/g, '');
    const [whole, ...decimals] = cleaned.split('.');
    const decimalPart = decimals.join('').slice(0, 2);
    return decimals.length > 0 ? `${whole}.${decimalPart}` : whole;
  };

  const calculateRemainingMonths = (totalInstallments, paidInstallments) => {
    return Math.max(toSafeNumber(totalInstallments) - toSafeNumber(paidInstallments), 0);
  };

  const toDateTimeLocalValue = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getAllPaymentRecords({
        page: 1,
        limit: 100
      });

      if (response.success) {
        setRecords(response.data.records || []);
      } else {
        setError(response.message || 'Failed to load payment records.');
      }
    } catch (fetchError) {
      console.error('Error loading payment records:', fetchError);
      setError('Failed to load payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentRecords();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount) => {
    const numeric = Number(amount || 0);
    return numeric.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getPaymentPlanType = (record) => {
    if (record?.paymentPlanType === 'full' || record?.paymentPlanType === 'installment') {
      return record.paymentPlanType;
    }

    return getMonthlyInstallment(record) > 0 || getTotalInstallments(record) > 0 || getPaidInstallments(record) > 0
      ? 'installment'
      : 'full';
  };

  const isInstallmentPayment = (record) => getPaymentPlanType(record) === 'installment';

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      orderNumber: record.orderNumber || '',
      customerName: record.customer?.name || '',
      customerEmail: record.customer?.email || '',
      customerMobile: record.customerMobile || '',
      paymentMethodType: record.paymentMethod?.type || '',
      paymentPlanType: getPaymentPlanType(record),
      totalPrice: record.totalPrice ?? record.amount ?? '',
      paidPrice: record.paidPrice ?? record.amount ?? '',
      advancePrice: record.advancePaidPrice ?? record.invoice?.advancePaidPrice ?? record.invoice?.advanceAmount ?? '',
      monthlyInstallment: record.monthlyInstallment ?? record.invoice?.monthlyInstallment ?? record.invoice?.emiPerMonth ?? '',
      remainingBalance: record.remainingBalance ?? record.invoice?.remainingBalance ?? record.invoice?.balanceAmount ?? '',
      totalInstallments: record.totalInstallments ?? record.invoice?.totalInstallments ?? '',
      paidInstallments: record.paidInstallments ?? record.invoice?.paidInstallments ?? '',
      remainingMonths: record.remainingMonths ?? calculateRemainingMonths(record.totalInstallments, record.paidInstallments),
      confirmedAt: toDateTimeLocalValue(record.createdAt),
      paymentStatus: record.paymentStatus || 'paid',
      notes: record.notes || ''
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => {
      const priceFields = ['totalPrice', 'paidPrice', 'advancePrice', 'monthlyInstallment', 'remainingBalance'];
      const normalizedValue = priceFields.includes(field) ? sanitizePriceInput(value) : value;

      const nextForm = {
        ...prev,
        [field]: normalizedValue
      };

      if (field === 'paymentPlanType' && value === 'full') {
        nextForm.advancePrice = '0';
        nextForm.monthlyInstallment = '0';
        nextForm.remainingBalance = '0';
        nextForm.totalInstallments = '0';
        nextForm.paidInstallments = '0';
        nextForm.remainingMonths = '0';
      }

      if (field === 'totalInstallments' || field === 'paidInstallments') {
        nextForm.remainingMonths = String(
          calculateRemainingMonths(nextForm.totalInstallments, nextForm.paidInstallments)
        );
      }

      return nextForm;
    });
  };

  const closeEditModal = () => {
    setEditingRecord(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const response = await ApiService.updatePaymentRecord(editingRecord._id, {
        orderNumber: editForm.orderNumber,
        customerName: editForm.customerName,
        customerEmail: editForm.customerEmail,
        customerMobile: editForm.customerMobile,
        paymentMethodType: editForm.paymentMethodType,
        paymentPlanType: editForm.paymentPlanType,
        totalPrice: parseFloat(editForm.totalPrice) || 0,
        paidPrice: parseFloat(editForm.paidPrice) || 0,
        advancePaidPrice: editForm.paymentPlanType === 'installment' ? (parseFloat(editForm.advancePrice) || 0) : 0,
        monthlyInstallment: editForm.paymentPlanType === 'installment' ? (parseFloat(editForm.monthlyInstallment) || 0) : 0,
        remainingBalance: editForm.paymentPlanType === 'installment' ? (parseFloat(editForm.remainingBalance) || 0) : 0,
        totalInstallments: editForm.paymentPlanType === 'installment' ? (parseInt(editForm.totalInstallments, 10) || 0) : 0,
        paidInstallments: editForm.paymentPlanType === 'installment' ? (parseInt(editForm.paidInstallments, 10) || 0) : 0,
        remainingMonths: editForm.paymentPlanType === 'installment' ? (parseInt(editForm.remainingMonths, 10) || 0) : 0,
        confirmedAt: editForm.confirmedAt,
        paymentStatus: editForm.paymentStatus,
        notes: editForm.notes
      });

      if (response.success) {
        alert('Payment record updated successfully');
        closeEditModal();
        fetchPaymentRecords();
      }
    } catch (error) {
      console.error('Error updating payment record:', error);
      alert('Failed to update payment record');
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This will also reset the order payment status.')) {
      return;
    }

    try {
      const response = await ApiService.deletePaymentRecord(recordId);

      if (response.success) {
        alert('Payment record deleted successfully');
        fetchPaymentRecords();
      }
    } catch (error) {
      console.error('Error deleting payment record:', error);
      alert('Failed to delete payment record');
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
  };

  const closeDetailView = () => {
    setSelectedRecord(null);
  };

  const getAdvancePaidPrice = (record) => {
    return Number(
      record?.advancePaidPrice ??
      record?.invoice?.advancePaidPrice ??
      record?.invoice?.advanceAmount ??
      0
    );
  };

  const getMonthlyInstallment = (record) => {
    return Number(
      record?.monthlyInstallment ??
      record?.invoice?.monthlyInstallment ??
      record?.invoice?.emiPerMonth ??
      0
    );
  };

  const getRemainingBalance = (record) => {
    const explicitRemaining =
      record?.remainingBalance ??
      record?.invoice?.remainingBalance ??
      record?.invoice?.balanceAmount;

    if (explicitRemaining !== undefined && explicitRemaining !== null) {
      return Number(explicitRemaining);
    }

    const total = Number(record?.totalPrice ?? record?.amount ?? 0);
    const paid = Number(record?.paidPrice ?? record?.amount ?? 0);
    return Math.max(total - paid, 0);
  };

  const getTotalInstallments = (record) => {
    return Number(record?.totalInstallments ?? record?.invoice?.totalInstallments ?? 0);
  };

  const getPaidInstallments = (record) => {
    return Number(record?.paidInstallments ?? record?.invoice?.paidInstallments ?? 0);
  };

  const getRemainingMonths = (record) => {
    const explicitRemainingMonths = record?.remainingMonths ?? record?.invoice?.remainingMonths;

    if (explicitRemainingMonths !== undefined && explicitRemainingMonths !== null) {
      return Number(explicitRemainingMonths);
    }

    return calculateRemainingMonths(getTotalInstallments(record), getPaidInstallments(record));
  };

  const getProductSummary = (record) => {
    const items = record?.order?.orderProducts;
    if (!Array.isArray(items) || items.length === 0) return 'N/A';

    return items
      .map((item) => {
        const name = item.product?.name || item.productSnapshot?.name || 'Product';
        const emi = item.product?.emiNumber || item.productSnapshot?.emiNumber;
        return emi ? `${name} (${emi})` : name;
      })
      .join(', ');
  };

  const availableMethods = Array.from(
    new Set(records.map((record) => record.paymentMethod?.type).filter(Boolean))
  );

  const filteredRecords = records.filter((record) => {
    const paymentType = getPaymentPlanType(record);
    const method = (record.paymentMethod?.type || '').toLowerCase();
    const customerName = (record.customer?.name || '').toLowerCase();
    const customerEmail = (record.customer?.email || '').toLowerCase();
    const orderNumber = (record.orderNumber || '').toLowerCase();
    const mobile = (record.customerMobile || '').toLowerCase();
    const query = searchTerm.trim().toLowerCase();

    const matchesPaymentType = paymentTypeFilter === 'all' || paymentType === paymentTypeFilter;
    const matchesStatus = statusFilter === 'all' || (record.paymentStatus || '') === statusFilter;
    const matchesMethod = methodFilter === 'all' || method === methodFilter;
    const matchesSearch =
      !query ||
      orderNumber.includes(query) ||
      customerName.includes(query) ||
      customerEmail.includes(query) ||
      mobile.includes(query);

    return matchesPaymentType && matchesStatus && matchesMethod && matchesSearch;
  });

  const fullPaymentCount = filteredRecords.filter((record) => getPaymentPlanType(record) === 'full').length;
  const installmentCount = filteredRecords.filter((record) => getPaymentPlanType(record) === 'installment').length;
  const totalProfit = filteredRecords.reduce((sum, record) => {
    const total = Number(record.totalPrice ?? record.amount ?? 0);
    const paid = Number(record.paidPrice ?? record.amount ?? 0);
    return sum + Math.max(paid - total, 0);
  }, 0);

  if (loading) {
    return (
      <div className="admin-payment-records-loading">
        <div className="loading-spinner"></div>
        <p>Loading payment records...</p>
      </div>
    );
  }

  if (selectedRecord) {
    return (
      <div className="payment-record-detail-page">
        <div className="payment-record-detail-header">
          <button className="payment-record-back-btn" onClick={closeDetailView}>
            ← Back to Payment Records
          </button>
          <div className="payment-record-detail-title">
            <h2>Payment Record Details</h2>
            <p>{selectedRecord.orderNumber || 'N/A'}</p>
          </div>
        </div>

        <div className="payment-record-detail-sections">
          <section className="payment-record-section">
            <h3>Order & Customer</h3>
            <div className="payment-record-grid">
              <div className="payment-record-item">
                <span className="label">Order</span>
                <span className="value">{selectedRecord.orderNumber || 'N/A'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Customer</span>
                <span className="value">{selectedRecord.customer?.name || 'Guest'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Email</span>
                <span className="value">{selectedRecord.customer?.email || 'N/A'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Mobile</span>
                <span className="value">{selectedRecord.customerMobile || 'N/A'}</span>
              </div>
            </div>
          </section>

          <section className="payment-record-section">
            <h3>Payment Information</h3>
            <div className="payment-record-grid">
              <div className="payment-record-item">
                <span className="label">Payment Method</span>
                <span className="value">{selectedRecord.paymentMethod?.type || 'N/A'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Payment Type</span>
                <span className="value">{isInstallmentPayment(selectedRecord) ? 'Monthly Installment' : 'Full Payment'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Payment Status</span>
                <span className="value">{selectedRecord.paymentStatus || 'N/A'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Confirmed</span>
                <span className="value">{formatDate(selectedRecord.createdAt)}</span>
              </div>
              <div className="payment-record-item product-full">
                <span className="label">Products</span>
                <span className="value">{getProductSummary(selectedRecord)}</span>
              </div>
            </div>
          </section>

          <section className="payment-record-section">
            <h3>Billing Summary</h3>
            <div className="payment-record-grid">
              <div className="payment-record-item">
                <span className="label">Total Price</span>
                <span className="value">{formatPrice(Number(selectedRecord.totalPrice ?? selectedRecord.amount ?? 0))}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Paid Price</span>
                <span className="value">{formatPrice(Number(selectedRecord.paidPrice ?? selectedRecord.amount ?? 0))}</span>
              </div>
              <div className="payment-record-item remaining-full">
                <span className="label">Remaining Balance</span>
                <span className="value">{formatPrice(getRemainingBalance(selectedRecord))}</span>
              </div>
            </div>
          </section>

          {isInstallmentPayment(selectedRecord) && (
            <section className="payment-record-section">
              <h3>Installment Details</h3>
              <div className="payment-record-grid">
                <div className="payment-record-item">
                  <span className="label">Monthly Installment</span>
                  <span className="value">{formatPrice(getMonthlyInstallment(selectedRecord))}</span>
                </div>
                <div className="payment-record-item">
                  <span className="label">Advance Price</span>
                  <span className="value">{formatPrice(getAdvancePaidPrice(selectedRecord))}</span>
                </div>
                <div className="payment-record-item">
                  <span className="label">Total Installments</span>
                  <span className="value">{getTotalInstallments(selectedRecord)}</span>
                </div>
                <div className="payment-record-item">
                  <span className="label">Paid Installments</span>
                  <span className="value">{getPaidInstallments(selectedRecord)}</span>
                </div>
                <div className="payment-record-item">
                  <span className="label">Remaining Months</span>
                  <span className="value">{getRemainingMonths(selectedRecord)}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  if (editingRecord) {
    return (
      <div className="payment-record-detail-page">
        <div className="payment-record-detail-header">
          <button className="payment-record-back-btn" onClick={closeEditModal}>
            ← Back to Payment Records
          </button>
          <div className="payment-record-detail-title">
            <h2>Edit Payment Record</h2>
            <p>{editingRecord.orderNumber || 'N/A'}</p>
          </div>
        </div>

        <div className="payment-record-detail-sections">
          <section className="payment-record-section">
            <h3>Current Record Details</h3>
            <div className="payment-record-grid">
              <div className="payment-record-item">
                <span className="label">Order</span>
                <span className="value">{editingRecord.orderNumber || 'N/A'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Customer</span>
                <span className="value">{editingRecord.customer?.name || 'Guest'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Email</span>
                <span className="value">{editingRecord.customer?.email || 'N/A'}</span>
              </div>
              <div className="payment-record-item">
                <span className="label">Mobile</span>
                <span className="value">{editingRecord.customerMobile || 'N/A'}</span>
              </div>
            </div>
          </section>

          <section className="payment-record-section">
            <h3>Edit Details</h3>
            <div className="edit-form-grid page-edit-grid">
              <div className="form-group">
                <label>Order Number:</label>
                <input
                  type="text"
                  value={editForm.orderNumber}
                  onChange={(e) => handleEditFormChange('orderNumber', e.target.value)}
                  placeholder="Order number"
                />
              </div>

              <div className="form-group">
                <label>Customer Name:</label>
                <input
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => handleEditFormChange('customerName', e.target.value)}
                  placeholder="Customer name"
                />
              </div>

              <div className="form-group">
                <label>Customer Email:</label>
                <input
                  type="email"
                  value={editForm.customerEmail}
                  onChange={(e) => handleEditFormChange('customerEmail', e.target.value)}
                  placeholder="Customer email"
                />
              </div>

              <div className="form-group">
                <label>Customer Mobile:</label>
                <input
                  type="text"
                  value={editForm.customerMobile}
                  onChange={(e) => handleEditFormChange('customerMobile', e.target.value)}
                  placeholder="Customer mobile"
                />
              </div>

              <div className="form-group">
                <label>Payment Method:</label>
                <input
                  type="text"
                  value={editForm.paymentMethodType}
                  onChange={(e) => handleEditFormChange('paymentMethodType', e.target.value)}
                  placeholder="Payment method"
                />
              </div>

              <div className="form-group payment-plan-toggle">
                <label>Installment Payment:</label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.paymentPlanType === 'installment'}
                    onChange={(e) => handleEditFormChange('paymentPlanType', e.target.checked ? 'installment' : 'full')}
                  />
                  <span>{editForm.paymentPlanType === 'installment' ? 'Monthly installment selected' : 'Full payment selected'}</span>
                </label>
              </div>

              <div className="form-group">
                <label>Total Price:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editForm.totalPrice}
                  onChange={(e) => handleEditFormChange('totalPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Paid Price:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editForm.paidPrice}
                  onChange={(e) => handleEditFormChange('paidPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {editForm.paymentPlanType === 'installment' && (
                <>
                  <div className="form-group">
                    <label>Advance Price:</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editForm.advancePrice}
                      onChange={(e) => handleEditFormChange('advancePrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Monthly Installment:</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editForm.monthlyInstallment}
                      onChange={(e) => handleEditFormChange('monthlyInstallment', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Installments:</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.totalInstallments}
                      onChange={(e) => handleEditFormChange('totalInstallments', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Paid Installments:</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.paidInstallments}
                      onChange={(e) => handleEditFormChange('paidInstallments', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Remaining Months:</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.remainingMonths}
                      readOnly
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Remaining Balance:</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editForm.remainingBalance}
                      onChange={(e) => handleEditFormChange('remainingBalance', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Confirmed At:</label>
                <input
                  type="datetime-local"
                  value={editForm.confirmedAt}
                  onChange={(e) => handleEditFormChange('confirmedAt', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Payment Status:</label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => handleEditFormChange('paymentStatus', e.target.value)}
                >
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value)}
                placeholder="Add notes about this payment..."
                rows="2"
              />
            </div>

            <div className="modal-footer page-edit-actions">
              <button className="btn-cancel" onClick={closeEditModal}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-payment-records-container">
      <div className="payment-records-header">
        <div className="header-left">
          <div className="records-icon">
            <img src={records_icon} alt="Payment Records" />
          </div>
          <div>
            <h1>Payment Records</h1>
            <p>Confirmed payments captured by the admin team</p>
          </div>
        </div>
        <div className="header-count">
          <span>{filteredRecords.length} records</span>
        </div>
      </div>

      <div className="payment-record-summary-grid">
        <div className="summary-card">
          <span className="summary-label">Full Payment</span>
          <span className="summary-value">{fullPaymentCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Monthly Installment</span>
          <span className="summary-value">{installmentCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Profit</span>
          <span className="summary-value">{formatPrice(totalProfit)}</span>
        </div>
      </div>

      <div className="payment-record-filters">
        <input
          type="text"
          placeholder="Search order, customer, email, mobile"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="records-filter-input"
        />

        <select
          value={paymentTypeFilter}
          onChange={(e) => setPaymentTypeFilter(e.target.value)}
          className="records-filter-select"
        >
          <option value="all" disabled>All Payment Types</option>
          <option value="full">Full Payment</option>
          <option value="installment">Monthly Installment</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="records-filter-select"
        >
          <option value="all" disabled>All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="records-filter-select"
        >
          <option value="all" disabled>All Methods</option>
          {availableMethods.map((method) => (
            <option key={method} value={method.toLowerCase()}>{method}</option>
          ))}
        </select>
      </div>

      <div className="payment-record-filter-suggestions">
        Suggested more filters: date range, amount range, customer type, order status.
      </div>

      {error && (
        <div className="payment-records-error">
          {error}
        </div>
      )}

      {!error && filteredRecords.length === 0 && (
        <div className="payment-records-empty">
          <p>No payment records match current filters.</p>
        </div>
      )}

      {filteredRecords.length > 0 && (
        <div className="payment-records-table-wrap">
          <table className="payment-records-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Payment</th>
                <th>Product</th>
                <th>Confirmed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record._id}>
                  <td className="records-order">{record.orderNumber}</td>
                  <td className="records-customer" title={`${record.customer?.name || 'Guest'} | ${record.customer?.email || 'N/A'}`}>
                    {record.customer?.name || 'Guest'} | {record.customer?.email || 'N/A'}
                  </td>
                  <td className="records-mobile">{record.customerMobile || 'N/A'}</td>
                  <td className="records-payment">{record.paymentMethod?.type || 'N/A'}</td>
                  <td className="records-products" title={getProductSummary(record)}>{getProductSummary(record)}</td>
                  <td className="records-date">{formatDate(record.createdAt)}</td>
                  <td>
                    <div className="records-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(record)}
                        title="Edit notes"
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(record._id)}
                        title="Delete record"
                      >
                        Delete 
                      </button>
                      <button
                        className="action-btn view-details-btn"
                        onClick={() => handleViewDetails(record)}
                        title="View details"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default AdminPaymentRecords;
