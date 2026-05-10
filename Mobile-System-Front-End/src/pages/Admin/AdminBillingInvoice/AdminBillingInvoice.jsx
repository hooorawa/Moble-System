import React, { useEffect, useState } from 'react';
import './AdminBillingInvoice.css';
import ApiService from '../../../services/api';
import bill_icon from '../../../Assets/bill.png';

const AdminBillingInvoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getAllPaymentRecords({
        page: 1,
        limit: 500
      });

      if (response.success) {
        // Filter records that have invoice data
        const invoiceRecords = (response.data.records || []).filter(record => 
          record.invoice && (record.invoice.billNumber || record.invoice.invoiceNumber)
        );
        setInvoices(invoiceRecords);
      } else {
        setError(response.message || 'Failed to load invoices.');
      }
    } catch (fetchError) {
      console.error('Error loading invoices:', fetchError);
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge-paid';
      case 'partial':
        return 'status-badge-partial';
      case 'refunded':
        return 'status-badge-refunded';
      default:
        return 'status-badge-default';
    }
  };

  const getPaymentPlanType = (record) => {
    if (record?.paymentPlanType === 'full' || record?.paymentPlanType === 'installment') {
      return record.paymentPlanType;
    }

    return Number(record?.monthlyInstallment || 0) > 0 || Number(record?.totalInstallments || 0) > 0
      ? 'installment'
      : 'full';
  };

  const isInstallmentPayment = (record) => getPaymentPlanType(record) === 'installment';

  const getRemainingMonths = (record) => {
    const totalInstallments = Number(record?.totalInstallments || 0);
    const paidInstallments = Number(record?.paidInstallments || 0);
    return Math.max(totalInstallments - paidInstallments, 0);
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const closeDetailView = () => {
    setSelectedInvoice(null);
  };

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      (invoice.invoice?.billNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.invoice?.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || invoice.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-billing-loading">
        <div className="loading-spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  // ── Detail Page View ──────────────────────────────────────────────────────
  if (selectedInvoice) {
    return (
      <div className="invoice-detail-page">
        <div className="invoice-detail-page-header">
          <button className="invoice-back-btn" onClick={closeDetailView}>
            &#8592; Back to Invoices
          </button>
          <div className="invoice-detail-page-title">
            <h2>Invoice Details</h2>
            <span className={'status-badge ' + getStatusBadgeClass(selectedInvoice.paymentStatus)}>
              {selectedInvoice.paymentStatus
                ? selectedInvoice.paymentStatus.charAt(0).toUpperCase() + selectedInvoice.paymentStatus.slice(1)
                : 'Unknown'}
            </span>
          </div>
        </div>

        <div className="invoice-detail-page-body">
          {/* Invoice Information */}
          <div className="invoice-detail-card">
            <div className="invoice-detail-card-header">Invoice Information</div>
            <div className="invoice-detail-card-body">
              <div className="invoice-field-row">
                <div className="invoice-field">
                  <span className="invoice-field-label">Bill Number</span>
                  <span className="invoice-field-value">{selectedInvoice.invoice?.billNumber || 'N/A'}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Invoice Number</span>
                  <span className="invoice-field-value">{selectedInvoice.invoice?.invoiceNumber || 'N/A'}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Issue Date</span>
                  <span className="invoice-field-value">{formatDate(selectedInvoice.invoice?.issueDate)}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Customer NOC Number</span>
                  <span className="invoice-field-value">{selectedInvoice.invoice?.customerNocNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="invoice-detail-card">
            <div className="invoice-detail-card-header">Customer Information</div>
            <div className="invoice-detail-card-body">
              <div className="invoice-field-row">
                <div className="invoice-field">
                  <span className="invoice-field-label">Name</span>
                  <span className="invoice-field-value">{selectedInvoice.customer?.name || 'N/A'}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Email</span>
                  <span className="invoice-field-value">{selectedInvoice.customer?.email || 'N/A'}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Mobile</span>
                  <span className="invoice-field-value">{selectedInvoice.customerMobile || 'N/A'}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Order Number</span>
                  <span className="invoice-field-value">#{selectedInvoice.orderNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="invoice-detail-card">
            <div className="invoice-detail-card-header">Financial Details</div>
            <div className="invoice-detail-card-body">
              <div className="invoice-field-row">
                <div className="invoice-field">
                  <span className="invoice-field-label">Cash Payable</span>
                  <span className="invoice-field-value invoice-amount">
                    {formatCurrency(selectedInvoice.invoice?.cashPayable ?? selectedInvoice.invoice?.dueAmount)}
                  </span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Discount Amount</span>
                  <span className="invoice-field-value">{formatCurrency(selectedInvoice.invoice?.discountAmount)}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Paid Amount</span>
                  <span className="invoice-field-value invoice-paid">{formatCurrency(selectedInvoice.invoice?.paidAmount ?? selectedInvoice.paidPrice)}</span>
                </div>
                <div className="invoice-field invoice-field-balance">
                  <span className="invoice-field-label">Balance Amount</span>
                  <span className="invoice-field-value invoice-balance">{formatCurrency(selectedInvoice.invoice?.balanceAmount ?? selectedInvoice.remainingBalance)}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Payment Type</span>
                  <span className="invoice-field-value">{isInstallmentPayment(selectedInvoice) ? 'Monthly Installment' : 'Full Payment'}</span>
                </div>
              </div>
            </div>
          </div>

          {isInstallmentPayment(selectedInvoice) && (
            <div className="invoice-detail-card">
              <div className="invoice-detail-card-header">Installment Details</div>
              <div className="invoice-detail-card-body">
                <div className="invoice-field-row">
                  <div className="invoice-field">
                    <span className="invoice-field-label">Advance Price</span>
                    <span className="invoice-field-value">{formatCurrency(selectedInvoice.advancePaidPrice)}</span>
                  </div>
                  <div className="invoice-field">
                    <span className="invoice-field-label">Monthly Installment</span>
                    <span className="invoice-field-value">{formatCurrency(selectedInvoice.monthlyInstallment)}</span>
                  </div>
                  <div className="invoice-field">
                    <span className="invoice-field-label">Total Installments</span>
                    <span className="invoice-field-value">{selectedInvoice.totalInstallments || 0}</span>
                  </div>
                  <div className="invoice-field">
                    <span className="invoice-field-label">Paid Installments</span>
                    <span className="invoice-field-value">{selectedInvoice.paidInstallments || 0}</span>
                  </div>
                  <div className="invoice-field">
                    <span className="invoice-field-label">Remaining Months</span>
                    <span className="invoice-field-value">{selectedInvoice.remainingMonths ?? getRemainingMonths(selectedInvoice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="invoice-detail-card">
            <div className="invoice-detail-card-header">Additional Information</div>
            <div className="invoice-detail-card-body">
              <div className="invoice-field-row">
                <div className="invoice-field">
                  <span className="invoice-field-label">Warranty Period</span>
                  <span className="invoice-field-value">
                    {selectedInvoice.invoice?.warrantyMonths
                      ? selectedInvoice.invoice.warrantyMonths + ' months'
                      : 'N/A'}
                  </span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Payment Method</span>
                  <span className="invoice-field-value">{selectedInvoice.paymentMethod?.type || 'N/A'}</span>
                </div>
                <div className="invoice-field">
                  <span className="invoice-field-label">Payment Type</span>
                  <span className="invoice-field-value">{isInstallmentPayment(selectedInvoice) ? 'Monthly Installment' : 'Full Payment'}</span>
                </div>
              </div>
              {selectedInvoice.invoice?.notes && (
                <div className="invoice-notes">
                  <span className="invoice-field-label">Invoice Notes</span>
                  <p className="invoice-notes-content">{selectedInvoice.invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          {selectedInvoice.order?.products && selectedInvoice.order.products.length > 0 && (
            <div className="invoice-detail-card">
              <div className="invoice-detail-card-header">Order Items</div>
              <div className="invoice-detail-card-body">
                <table className="invoice-products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.order.products.map((product, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{product.productId?.name || 'Product'}</td>
                        <td>{product.quantity}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>{formatCurrency((product.quantity || 1) * (product.price || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-billing-invoice-container">
      {/* Header Section */}
      <div className="admin-billing-header">
        <div className="admin-billing-title-section">
          <img src={bill_icon} alt="Billing" className="admin-billing-icon" />
          <div>
            <h2>Billing & Invoices</h2>
            <p className="admin-billing-subtitle">Manage all billing and invoice records</p>
          </div>
        </div>
        <div className="admin-billing-stats">
          <div className="stat-card">
            <span className="stat-label">Total Invoices</span>
            <span className="stat-value">{invoices.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Paid</span>
            <span className="stat-value stat-success">{invoices.filter(i => i.paymentStatus === 'paid').length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Partial</span>
            <span className="stat-value stat-warning">{invoices.filter(i => i.paymentStatus === 'partial').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-billing-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by bill number, invoice number, order number, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="no-invoices">
          <img src={bill_icon} alt="No invoices" className="no-invoices-icon" />
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="invoices-table-wrapper">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Bill </th>
                <th>Invoice </th>
                <th>Order</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Customer NIC</th>
                <th>Cash Payable</th>
                <th>Discount</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice._id}>
                  <td className="bill-number">{invoice.invoice?.billNumber || 'N/A'}</td>
                  <td className="invoice-number">{invoice.invoice?.invoiceNumber || 'N/A'}</td>
                  <td>{invoice.orderNumber || 'N/A'}</td>
                  <td>{invoice.customer?.name || 'Unknown'}</td>
                  <td>{formatDate(invoice.invoice?.issueDate)}</td>
                  <td>{invoice.invoice?.customerNocNumber || 'N/A'}</td>
                  <td className="amount-highlight">{formatCurrency(invoice.invoice?.cashPayable ?? invoice.invoice?.dueAmount)}</td>
                  <td>{formatCurrency(invoice.invoice?.discountAmount)}</td>
                  <td>{formatCurrency(invoice.invoice?.paidAmount)}</td>
                  <td className="balance-amount">{formatCurrency(invoice.invoice?.balanceAmount)}</td>
                  <td>
                    {invoice.paymentStatus ? invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1) : 'Unknown'}
                  </td>
                  <td>
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(invoice)}
                    >
                      view
                    </button>
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

export default AdminBillingInvoice;
