import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../../services/api';
import html2pdf from 'html2pdf.js';
import './BillingInvoice.css';

const BillingInvoice = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBillingRecords();
  }, []);

  const fetchBillingRecords = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await ApiService.getMyPaymentRecords();
      console.log('Billing records response:', response);
      if (response.success) {
        setRecords(response.data || []);
      } else {
        setError(response.message || 'Failed to load billing records.');
      }
    } catch (err) {
      console.error('Error loading billing records:', err);
      setError('Failed to load billing records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${Number(amount || 0).toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
    return Math.max(Number(record?.totalInstallments || 0) - Number(record?.paidInstallments || 0), 0);
  };

  const downloadInvoicePDF = (record) => {
    const installmentRows = isInstallmentPayment(record)
      ? `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Advance Price:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${formatCurrency(record.advancePaidPrice)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Monthly Installment:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${formatCurrency(record.monthlyInstallment)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Total Installments:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${record.totalInstallments || 0}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Paid Installments:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${record.paidInstallments || 0}</td>
              </tr>
              <tr style="background: #eef2ff;">
                <td style="padding: 10px 0; font-weight: bold;">Remaining Months:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${record.remainingMonths ?? getRemainingMonths(record)}</td>
              </tr>
      `
      : '';

    const invoiceContent = document.createElement('div');
    invoiceContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; padding: 40px; background: white; color: #333;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">INVOICE</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Professional Mobile System</p>
        </div>

        <!-- Invoice Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #666;">INVOICE NUMBER</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${record.invoice?.invoiceNumber || 'N/A'}</p>
            
            <h3 style="margin: 15px 0 10px 0; font-size: 14px; font-weight: bold; color: #666;">BILL NUMBER</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${record.invoice?.billNumber || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #666;">INVOICE DATE</h3>
            <p style="margin: 0; font-size: 16px;">${formatDate(record.invoice?.issueDate)}</p>
            
            <h3 style="margin: 15px 0 10px 0; font-size: 14px; font-weight: bold; color: #666;">ORDER NUMBER</h3>
            <p style="margin: 0; font-size: 16px;">${record.orderNumber || 'N/A'}</p>
          </div>
        </div>

        <!-- Customer Info -->
        <div style="background: #f8f9fa; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">CUSTOMER INFORMATION</h3>
          <table style="width: 100%; font-size: 13px; line-height: 1.8;">
            <tr>
              <td style="width: 30%;">Customer Name:</td>
              <td style="font-weight: bold;">${record.customer?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td>Email:</td>
              <td style="font-weight: bold;">${record.customer?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td>Contact Number:</td>
              <td style="font-weight: bold;">${record.customerMobile || 'N/A'}</td>
            </tr>
            <tr>
              <td>NIC/ID Number:</td>
              <td style="font-weight: bold;">${record.invoice?.customerNocNumber || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Financial Summary -->
        <div style="background: #fff; border: 1px solid #ddd; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold;">FINANCIAL SUMMARY</h3>
          <table style="width: 100%; font-size: 13px;">
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Total Price:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${formatCurrency(record.totalPrice)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Discount:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #27ae60;">- ${formatCurrency(record.invoice?.discountAmount)}</td>
              </tr>
              <tr style="border-bottom: 2px solid #333;">
                <td style="padding: 10px 0; font-weight: bold;">Cash Payable:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold; font-size: 14px;">${formatCurrency(record.invoice?.cashPayable ?? record.invoice?.dueAmount)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">Paid Amount:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #27ae60;">✓ ${formatCurrency(record.invoice?.paidAmount ?? record.paidPrice)}</td>
              </tr>
              <tr style="background: #fff3cd;">
                <td style="padding: 10px 0; font-weight: bold;">Balance Due:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #c0392b;">${formatCurrency(record.invoice?.balanceAmount)}</td>
              </tr>
              <tr style="border-top: 1px solid #eee;">
                <td style="padding: 10px 0;">Payment Type:</td>
                <td style="text-align: right; padding: 10px 0; font-weight: bold;">${isInstallmentPayment(record) ? 'Monthly Installment' : 'Full Payment'}</td>
              </tr>
              ${installmentRows}
            </tbody>
          </table>
        </div>

        <!-- Warranty Info -->
        <div style="background: #f0f7ff; padding: 15px; margin-bottom: 20px; border-left: 4px solid #3498db; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">WARRANTY PERIOD</h3>
          <p style="margin: 0; font-size: 13px;">${record.invoice?.warrantyMonths || 0} months warranty on all items</p>
        </div>

        <!-- Payment Status -->
        <div style="text-align: center; padding: 15px; background: ${record.paymentStatus === 'paid' ? '#d4edda' : '#fff3cd'}; border-radius: 4px; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Payment Status</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: ${record.paymentStatus === 'paid' ? '#155724' : '#856404'};">
            ${record.paymentStatus?.toUpperCase() || 'PENDING'}
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 11px; color: #999;">
          <p style="margin: 5px 0;">Thank you for your business!</p>
          <p style="margin: 5px 0;">Please keep this invoice for your records.</p>
          <p style="margin: 10px 0 0 0;">Generated on: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    `;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice-${record.invoice?.invoiceNumber || record._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(invoiceContent).save();
  };

  if (loading) {
    return (
      <div className="billing-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading billing and invoice details...</p>
      </div>
    );
  }

  return (
    <div className="billing-page-container">
      <div className="billing-page-header">
        <h1>Billing & Invoice</h1>
        <p>Your order payment records and invoice details</p>
      </div>

      {error && (
        <div className="billing-page-error">
          <p>{error}</p>
          <button onClick={fetchBillingRecords}>Retry</button>
        </div>
      )}

      {!error && records.length === 0 && (
        <div className="billing-empty-state">
          <h2>No invoices yet</h2>
          <p>Once an order is confirmed by admin, your bill and invoice will appear here.</p>
          <button onClick={() => navigate('/orders')}>View My Orders</button>
        </div>
      )}

      {records.length > 0 && (
        <div className="billing-cards-grid">
          {records.map((record) => (
            <div className="billing-card" key={record._id}>
              <div className="billing-card-top">
                <div>
                  <h3>Order {record.orderNumber}</h3>
                  <p>Confirmed: {formatDate(record.createdAt)}</p>
                </div>
                <span className={`billing-status ${record.paymentStatus || 'pending'}`}>
                  {record.paymentStatus || 'pending'}
                </span>
              </div>

              <div className="billing-details">
                <div className="billing-row"><span>Bill No</span><strong>{record.invoice?.billNumber || 'N/A'}</strong></div>
                <div className="billing-row"><span>Invoice No</span><strong>{record.invoice?.invoiceNumber || 'N/A'}</strong></div>
                <div className="billing-row"><span>Invoice Date</span><strong>{formatDate(record.invoice?.issueDate)}</strong></div>
                <div className="billing-row"><span>Customer NOC No</span><strong>{record.invoice?.customerNocNumber || 'N/A'}</strong></div>
                <div className="billing-row"><span>Payment Type</span><strong>{isInstallmentPayment(record) ? 'Monthly Installment' : 'Full Payment'}</strong></div>
                <div className="billing-row"><span>Total Price</span><strong>{formatCurrency(record.totalPrice)}</strong></div>
                <div className="billing-row"><span>Discount</span><strong>{formatCurrency(record.invoice?.discountAmount)}</strong></div>
                <div className="billing-row"><span>Cash Payable</span><strong>{formatCurrency(record.invoice?.cashPayable ?? record.invoice?.dueAmount)}</strong></div>
                <div className="billing-row"><span>Paid Amount</span><strong>{formatCurrency(record.invoice?.paidAmount ?? record.paidPrice)}</strong></div>
                <div className="billing-row"><span>Balance</span><strong>{formatCurrency(record.invoice?.balanceAmount)}</strong></div>
                <div className="billing-row"><span>Warranty</span><strong>{record.invoice?.warrantyMonths || 0} months</strong></div>
                {isInstallmentPayment(record) && (
                  <>
                    <div className="billing-row"><span>Advance Price</span><strong>{formatCurrency(record.advancePaidPrice)}</strong></div>
                    <div className="billing-row"><span>Monthly Installment</span><strong>{formatCurrency(record.monthlyInstallment)}</strong></div>
                    <div className="billing-row"><span>Total Installments</span><strong>{record.totalInstallments || 0}</strong></div>
                    <div className="billing-row"><span>Paid Installments</span><strong>{record.paidInstallments || 0}</strong></div>
                    <div className="billing-row"><span>Remaining Months</span><strong>{record.remainingMonths ?? getRemainingMonths(record)}</strong></div>
                  </>
                )}
              </div>

              {record.invoice?.notes && (
                <div className="billing-notes">
                  <span>Invoice Notes</span>
                  <p>{record.invoice.notes}</p>
                </div>
              )}

              <div className="billing-actions">
                <button 
                  onClick={() => downloadInvoicePDF(record)}
                  className="download-invoice-btn"
                  title="Download Invoice as PDF"
                >
                  ⬇️ Download Invoice
                </button>
                <button onClick={() => navigate(`/orders/${record.order?._id}`)}>
                  View Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingInvoice;
