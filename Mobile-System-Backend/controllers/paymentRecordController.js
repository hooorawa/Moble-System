import PaymentRecord from '../models/paymentRecordModel.js';
import Order from '../models/orderModel.js';
import Customer from '../models/customerModel.js';

const parseOptionalNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseOptionalInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const calculateRemainingMonths = (totalInstallments = 0, paidInstallments = 0) => {
  return Math.max(totalInstallments - paidInstallments, 0);
};

const resolvePaymentPlanType = (paymentPlanType, monthlyInstallment, totalInstallments, paidInstallments) => {
  if (paymentPlanType === 'full' || paymentPlanType === 'installment') {
    return paymentPlanType;
  }

  return Number(monthlyInstallment) > 0 || Number(totalInstallments) > 0 || Number(paidInstallments) > 0
    ? 'installment'
    : 'full';
};

const generateAutoNumber = async (type) => {
  try {
    // Get count of existing payment records to generate sequential number
    const count = await PaymentRecord.countDocuments();
    // Bills start at 10001, Invoices start at 20001
    const baseNumber = type === 'BILL' ? 10001 : 20001;
    const sequentialNumber = count + baseNumber;
    return String(sequentialNumber);
  } catch (error) {
    // Fallback to timestamp-based number if count fails
    const now = new Date();
    const baseNumber = type === 'BILL' ? 10000 : 20000;
    const uniqueNumber = baseNumber + parseInt(String(now.getTime()).slice(-4));
    return String(uniqueNumber);
  }
};

// Create payment record when admin confirms payment
export const createPaymentRecord = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      notes = '',
      totalPrice,
      paidPrice,
      paymentPlanType,
      advancePaidPrice = 0,
      monthlyInstallment = 0,
      remainingBalance,
      totalInstallments = 0,
      paidInstallments = 0,
      customerMobile = '',
      billNumber = '',
      invoiceNumber = '',
      invoiceIssueDate,
      customerNocNumber = '',
      discountAmount = 0,
      cashPayable,
      dueAmount,
      paidAmount,
      balanceAmount,
      warrantyMonths = 0,
      invoiceNotes = ''
    } = req.body;
    const adminId = req.admin?._id;
    const adminType = req.isEmployer ? 'Employer' : 'Admin';

    // Find the order
    const order = await Order.findById(orderId).populate('customer');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment record already exists
    const existingRecord = await PaymentRecord.findOne({ order: orderId });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Payment record already exists for this order'
      });
    }

    // Validate required fields
    if (!totalPrice || !paidPrice) {
      return res.status(400).json({
        success: false,
        message: 'Total price and paid price are required'
      });
    }

    const parsedTotalPrice = parseFloat(totalPrice);
    const parsedPaidPrice = parseFloat(paidPrice);
    const parsedDiscountAmount = parseFloat(discountAmount) || 0;
    const normalizedDiscountAmount = Math.max(parsedDiscountAmount, 0);
    const fallbackCashPayable = Math.max(parsedTotalPrice - normalizedDiscountAmount, 0);
    const parsedCashPayable = cashPayable !== undefined ? (parseFloat(cashPayable) || 0) : fallbackCashPayable;
    const parsedPaidAmount = paidAmount !== undefined ? (parseFloat(paidAmount) || 0) : parsedPaidPrice;
    const parsedDueAmount = dueAmount !== undefined
      ? (parseFloat(dueAmount) || 0)
      : parsedCashPayable;
    const parsedBalanceAmount = balanceAmount !== undefined
      ? (parseFloat(balanceAmount) || 0)
      : Math.max(parsedDueAmount - parsedPaidAmount, 0);
    const parsedAdvancePaidPrice = parseOptionalNumber(advancePaidPrice, 0);
    const parsedMonthlyInstallment = parseOptionalNumber(monthlyInstallment, 0);
    const parsedRemainingBalance = remainingBalance !== undefined
      ? parseOptionalNumber(remainingBalance, 0)
      : parsedBalanceAmount;
    const parsedTotalInstallments = parseOptionalInteger(totalInstallments, 0);
    const parsedPaidInstallments = parseOptionalInteger(paidInstallments, 0);
    const resolvedPaymentPlanType = resolvePaymentPlanType(
      paymentPlanType,
      monthlyInstallment,
      totalInstallments,
      paidInstallments
    );

    if (Number.isNaN(parsedTotalPrice) || Number.isNaN(parsedPaidPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Total price and paid price must be valid numbers'
      });
    }

    if (
      Number.isNaN(parsedAdvancePaidPrice) ||
      Number.isNaN(parsedMonthlyInstallment) ||
      Number.isNaN(parsedRemainingBalance)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Installment amounts must be valid numbers'
      });
    }

    if (
      Number.isNaN(parsedTotalInstallments) ||
      Number.isNaN(parsedPaidInstallments) ||
      parsedTotalInstallments < 0 ||
      parsedPaidInstallments < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Installment counts must be valid non-negative numbers'
      });
    }

    const parsedRemainingMonths = calculateRemainingMonths(parsedTotalInstallments, parsedPaidInstallments);
    const normalizedAdvancePaidPrice = resolvedPaymentPlanType === 'installment' ? parsedAdvancePaidPrice : 0;
    const normalizedMonthlyInstallment = resolvedPaymentPlanType === 'installment' ? parsedMonthlyInstallment : 0;
    const normalizedRemainingBalance = resolvedPaymentPlanType === 'installment' ? parsedRemainingBalance : 0;
    const normalizedTotalInstallments = resolvedPaymentPlanType === 'installment' ? parsedTotalInstallments : 0;
    const normalizedPaidInstallments = resolvedPaymentPlanType === 'installment' ? parsedPaidInstallments : 0;
    const normalizedRemainingMonths = resolvedPaymentPlanType === 'installment' ? parsedRemainingMonths : 0;

    const computedPaymentStatus = parsedBalanceAmount > 0 ? 'partial' : 'paid';

    const resolvedBillNumber = (billNumber || '').trim() || await generateAutoNumber('BILL');
    const resolvedInvoiceNumber = (invoiceNumber || '').trim() || await generateAutoNumber('INV');

    // Create payment record
    const paymentRecord = new PaymentRecord({
      order: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer._id,
      customerMobile: customerMobile || order.customer.phoneNumber || '',
      paymentMethod: order.paymentMethod,
      amount: order.total,
      totalPrice: parsedTotalPrice,
      paidPrice: parsedPaidPrice,
      paymentPlanType: resolvedPaymentPlanType,
      advancePaidPrice: normalizedAdvancePaidPrice,
      monthlyInstallment: normalizedMonthlyInstallment,
      remainingBalance: normalizedRemainingBalance,
      totalInstallments: normalizedTotalInstallments,
      paidInstallments: normalizedPaidInstallments,
      remainingMonths: normalizedRemainingMonths,
      invoice: {
        billNumber: resolvedBillNumber,
        invoiceNumber: resolvedInvoiceNumber,
        issueDate: invoiceIssueDate ? new Date(invoiceIssueDate) : new Date(),
        customerNocNumber,
        discountAmount: normalizedDiscountAmount,
        cashPayable: parsedCashPayable,
        dueAmount: parsedDueAmount,
        paidAmount: parsedPaidAmount,
        balanceAmount: parsedBalanceAmount,
        warrantyMonths: parseInt(warrantyMonths, 10) || 0,
        notes: invoiceNotes
      },
      paymentStatus: computedPaymentStatus,
      confirmedBy: adminId,
      confirmedByModel: adminType,
      notes
    });

    await paymentRecord.save();

    // Update order payment status
    order.paymentStatus = computedPaymentStatus === 'partial' ? 'pending' : 'paid';
    await order.save();

    // Populate the record before sending response
    await paymentRecord.populate([
      { path: 'customer', select: 'name email' },
      { path: 'order', select: 'orderNumber status' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment record created successfully',
      data: paymentRecord
    });

  } catch (error) {
    console.error('Create payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment record',
      error: error.message
    });
  }
};

// Get all payment records
export const getAllPaymentRecords = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    const query = {};
    if (status) query.paymentStatus = status;

    const records = await PaymentRecord.find(query)
      .populate('customer', 'name email')
      .populate({
        path: 'order',
        select: 'orderNumber status orderProducts',
        populate: {
          path: 'orderProducts',
          populate: {
            path: 'product',
            select: 'name emiNumber'
          }
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentRecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Get payment records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment records',
      error: error.message
    });
  }
};

// Get logged-in customer payment records for Billing & Invoice page
export const getMyPaymentRecords = async (req, res) => {
  try {
    const customerId = req.user?.userId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const records = await PaymentRecord.find({ customer: customerId })
      .populate('customer', 'name email phoneNumber')
      .populate({
        path: 'order',
        select: 'orderNumber status paymentStatus total createdAt orderProducts',
        populate: {
          path: 'orderProducts',
          populate: {
            path: 'product',
            select: 'name emiNumber'
          }
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get my payment records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing and invoice records',
      error: error.message
    });
  }
};

// Get single payment record
export const getPaymentRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await PaymentRecord.findById(recordId)
      .populate('customer', 'name email phoneNumber')
      .populate({
        path: 'order',
        select: 'orderNumber status deliveryAddress billingAddress orderProducts',
        populate: {
          path: 'orderProducts',
          populate: {
            path: 'product',
            select: 'name emiNumber'
          }
        }
      })
      .populate('confirmedBy', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Get payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment record',
      error: error.message
    });
  }
};

// Update payment record
export const updatePaymentRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerMobile,
      paymentMethodType,
      totalPrice,
      paidPrice,
      paymentPlanType,
      advancePaidPrice,
      monthlyInstallment,
      remainingBalance,
      totalInstallments,
      paidInstallments,
      remainingMonths,
      confirmedAt,
      notes,
      paymentStatus,
      billNumber,
      invoiceNumber,
      invoiceIssueDate,
      customerNocNumber,
      discountAmount,
      cashPayable,
      dueAmount,
      paidAmount,
      balanceAmount,
      warrantyMonths,
      invoiceNotes
    } = req.body;

    const record = await PaymentRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (paymentStatus && !['paid', 'partial', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    if (confirmedAt !== undefined) {
      const parsedConfirmedAt = new Date(confirmedAt);
      if (Number.isNaN(parsedConfirmedAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Confirmed at must be a valid date'
        });
      }
    }

    if (totalPrice !== undefined) {
      const parsedTotalPrice = parseFloat(totalPrice);
      if (Number.isNaN(parsedTotalPrice)) {
        return res.status(400).json({
          success: false,
          message: 'Total price must be a valid number'
        });
      }
      record.totalPrice = parsedTotalPrice;
    }

    if (paidPrice !== undefined) {
      const parsedPaidPrice = parseFloat(paidPrice);
      if (Number.isNaN(parsedPaidPrice)) {
        return res.status(400).json({
          success: false,
          message: 'Paid price must be a valid number'
        });
      }
      record.paidPrice = parsedPaidPrice;
    }

    const nextTotalInstallments = totalInstallments !== undefined
      ? parseOptionalInteger(totalInstallments)
      : record.totalInstallments || 0;
    const nextPaidInstallments = paidInstallments !== undefined
      ? parseOptionalInteger(paidInstallments)
      : record.paidInstallments || 0;
    const nextMonthlyInstallment = monthlyInstallment !== undefined
      ? parseOptionalNumber(monthlyInstallment)
      : record.monthlyInstallment || 0;
    const nextPaymentPlanType = resolvePaymentPlanType(
      paymentPlanType ?? record.paymentPlanType,
      nextMonthlyInstallment,
      nextTotalInstallments,
      nextPaidInstallments
    );

    if (paymentPlanType !== undefined && !['full', 'installment'].includes(nextPaymentPlanType)) {
      return res.status(400).json({
        success: false,
        message: 'Payment plan type must be full or installment'
      });
    }

    record.paymentPlanType = nextPaymentPlanType;

    if (advancePaidPrice !== undefined) {
      const parsedAdvancePaidPrice = parseOptionalNumber(advancePaidPrice);
      if (Number.isNaN(parsedAdvancePaidPrice)) {
        return res.status(400).json({
          success: false,
          message: 'Advance paid price must be a valid number'
        });
      }
      record.advancePaidPrice = nextPaymentPlanType === 'installment' ? parsedAdvancePaidPrice : 0;
    }

    if (monthlyInstallment !== undefined) {
      const parsedMonthlyInstallment = parseOptionalNumber(monthlyInstallment);
      if (Number.isNaN(parsedMonthlyInstallment)) {
        return res.status(400).json({
          success: false,
          message: 'Monthly installment must be a valid number'
        });
      }
      record.monthlyInstallment = nextPaymentPlanType === 'installment' ? parsedMonthlyInstallment : 0;
    }

    if (remainingBalance !== undefined) {
      const parsedRemainingBalance = parseOptionalNumber(remainingBalance);
      if (Number.isNaN(parsedRemainingBalance)) {
        return res.status(400).json({
          success: false,
          message: 'Remaining balance must be a valid number'
        });
      }
      record.remainingBalance = nextPaymentPlanType === 'installment' ? parsedRemainingBalance : 0;
    }

    if (
      Number.isNaN(nextTotalInstallments) ||
      Number.isNaN(nextPaidInstallments) ||
      nextTotalInstallments < 0 ||
      nextPaidInstallments < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Installment counts must be valid non-negative numbers'
      });
    }

    record.totalInstallments = nextPaymentPlanType === 'installment' ? nextTotalInstallments : 0;
    record.paidInstallments = nextPaymentPlanType === 'installment' ? nextPaidInstallments : 0;
    record.remainingMonths = nextPaymentPlanType === 'installment'
      ? calculateRemainingMonths(nextTotalInstallments, nextPaidInstallments)
      : 0;

    if (remainingMonths !== undefined) {
      record.remainingMonths = nextPaymentPlanType === 'installment'
        ? calculateRemainingMonths(nextTotalInstallments, nextPaidInstallments)
        : 0;
    }

    if (orderNumber !== undefined) record.orderNumber = orderNumber;
    if (customerMobile !== undefined) record.customerMobile = customerMobile;
    if (paymentMethodType !== undefined) {
      if (!record.paymentMethod) {
        record.paymentMethod = { type: paymentMethodType };
      } else {
        record.paymentMethod.type = paymentMethodType;
      }
    }
    if (notes !== undefined) record.notes = notes;
    if (paymentStatus !== undefined) record.paymentStatus = paymentStatus;

    if (!record.invoice) {
      record.invoice = {};
    }

    if (billNumber !== undefined) record.invoice.billNumber = billNumber;
    if (invoiceNumber !== undefined) record.invoice.invoiceNumber = invoiceNumber;
    if (invoiceIssueDate !== undefined) {
      const parsedIssueDate = new Date(invoiceIssueDate);
      if (Number.isNaN(parsedIssueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invoice issue date must be a valid date'
        });
      }
      record.invoice.issueDate = parsedIssueDate;
    }
    if (discountAmount !== undefined) {
      const parsedDiscountAmount = parseFloat(discountAmount);
      if (Number.isNaN(parsedDiscountAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Discount amount must be a valid number'
        });
      }
      record.invoice.discountAmount = parsedDiscountAmount;
    }
    if (cashPayable !== undefined) {
      const parsedCashPayable = parseFloat(cashPayable);
      if (Number.isNaN(parsedCashPayable)) {
        return res.status(400).json({
          success: false,
          message: 'Cash payable must be a valid number'
        });
      }
      record.invoice.cashPayable = parsedCashPayable;
    }
    if (customerNocNumber !== undefined) record.invoice.customerNocNumber = customerNocNumber;
    if (dueAmount !== undefined) {
      const parsedDueAmount = parseFloat(dueAmount);
      if (Number.isNaN(parsedDueAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Due amount must be a valid number'
        });
      }
      record.invoice.dueAmount = parsedDueAmount;
    }
    if (paidAmount !== undefined) {
      const parsedPaidAmount = parseFloat(paidAmount);
      if (Number.isNaN(parsedPaidAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Paid amount must be a valid number'
        });
      }
      record.invoice.paidAmount = parsedPaidAmount;
    }
    if (balanceAmount !== undefined) {
      const parsedBalanceAmount = parseFloat(balanceAmount);
      if (Number.isNaN(parsedBalanceAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Balance amount must be a valid number'
        });
      }
      record.invoice.balanceAmount = parsedBalanceAmount;
    }
    if (warrantyMonths !== undefined) {
      const parsedWarrantyMonths = parseInt(warrantyMonths, 10);
      if (Number.isNaN(parsedWarrantyMonths)) {
        return res.status(400).json({
          success: false,
          message: 'Warranty months must be a valid number'
        });
      }
      record.invoice.warrantyMonths = parsedWarrantyMonths;
    }
    if (invoiceNotes !== undefined) record.invoice.notes = invoiceNotes;

    // Keep invoice summary fields in sync with top-level payment values so billing/invoice pages
    // always show the latest updated payment record values.
    const effectiveTotalPrice = Number(record.totalPrice || 0);
    const effectivePaidPrice = Number(record.paidPrice || 0);
    const effectiveDiscount = Number(record.invoice.discountAmount || 0);
    const computedCashPayable = Math.max(effectiveTotalPrice - effectiveDiscount, 0);

    if (cashPayable === undefined) {
      record.invoice.cashPayable = computedCashPayable;
    }

    if (dueAmount === undefined) {
      record.invoice.dueAmount = Number(record.invoice.cashPayable ?? computedCashPayable);
    }

    if (paidAmount === undefined) {
      record.invoice.paidAmount = effectivePaidPrice;
    }

    if (balanceAmount === undefined) {
      const explicitRemaining = remainingBalance !== undefined
        ? Number(record.remainingBalance || 0)
        : null;

      const computedBalance = explicitRemaining !== null
        ? explicitRemaining
        : Math.max(
          Number(record.invoice.dueAmount ?? computedCashPayable) - Number(record.invoice.paidAmount ?? effectivePaidPrice),
          0
        );

      record.invoice.balanceAmount = computedBalance;
    }

    const effectivePaymentStatus = paymentStatus !== undefined
      ? paymentStatus
      : (Number(record.invoice.balanceAmount || 0) > 0 ? 'partial' : 'paid');

    if (paymentStatus === undefined || record.paymentStatus !== 'refunded') {
      record.paymentStatus = effectivePaymentStatus;
    }

    await record.save();

    if (confirmedAt !== undefined) {
      await PaymentRecord.collection.updateOne(
        { _id: record._id },
        { $set: { createdAt: new Date(confirmedAt) } }
      );
    }

    // Update linked customer details if provided
    if (record.customer && (customerName !== undefined || customerEmail !== undefined)) {
      const customerUpdateData = {};
      if (customerName !== undefined) customerUpdateData.name = customerName;
      if (customerEmail !== undefined) customerUpdateData.email = customerEmail;

      if (Object.keys(customerUpdateData).length > 0) {
        await Customer.findByIdAndUpdate(record.customer, customerUpdateData, { runValidators: true });
      }
    }

    const updatedRecord = await PaymentRecord.findById(recordId).populate([
      { path: 'customer', select: 'name email' },
      { path: 'order', select: 'orderNumber status' }
    ]);

    // Keep order payment status in sync with the effective updated payment status
    if (effectivePaymentStatus === 'refunded') {
      await Order.findByIdAndUpdate(record.order, { paymentStatus: 'refunded' });
    } else if (effectivePaymentStatus === 'partial') {
      await Order.findByIdAndUpdate(record.order, { paymentStatus: 'pending' });
    } else if (effectivePaymentStatus === 'paid') {
      await Order.findByIdAndUpdate(record.order, { paymentStatus: 'paid' });
    }

    res.json({
      success: true,
      message: 'Payment record updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error('Update payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment record',
      error: error.message
    });
  }
};

// Delete payment record
export const deletePaymentRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await PaymentRecord.findById(recordId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update order payment status back to pending
    await Order.findByIdAndUpdate(record.order, { paymentStatus: 'pending' });

    // Delete the record
    await PaymentRecord.findByIdAndDelete(recordId);

    res.json({
      success: true,
      message: 'Payment record deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment record',
      error: error.message
    });
  }
};
