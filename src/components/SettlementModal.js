import React, { useState, useEffect } from 'react';
import './SettlementModal.css';

const SettlementModal = ({
  show,
  onClose,
  currentSettlement,
  setCurrentSettlement,
  roommates,
  onAddSettlement
}) => {
  const [localSettlement, setLocalSettlement] = useState(currentSettlement);
  
  // Update local state when currentSettlement changes
  useEffect(() => {
    console.log('Current Settlement in Modal:', currentSettlement);
    setLocalSettlement(currentSettlement);
  }, [currentSettlement]);

  if (!show) return null;

  // Function to get roommate name by ID
  const getRoommateName = (id) => {
    if (!id) return 'Select payer';
    const roommate = roommates.find(r => r?.id === parseInt(id));
    return roommate?.name || `Roommate ${id}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSettlement();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalSettlement(prev => ({
      ...prev,
      [name]: value
    }));
    // Also update the parent state
    setCurrentSettlement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate the maximum amount that can be settled based on balances
  const getMaxAmount = () => {
    // You might want to calculate this based on actual balances
    // For now, return a large number
    return 1000000;
  };

  const maxAmount = getMaxAmount();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Settlement</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settlement-form">
          {/* Payer Selection */}
          <div className="form-group">
            <label htmlFor="fromId">Payer (Who Pays)</label>
            <div className="select-wrapper">
              <select
                id="fromId"
                name="fromId"
                value={localSettlement.fromId || ''}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Select payer</option>
                {roommates.map(roommate => (
                  <option 
                    key={roommate.id} 
                    value={roommate.id}
                    className="option-item"
                  >
                    {roommate.name}
                  </option>
                ))}
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>

          {/* Receiver Selection */}
          <div className="form-group">
            <label htmlFor="toId">Receiver (Who Receives)</label>
            <div className="select-wrapper">
              <select
                id="toId"
                name="toId"
                value={localSettlement.toId || ''}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Select receiver</option>
                {roommates
                  .filter(roommate => roommate.id !== parseInt(localSettlement.fromId))
                  .map(roommate => (
                    <option 
                      key={roommate.id} 
                      value={roommate.id}
                      className="option-item"
                    >
                      {roommate.name}
                    </option>
                  ))}
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <div className="amount-input-wrapper">
              <input
                type="number"
                id="amount"
                name="amount"
                value={localSettlement.amount || ''}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0.01"
                max={maxAmount}
                step="0.01"
                required
                className="form-input"
              />
              <div className="amount-hint">
                Enter the amount being settled
              </div>
            </div>
          </div>

          {/* Date Input */}
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={localSettlement.date}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          {/* Selected Info */}
          {(localSettlement.fromId || localSettlement.toId) && (
            <div className="selected-info">
              {localSettlement.fromId && (
                <div className="info-item">
                  <span className="info-label">Payer:</span>
                  <span className="info-value">{getRoommateName(localSettlement.fromId)}</span>
                </div>
              )}
              {localSettlement.toId && (
                <div className="info-item">
                  <span className="info-label">Receiver:</span>
                  <span className="info-value">{getRoommateName(localSettlement.toId)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!localSettlement.fromId || !localSettlement.toId || !localSettlement.amount}
            >
              Record Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettlementModal;