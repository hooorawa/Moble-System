import React, { useEffect, useMemo, useRef, useState } from 'react';
import './AdminCardReload.css';
import ApiService from '../../../services/api';
import reload_icon from '../../../Assets/reload.png';

const FORM_TITLES = {
  'add-card': 'Add Card',
  'add-stock': 'Add Stock',
  'daily-sales': 'Daily Sales'
};

const AdminCardReload = () => {
  const [mode, setMode] = useState('card');
  const [entryType, setEntryType] = useState('add-card');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cardTypes, setCardTypes] = useState([]);
  const [reloadTypes, setReloadTypes] = useState([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionRecord, setCommissionRecord] = useState(null);
  const [commissionValue, setCommissionValue] = useState('0');
  const [commissionSubmitting, setCommissionSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [typeError, setTypeError] = useState('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);
  const [form, setForm] = useState({
    cardType: '',
    amount: '',
    availableQty: '',
    newQty: '',
    dailySalesQty: '',
    qtySold: '',
    qtyAvl: '',
    profit: '',
    soldAmount: '',
    availableAmount: '',
    newAmount: ''
  });
  const [editForm, setEditForm] = useState({
    cardType: '',
    amount: '',
    newQty: '',
    qtySold: '',
    commission: ''
  });
  const [profitPeriod, setProfitPeriod] = useState('all');

  const getProfitDateRange = (period) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'daily':
        return { start: startOfToday, end: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) };
      case 'weekly':
        const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: sevenDaysAgo, end: new Date() };
      case 'monthly':
        const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: thirtyDaysAgo, end: new Date() };
      default:
        return { start: new Date(0), end: new Date() };
    }
  };

  const calculateProfitByPeriod = (period, modeFilter) => {
    const { start, end } = getProfitDateRange(period);
    const salesRecords = records.filter((r) => 
      r.mode === modeFilter && 
      r.entryType === 'daily-sales' && 
      new Date(r.createdAt) >= start && 
      new Date(r.createdAt) <= end
    );

    const totalProfit = salesRecords.reduce((sum, record) => {
      return sum + Number(record.totalProfit || (Number(record.profit || 0) + Number(record.commission || 0)));
    }, 0);

    return {
      total: Number(totalProfit.toFixed(2)),
      count: salesRecords.length,
      profit: Number(salesRecords.reduce((sum, r) => sum + Number(r.profit || 0), 0).toFixed(2)),
      commission: Number(salesRecords.reduce((sum, r) => sum + Number(r.commission || 0), 0).toFixed(2))
    };
  };

  const fetchRecords = async (selectedMode = mode) => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getCardReloadRecords({ mode: selectedMode, page: 1, limit: 300 });
      if (response.success) {
        setRecords(response.data.records || []);
      } else {
        setError(response.message || 'Failed to fetch records');
      }
    } catch (fetchError) {
      console.error('Fetch card/reload records error:', fetchError);
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const fetchCardTypes = async () => {
    try {
      const response = await ApiService.getCardTypes();
      if (response.success) {
        setCardTypes(response.data || []);
      }
    } catch (err) {
      console.error('Fetch card types error:', err);
    }
  };

  const fetchReloadTypes = async () => {
    try {
      const response = await ApiService.getReloadTypes();
      if (response.success) {
        setReloadTypes(response.data || []);
      }
    } catch (err) {
      console.error('Fetch reload types error:', err);
    }
  };

  const handleAddNewType = async (e) => {
    e.preventDefault();
    
    if (!newTypeName.trim()) {
      setTypeError('Type name is required');
      return;
    }

    try {
      setAddingType(true);
      setTypeError('');
      
      if (mode === 'card') {
        const response = await ApiService.createCardType({ typeName: newTypeName.trim() });
        if (response.success) {
          setNewTypeName('');
          setShowAddTypeModal(false);
          setForm((prev) => ({ ...prev, cardType: response.data._id }));
          fetchCardTypes();
        } else {
          setTypeError(response.message || 'Failed to create card type');
        }
      } else {
        const response = await ApiService.createReloadType({ typeName: newTypeName.trim() });
        if (response.success) {
          setNewTypeName('');
          setShowAddTypeModal(false);
          setForm((prev) => ({ ...prev, cardType: response.data._id }));
          fetchReloadTypes();
        } else {
          setTypeError(response.message || 'Failed to create reload type');
        }
      }
    } catch (err) {
      console.error('Add type error:', err);
      setTypeError(err.message || 'Failed to add new type');
    } finally {
      setAddingType(false);
    }
  };

  useEffect(() => {
    fetchRecords(mode);
    fetchCardTypes();
    fetchReloadTypes();
  }, [mode]);

  const groupedRecords = useMemo(() => ({
    'add-card': records.filter((record) => record.entryType === 'add-card'),
    'add-stock': records.filter((record) => record.entryType === 'add-stock'),
    'daily-sales': records.filter((record) => record.entryType === 'daily-sales')
  }), [records]);

  const profitSummary = useMemo(() => ({
    card: calculateProfitByPeriod(profitPeriod, 'card'),
    reload: calculateProfitByPeriod(profitPeriod, 'reload')
  }), [records, profitPeriod]);

  const activeTypes = mode === 'card' ? cardTypes : reloadTypes;
  const selectedTypeLabel = activeTypes.find((type) => type._id === form.cardType)?.typeName;

  const amountOptions = useMemo(() => {
    if (!selectedTypeLabel) return [];

    const uniqueAmounts = new Set();
    records.forEach((record) => {
      if (record.entryType === 'add-card' && record.cardType === selectedTypeLabel) {
        uniqueAmounts.add(Number(record.amount));
      }
    });

    return Array.from(uniqueAmounts).sort((a, b) => a - b);
  }, [records, selectedTypeLabel]);

  const currentAvailableQty = useMemo(() => {
    if (!selectedTypeLabel || form.amount === '' || Number(form.amount) <= 0) return 0;

    const targetAmount = Number(form.amount);
    const scoped = records
      .filter((record) => record.cardType === selectedTypeLabel && Number(record.amount) === targetAmount)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let available = 0;
    scoped.forEach((record) => {
      if (record.entryType === 'add-stock') {
        available += Number(record.newQty || 0);
      }
      if (record.entryType === 'daily-sales') {
        available = Math.max(0, available - Number(record.qtySold || record.dailySalesQty || 0));
      }
    });

    return available;
  }, [records, selectedTypeLabel, form.amount]);

  const computedRemainingQty = Math.max(0, currentAvailableQty - Number(form.qtySold || 0));
  const computedProfit = Number((Number(form.qtySold || 0) * Number(form.amount || 0) * 0.04).toFixed(2));

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetFormForType = (selectedType) => {
    setEntryType(selectedType);
    setIsTypeDropdownOpen(false);
    setForm({
      cardType: '',
      amount: '',
      availableQty: '',
      newQty: '',
      dailySalesQty: '',
      qtySold: '',
      qtyAvl: '',
      profit: '',
      soldAmount: '',
      availableAmount: '',
      newAmount: ''
    });
  };

  const handleDeleteType = async (typeId, typeName) => {
    const confirmed = window.confirm(`Delete type "${typeName}"?`);
    if (!confirmed) return;

    try {
      if (mode === 'card') {
        const response = await ApiService.deleteCardType(typeId);
        if (!response.success) {
          alert(response.message || 'Failed to delete card type');
          return;
        }
        await fetchCardTypes();
      } else {
        const response = await ApiService.deleteReloadType(typeId);
        if (!response.success) {
          alert(response.message || 'Failed to delete reload type');
          return;
        }
        await fetchReloadTypes();
      }

      setForm((prev) => ({
        ...prev,
        cardType: prev.cardType === typeId ? '' : prev.cardType
      }));
      setIsTypeDropdownOpen(false);
    } catch (deleteError) {
      console.error('Delete type error:', deleteError);
      alert(deleteError.message || 'Failed to delete type');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.cardType) {
      alert(mode === 'card' ? 'Please select a card type' : 'Please select a reload type');
      return;
    }

    // Get the type name from the selected type ID
    const typesList = mode === 'card' ? cardTypes : reloadTypes;
    const selectedType = typesList.find((type) => type._id === form.cardType);
    if (!selectedType) {
      alert('Invalid type selected');
      return;
    }

    if (form.amount === '' || Number(form.amount) < 0) {
      alert('Amount must be a non-negative number');
      return;
    }

    // Card Mode validations
    if (mode === 'card') {
      if (entryType === 'add-stock') {
        if (form.newQty === '' || Number(form.newQty) < 0) {
          alert('New quantity must be a non-negative number');
          return;
        }
      }

      if (entryType === 'daily-sales') {
        if (form.qtySold === '' || Number(form.qtySold) < 0) {
          alert('Quantity sold must be a non-negative number');
          return;
        }
        if (Number(form.qtySold) > currentAvailableQty) {
          alert(`Insufficient stock. Available quantity is ${currentAvailableQty}`);
          return;
        }
      }
    }

    // Reload Mode validations
    if (mode === 'reload') {
      if (entryType === 'add-stock') {
        if (form.newQty === '' || Number(form.newQty) < 0) {
          alert('New quantity must be a non-negative number');
          return;
        }
      }

      if (entryType === 'daily-sales') {
        if (form.qtySold === '' || Number(form.qtySold) < 0) {
          alert('Sold quantity must be a non-negative number');
          return;
        }
        if (Number(form.qtySold) > currentAvailableQty) {
          alert(`Insufficient stock. Available quantity is ${currentAvailableQty}`);
          return;
        }
      }
    }

    const payload = {
      mode,
      entryType,
      cardType: selectedType.typeName,
      amount: Number(form.amount)
    };

    // Card Mode payload
    if (mode === 'card') {
      if (entryType === 'add-stock') {
        payload.availableQty = currentAvailableQty;
        payload.newQty = Number(form.newQty);
      }

      if (entryType === 'daily-sales') {
        payload.qtySold = Number(form.qtySold);
        payload.qtyAvl = computedRemainingQty;
        payload.profit = computedProfit;
      }
    }

    // Reload Mode payload
    if (mode === 'reload') {
      if (entryType === 'add-stock') {
        payload.availableQty = currentAvailableQty;
        payload.newQty = Number(form.newQty);
      }

      if (entryType === 'daily-sales') {
        payload.qtySold = Number(form.qtySold);
        payload.qtyAvl = computedRemainingQty;
        payload.profit = computedProfit;
      }
    }

    try {
      setSubmitting(true);
      const response = await ApiService.createCardReloadRecord(payload);
      if (response.success) {
        resetFormForType(entryType);
        fetchRecords(mode);
      }
    } catch (submitError) {
      console.error('Create card/reload record error:', submitError);
      alert(submitError.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddCommission = (record) => {
    setCommissionRecord(record);
    setCommissionValue(String(record.commission ?? 0));
    setShowCommissionModal(true);
  };

  const handleSaveCommission = async (event) => {
    event.preventDefault();
    if (!commissionRecord) return;

    const commission = Number(commissionValue);
    if (!Number.isFinite(commission) || commission < 0) {
      alert('Commission must be a non-negative number');
      return;
    }

    try {
      setCommissionSubmitting(true);
      const response = await ApiService.updateCardReloadRecord(commissionRecord._id, { commission });
      if (response.success) {
        setShowCommissionModal(false);
        setCommissionRecord(null);
        fetchRecords(mode);
      } else {
        alert(response.message || 'Failed to update commission');
      }
    } catch (commissionError) {
      console.error('Update commission error:', commissionError);
      alert(commissionError.message || 'Failed to update commission');
    } finally {
      setCommissionSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    const confirmed = window.confirm('Delete this record?');
    if (!confirmed) return;

    try {
      const response = await ApiService.deleteCardReloadRecord(recordId);
      if (response.success) {
        fetchRecords(mode);
      } else {
        alert(response.message || 'Failed to delete record');
      }
    } catch (deleteError) {
      console.error('Delete record error:', deleteError);
      alert(deleteError.message || 'Failed to delete record');
    }
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setEditForm({
      cardType: record.cardType || '',
      amount: String(record.amount ?? ''),
      newQty: String(record.newQty ?? ''),
      qtySold: String(record.qtySold ?? ''),
      commission: String(record.commission ?? 0)
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingRecord) return;

    if (!editForm.cardType.trim()) {
      alert('Type is required');
      return;
    }

    const amount = Number(editForm.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      alert('Amount must be a non-negative number');
      return;
    }

    const payload = {
      mode: editingRecord.mode,
      entryType: editingRecord.entryType,
      cardType: editForm.cardType.trim(),
      amount
    };

    if (editingRecord.entryType === 'add-stock') {
      const newQty = Number(editForm.newQty);
      if (!Number.isFinite(newQty) || newQty <= 0) {
        alert('New Qty must be greater than 0');
        return;
      }
      payload.newQty = newQty;
    }

    if (editingRecord.entryType === 'daily-sales') {
      const qtySold = Number(editForm.qtySold);
      const commission = Number(editForm.commission || 0);

      if (!Number.isFinite(qtySold) || qtySold <= 0) {
        alert('Qty Sold must be greater than 0');
        return;
      }
      if (!Number.isFinite(commission) || commission < 0) {
        alert('Commission must be a non-negative number');
        return;
      }

      payload.qtySold = qtySold;
      payload.commission = commission;
    }

    try {
      setEditSubmitting(true);
      const response = await ApiService.updateCardReloadRecord(editingRecord._id, payload);
      if (response.success) {
        setShowEditModal(false);
        setEditingRecord(null);
        fetchRecords(mode);
      } else {
        alert(response.message || 'Failed to update record');
      }
    } catch (editError) {
      console.error('Edit record error:', editError);
      alert(editError.message || 'Failed to update record');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="admin-card-reload-container">
      <div className="card-reload-header">
        <div className="header-left">
          <img src={reload_icon} alt="Card and Reload" className="header-icon" />
          <div>
            <h2>Card and Reload</h2>
            <p>Manage Add Card, Add Stock, and Daily Sales for Card and Reload</p>
          </div>
        </div>
      </div>

      <div className="mode-switcher">
        <button
          className={mode === 'card' ? 'active' : ''}
          onClick={() => setMode('card')}
        >
          Card
        </button>
        <button
          className={mode === 'reload' ? 'active' : ''}
          onClick={() => setMode('reload')}
        >
          Reload
        </button>
      </div>

      <div className="entry-switcher">
        <button className={entryType === 'add-card' ? 'active' : ''} onClick={() => resetFormForType('add-card')}>Add Card</button>
        <button className={entryType === 'add-stock' ? 'active' : ''} onClick={() => resetFormForType('add-stock')}>Add Stock</button>
        <button className={entryType === 'daily-sales' ? 'active' : ''} onClick={() => resetFormForType('daily-sales')}>Daily Sales</button>
      </div>

      <div className="profit-filter-section">
        <div className="profit-filter-buttons">
          <button
            className={`profit-filter-btn ${profitPeriod === 'all' ? 'active' : ''}`}
            onClick={() => setProfitPeriod('all')}
          >
            All Time
          </button>
          <button
            className={`profit-filter-btn ${profitPeriod === 'daily' ? 'active' : ''}`}
            onClick={() => setProfitPeriod('daily')}
          >
            Daily
          </button>
          <button
            className={`profit-filter-btn ${profitPeriod === 'weekly' ? 'active' : ''}`}
            onClick={() => setProfitPeriod('weekly')}
          >
            Weekly
          </button>
          <button
            className={`profit-filter-btn ${profitPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setProfitPeriod('monthly')}
          >
            Monthly
          </button>
        </div>

        <div className="profit-summary-cards">
          <div className="profit-card card-mode">
            <h4>Card</h4>
            <div className="profit-details">
              <div className="profit-item">
                <span className="label">Total Profit:</span>
                <span className="value">{profitSummary.card.total.toFixed(2)}</span>
              </div>
              <div className="profit-item">
                <span className="label">Profit:</span>
                <span className="value">{profitSummary.card.profit.toFixed(2)}</span>
              </div>
              <div className="profit-item">
                <span className="label">Commission:</span>
                <span className="value">{profitSummary.card.commission.toFixed(2)}</span>
              </div>
              <div className="profit-item">
                <span className="label">Records:</span>
                <span className="value">{profitSummary.card.count}</span>
              </div>
            </div>
          </div>

          <div className="profit-card reload-mode">
            <h4>Reload </h4>
            <div className="profit-details">
              <div className="profit-item">
                <span className="label">Total Profit:</span>
                <span className="value">{profitSummary.reload.total.toFixed(2)}</span>
              </div>
              <div className="profit-item">
                <span className="label">Profit:</span>
                <span className="value">{profitSummary.reload.profit.toFixed(2)}</span>
              </div>
              <div className="profit-item">
                <span className="label">Commission:</span>
                <span className="value">{profitSummary.reload.commission.toFixed(2)}</span>
              </div>
              <div className="profit-item">
                <span className="label">Records:</span>
                <span className="value">{profitSummary.reload.count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form className="card-reload-form" onSubmit={handleSubmit}>
        <h3>{FORM_TITLES[entryType]} ({mode === 'card' ? 'Card' : 'Reload'})</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>{mode === 'card' ? 'Card Type' : 'Reload Type'}</label>
            <div className="type-selector">
              <div className="custom-type-dropdown" ref={typeDropdownRef}>
                <button
                  type="button"
                  className="custom-type-trigger"
                  onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                >
                  <span>{selectedTypeLabel || `Select ${mode === 'card' ? 'Card' : 'Reload'} Type`}</span>
                  <span className="dropdown-chevron">{isTypeDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {isTypeDropdownOpen && (
                  <div className="custom-type-menu">
                    {activeTypes.length === 0 && (
                      <div className="custom-type-empty">No types available</div>
                    )}

                    {activeTypes.map((type) => (
                      <div className="custom-type-item" key={type._id}>
                        <button
                          type="button"
                          className="type-name-btn"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              cardType: type._id,
                              amount: entryType === 'add-card' ? prev.amount : '',
                              newQty: '',
                              qtySold: ''
                            }));
                            setIsTypeDropdownOpen(false);
                          }}
                        >
                          {type.typeName}
                        </button>

                        {entryType === 'add-card' && (
                          <button
                            type="button"
                            className="type-delete-corner-btn"
                            onClick={() => handleDeleteType(type._id, type.typeName)}
                            title={`Delete ${type.typeName}`}
                          >
                            -
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {entryType === 'add-card' && (
                <button
                  type="button"
                  className="add-type-btn"
                  onClick={() => {
                    setShowAddTypeModal(true);
                    setNewTypeName('');
                    setTypeError('');
                  }}
                  title={`Add new ${mode === 'card' ? 'Card' : 'Reload'} Type`}
                >
                  +
                </button>
              )}
            </div>
          </div>

          {/* Add Card / Add Reload - only show amount and type */}
          {entryType === 'add-card' && (
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          )}

          {/* Card Add Stock */}
          {mode === 'card' && entryType === 'add-stock' && (
            <>
              <div className="form-group">
                <label>Amount</label>
                <select
                  value={form.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                >
                  <option value="" disabled>Select amount</option>
                  {amountOptions.map((amount) => (
                    <option key={`card-stock-${amount}`} value={amount}>
                      {Number(amount).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Available Qty</label>
                <input
                  type="number"
                  min="0"
                  value={currentAvailableQty}
                  placeholder="0"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>New Qty</label>
                <input
                  type="number"
                  min="0"
                  value={form.newQty}
                  onChange={(e) => handleInputChange('newQty', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </>
          )}

          {/* Card Daily Sales */}
          {mode === 'card' && entryType === 'daily-sales' && (
            <>
              <div className="form-group">
                <label>Amount</label>
                <select
                  value={form.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                >
                  <option value="" disabled>Select amount</option>
                  {amountOptions.map((amount) => (
                    <option key={`card-sale-${amount}`} value={amount}>
                      {Number(amount).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Qty Sold</label>
                <input
                  type="number"
                  min="0"
                  value={form.qtySold}
                  onChange={(e) => handleInputChange('qtySold', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Qty Available</label>
                <input
                  type="number"
                  min="0"
                  value={computedRemainingQty}
                  placeholder="0"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Profit</label>
                <input
                  type="number"
                  step="0.01"
                  value={computedProfit}
                  placeholder="0.00"
                  readOnly
                />
              </div>
            </>
          )}

          {/* Reload Add Stock */}
          {mode === 'reload' && entryType === 'add-stock' && (
            <>
              <div className="form-group">
                <label>Amount</label>
                <select
                  value={form.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                >
                  <option value="" disabled>Select amount</option>
                  {amountOptions.map((amount) => (
                    <option key={`reload-stock-${amount}`} value={amount}>
                      {Number(amount).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Available Qty</label>
                <input
                  type="number"
                  min="0"
                  value={currentAvailableQty}
                  placeholder="0"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>New Qty</label>
                <input
                  type="number"
                  min="0"
                  value={form.newQty}
                  onChange={(e) => handleInputChange('newQty', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </>
          )}

          {/* Reload Daily Sales */}
          {mode === 'reload' && entryType === 'daily-sales' && (
            <>
              <div className="form-group">
                <label>Amount</label>
                <select
                  value={form.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                >
                  <option value="" disabled>Select amount</option>
                  {amountOptions.map((amount) => (
                    <option key={`reload-sale-${amount}`} value={amount}>
                      {Number(amount).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Qty Sold</label>
                <input
                  type="number"
                  min="0"
                  value={form.qtySold}
                  onChange={(e) => handleInputChange('qtySold', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Qty Available</label>
                <input
                  type="number"
                  min="0"
                  value={computedRemainingQty}
                  placeholder="0"
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Profit</label>
                <input
                  type="number"
                  step="0.01"
                  value={computedProfit}
                  placeholder="0.00"
                  readOnly
                />
              </div>
            </>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Saving...' : `Save ${FORM_TITLES[entryType]}`}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-box">Loading records...</div>
      ) : (
        <div className="tables-grid">
          <div className="table-section">
            <h4>{FORM_TITLES[entryType]}</h4>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {/* Card Add Card: card type, amount */}
                    {mode === 'card' && entryType === 'add-card' && (
                      <>
                        <th>Card Type</th>
                        <th>Amount</th>
                        <th>Created At</th>
                        <th>Action</th>
                      </>
                    )}

                    {/* Card Daily Sale: date, type, amount, qty sold, qty avl, profit */}
                    {mode === 'card' && entryType === 'daily-sales' && (
                      <>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Qty Sold</th>
                        <th>Qty Avl</th>
                        <th>Profit</th>
                        <th>Commission</th>
                        <th>Total Profit</th>
                        <th>Action</th>
                      </>
                    )}

                    {/* Card Add Stock: type, amount, new qty, avl qty, date */}
                    {mode === 'card' && entryType === 'add-stock' && (
                      <>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>New Qty</th>
                        <th>Avl Qty</th>
                        <th>Date</th>
                        <th>Action</th>
                      </>
                    )}

                    {/* Reload Add Reload: reload type, amount */}
                    {mode === 'reload' && entryType === 'add-card' && (
                      <>
                        <th>Reload Type</th>
                        <th>Amount</th>
                        <th>Created At</th>
                        <th>Action</th>
                      </>
                    )}

                    {/* Reload Daily Sale: date, type, sold amount, profit */}
                    {mode === 'reload' && entryType === 'daily-sales' && (
                      <>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Qty Sold</th>
                        <th>Qty Avl</th>
                        <th>Profit</th>
                        <th>Commission</th>
                        <th>Total Profit</th>
                        <th>Action</th>
                      </>
                    )}

                    {/* Reload Add Stock: type, amount, new qty, avl qty, date */}
                    {mode === 'reload' && entryType === 'add-stock' && (
                      <>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>New Qty</th>
                        <th>Avl Qty</th>
                        <th>Date</th>
                        <th>Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {groupedRecords[entryType].length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-cell">No records</td>
                    </tr>
                  ) : (
                    groupedRecords[entryType].map((record) => (
                      <tr key={record._id}>
                        {/* Card Add Card: card type, amount */}
                        {mode === 'card' && entryType === 'add-card' && (
                          <>
                            <td>{record.cardType}</td>
                            <td>{Number(record.amount).toFixed(2)}</td>
                            <td>{formatDate(record.createdAt)}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-btn edit-btn" onClick={() => handleEditRecord(record)}>Edit</button>
                                <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteRecord(record._id)}>Delete</button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Card Daily Sale: date, type, amount, qty sold, qty avl, profit */}
                        {mode === 'card' && entryType === 'daily-sales' && (
                          <>
                            <td>{formatDate(record.createdAt)}</td>
                            <td>{record.cardType}</td>
                            <td>{Number(record.amount).toFixed(2)}</td>
                            <td>{record.qtySold || 0}</td>
                            <td>{record.qtyAvl || 0}</td>
                            <td>{Number(record.profit || 0).toFixed(2)}</td>
                            <td>{Number(record.commission || 0).toFixed(2)}</td>
                            <td>{Number(record.totalProfit ?? (Number(record.profit || 0) + Number(record.commission || 0))).toFixed(2)}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="commission-add-btn" onClick={() => handleAddCommission(record)} title="Add commission">+</button>
                                <button type="button" className="action-btn edit-btn" onClick={() => handleEditRecord(record)}>Edit</button>
                                <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteRecord(record._id)}>Delete</button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Card Add Stock: type, amount, new qty, avl qty, date */}
                        {mode === 'card' && entryType === 'add-stock' && (
                          <>
                            <td>{record.cardType}</td>
                            <td>{Number(record.amount).toFixed(2)}</td>
                            <td>{record.newQty || 0}</td>
                            <td>{record.qtyAvl ?? record.availableQty ?? 0}</td>
                            <td>{formatDate(record.createdAt)}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-btn edit-btn" onClick={() => handleEditRecord(record)}>Edit</button>
                                <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteRecord(record._id)}>Delete</button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Reload Add Reload: reload type, amount */}
                        {mode === 'reload' && entryType === 'add-card' && (
                          <>
                            <td>{record.cardType}</td>
                            <td>{Number(record.amount).toFixed(2)}</td>
                            <td>{formatDate(record.createdAt)}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-btn edit-btn" onClick={() => handleEditRecord(record)}>Edit</button>
                                <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteRecord(record._id)}>Delete</button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Reload Daily Sale: date, type, amount, qty sold, qty avl, profit */}
                        {mode === 'reload' && entryType === 'daily-sales' && (
                          <>
                            <td>{formatDate(record.createdAt)}</td>
                            <td>{record.cardType}</td>
                            <td>{Number(record.amount || 0).toFixed(2)}</td>
                            <td>{record.qtySold || 0}</td>
                            <td>{record.qtyAvl || 0}</td>
                            <td>{Number(record.profit || 0).toFixed(2)}</td>
                            <td>{Number(record.commission || 0).toFixed(2)}</td>
                            <td>{Number(record.totalProfit ?? (Number(record.profit || 0) + Number(record.commission || 0))).toFixed(2)}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="commission-add-btn" onClick={() => handleAddCommission(record)} title="Add commission">+</button>
                                <button type="button" className="action-btn edit-btn" onClick={() => handleEditRecord(record)}>Edit</button>
                                <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteRecord(record._id)}>Delete</button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Reload Add Stock: type, amount, new qty, avl qty, date */}
                        {mode === 'reload' && entryType === 'add-stock' && (
                          <>
                            <td>{record.cardType}</td>
                            <td>{Number(record.amount || 0).toFixed(2)}</td>
                            <td>{record.newQty || 0}</td>
                            <td>{record.qtyAvl ?? record.availableQty ?? 0}</td>
                            <td>{formatDate(record.createdAt)}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="action-btn edit-btn" onClick={() => handleEditRecord(record)}>Edit</button>
                                <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteRecord(record._id)}>Delete</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {showAddTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New {mode === 'card' ? 'Card' : 'Reload'} Type</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddTypeModal(false);
                  setNewTypeName('');
                  setTypeError('');
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddNewType}>
              <div className="form-group">
                <label>{mode === 'card' ? 'Card' : 'Reload'} Type Name</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder={`Enter ${mode === 'card' ? 'card' : 'reload'} type name`}
                  autoFocus
                />
              </div>
              {typeError && <div className="error-message">{typeError}</div>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddTypeModal(false);
                    setNewTypeName('');
                    setTypeError('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={addingType}>
                  {addingType ? 'Adding...' : 'Add Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content compact-modal">
            <div className="modal-header">
              <h3>Edit Record</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRecord(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Type</label>
                <input
                  type="text"
                  value={editForm.cardType}
                  onChange={(e) => handleEditInputChange('cardType', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => handleEditInputChange('amount', e.target.value)}
                  required
                />
              </div>

              {editingRecord.entryType === 'add-stock' && (
                <div className="form-group">
                  <label>New Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.newQty}
                    onChange={(e) => handleEditInputChange('newQty', e.target.value)}
                    required
                  />
                </div>
              )}

              {editingRecord.entryType === 'daily-sales' && (
                <>
                  <div className="form-group">
                    <label>Qty Sold</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.qtySold}
                      onChange={(e) => handleEditInputChange('qtySold', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Commission</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.commission}
                      onChange={(e) => handleEditInputChange('commission', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecord(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {showCommissionModal && commissionRecord && (
        <div className="modal-overlay">
          <div className="modal-content compact-modal">
            <div className="modal-header">
              <h3>Add Commission</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCommissionModal(false);
                  setCommissionRecord(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveCommission}>
              <div className="form-group">
                <label>Type</label>
                <input type="text" value={commissionRecord.cardType} readOnly />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" value={Number(commissionRecord.amount || 0)} readOnly />
              </div>
              <div className="form-group">
                <label>Commission</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowCommissionModal(false);
                    setCommissionRecord(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={commissionSubmitting}>
                  {commissionSubmitting ? 'Saving...' : 'Save Commission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCardReload;
