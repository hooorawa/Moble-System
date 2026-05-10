import CardReload from '../models/cardReloadModel.js';

const ENTRY_TYPES = ['add-card', 'add-stock', 'daily-sales'];
const MODES = ['card', 'reload'];

const isNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

const getCurrentAvailableQty = async (mode, cardType, amount, excludeRecordId = null) => {
  const query = {
    mode,
    cardType,
    amount,
    entryType: { $in: ['add-stock', 'daily-sales'] }
  };

  if (excludeRecordId) {
    query._id = { $ne: excludeRecordId };
  }

  const history = await CardReload.find(query).sort({ createdAt: 1, _id: 1 });

  let available = 0;

  for (const item of history) {
    if (item.entryType === 'add-stock') {
      available += Number(item.newQty || 0);
    }

    if (item.entryType === 'daily-sales') {
      available = Math.max(0, available - Number(item.qtySold || item.dailySalesQty || 0));
    }
  }

  return available;
};

const normalizeRecordPayload = (payload) => {
  const mode = (payload.mode || '').trim().toLowerCase();
  const entryType = (payload.entryType || '').trim().toLowerCase();
  const cardType = (payload.cardType || '').trim();

  if (!MODES.includes(mode)) {
    return { error: 'Mode must be either card or reload' };
  }

  if (!ENTRY_TYPES.includes(entryType)) {
    return { error: 'Entry type must be add-card, add-stock, or daily-sales' };
  }

  if (!cardType) {
    return { error: 'Card type is required' };
  }

  if (!isNonNegativeNumber(payload.amount)) {
    return { error: 'Amount must be a non-negative number' };
  }

  const normalized = {
    mode,
    entryType,
    cardType,
    amount: Number(payload.amount),
    availableQty: 0,
    newQty: 0,
    dailySalesQty: 0,
    qtySold: 0,
    qtyAvl: 0,
    profit: 0,
    commission: 0,
    totalProfit: 0,
    soldAmount: 0,
    availableAmount: 0,
    newAmount: 0
  };

  if (payload.commission !== undefined) {
    if (!isNonNegativeNumber(payload.commission)) {
      return { error: 'Commission must be a non-negative number' };
    }
    normalized.commission = Number(payload.commission);
  }

  if (entryType === 'add-stock') {
    if (!isNonNegativeNumber(payload.newQty)) {
      return { error: 'New quantity must be a non-negative number for add stock' };
    }
    if (Number(payload.newQty) <= 0) {
      return { error: 'New quantity must be greater than 0 for add stock' };
    }
    normalized.newQty = Number(payload.newQty);
  }

  if (entryType === 'daily-sales') {
    if (!isNonNegativeNumber(payload.qtySold)) {
      return { error: 'Daily sold quantity must be a non-negative number' };
    }
    if (Number(payload.qtySold) <= 0) {
      return { error: 'Daily sold quantity must be greater than 0' };
    }
    normalized.qtySold = Number(payload.qtySold);
    normalized.dailySalesQty = Number(payload.qtySold);
  }

  return { data: normalized };
};

const buildComputedRecord = async (normalizedData, excludeRecordId = null) => {
  const amount = Number(normalizedData.amount);
  const currentAvailable = await getCurrentAvailableQty(
    normalizedData.mode,
    normalizedData.cardType,
    amount,
    excludeRecordId
  );

  const computed = {
    ...normalizedData,
    availableQty: 0,
    qtyAvl: 0,
    profit: 0,
    commission: Number(normalizedData.commission || 0),
    totalProfit: 0,
    soldAmount: 0,
    availableAmount: 0,
    newAmount: 0
  };

  if (normalizedData.entryType === 'add-stock') {
    const nextAvailable = currentAvailable + Number(normalizedData.newQty);
    computed.availableQty = currentAvailable;
    computed.qtyAvl = nextAvailable;
    computed.availableAmount = Number((currentAvailable * amount).toFixed(2));
    computed.newAmount = Number((Number(normalizedData.newQty) * amount).toFixed(2));
  }

  if (normalizedData.entryType === 'daily-sales') {
    const soldQty = Number(normalizedData.qtySold);

    if (soldQty > currentAvailable) {
      return { error: `Insufficient available quantity. Available: ${currentAvailable}` };
    }

    const remainingQty = currentAvailable - soldQty;
    const profit = soldQty * amount * 0.04;
    const commission = Number(normalizedData.commission || 0);

    computed.availableQty = currentAvailable;
    computed.qtyAvl = remainingQty;
    computed.profit = Number(profit.toFixed(2));
    computed.commission = Number(commission.toFixed(2));
    computed.totalProfit = Number((computed.profit + computed.commission).toFixed(2));
    computed.soldAmount = Number((soldQty * amount).toFixed(2));
    computed.availableAmount = Number((remainingQty * amount).toFixed(2));
  }

  return { data: computed };
};

export const createCardReloadRecord = async (req, res) => {
  try {
    const validated = normalizeRecordPayload(req.body);

    if (validated.error) {
      return res.status(400).json({
        success: false,
        message: validated.error
      });
    }

    const computed = await buildComputedRecord(validated.data);
    if (computed.error) {
      return res.status(400).json({
        success: false,
        message: computed.error
      });
    }

    const createdBy = req.admin?._id;
    const createdByModel = req.isEmployer ? 'Employer' : 'Admin';

    const record = await CardReload.create({
      ...computed.data,
      createdBy,
      createdByModel
    });

    return res.status(201).json({
      success: true,
      message: 'Card/Reload record created successfully',
      data: record
    });
  } catch (error) {
    console.error('Create card/reload record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating card/reload record',
      error: error.message
    });
  }
};

export const getCardReloadRecords = async (req, res) => {
  try {
    const { mode, entryType, page = 1, limit = 200 } = req.query;
    const query = {};

    if (mode && MODES.includes(String(mode).toLowerCase())) {
      query.mode = String(mode).toLowerCase();
    }

    if (entryType && ENTRY_TYPES.includes(String(entryType).toLowerCase())) {
      query.entryType = String(entryType).toLowerCase();
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);

    const records = await CardReload.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('createdBy', 'name email');

    const total = await CardReload.countDocuments(query);

    return res.json({
      success: true,
      data: {
        records,
        pagination: {
          currentPage: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get card/reload records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching card/reload records',
      error: error.message
    });
  }
};

export const updateCardReloadRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const existing = await CardReload.findById(recordId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    if (existing.entryType === 'daily-sales' && req.body.commission !== undefined) {
      if (!isNonNegativeNumber(req.body.commission)) {
        return res.status(400).json({
          success: false,
          message: 'Commission must be a non-negative number'
        });
      }

      const commission = Number(req.body.commission);
      const totalProfit = Number((Number(existing.profit || 0) + commission).toFixed(2));

      const updatedCommission = await CardReload.findByIdAndUpdate(
        recordId,
        { commission, totalProfit },
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: 'Commission updated successfully',
        data: updatedCommission
      });
    }

    const merged = {
      mode: req.body.mode ?? existing.mode,
      entryType: req.body.entryType ?? existing.entryType,
      cardType: req.body.cardType ?? existing.cardType,
      amount: req.body.amount ?? existing.amount,
      newQty: req.body.newQty ?? existing.newQty,
      qtySold: req.body.qtySold ?? existing.qtySold,
      commission: req.body.commission ?? existing.commission
    };

    const validated = normalizeRecordPayload(merged);
    if (validated.error) {
      return res.status(400).json({
        success: false,
        message: validated.error
      });
    }

    const computed = await buildComputedRecord(validated.data, recordId);
    if (computed.error) {
      return res.status(400).json({
        success: false,
        message: computed.error
      });
    }

    const updated = await CardReload.findByIdAndUpdate(recordId, computed.data, {
      new: true,
      runValidators: true
    });

    return res.json({
      success: true,
      message: 'Card/Reload record updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update card/reload record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating card/reload record',
      error: error.message
    });
  }
};

export const deleteCardReloadRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await CardReload.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    await CardReload.findByIdAndDelete(recordId);

    return res.json({
      success: true,
      message: 'Card/Reload record deleted successfully'
    });
  } catch (error) {
    console.error('Delete card/reload record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting card/reload record',
      error: error.message
    });
  }
};
