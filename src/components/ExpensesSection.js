import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import './es.css';

const ExpensesSection = ({ 
  roommates, 
  newExpense, 
  setNewExpense, 
  onAddExpense,
  setActiveTab 
}) => {
  const [splitType, setSplitType] = useState('equal'); // 'equal', 'exact', 'percentage'
  const [exactAmounts, setExactAmounts] = useState({});
  const [percentages, setPercentages] = useState({});
  
  // Initialize exact amounts and percentages when roommates or splitType changes
  useEffect(() => {
    if (roommates.length > 0) {
      const initialExactAmounts = {};
      const initialPercentages = {};
      
      roommates.forEach(roommate => {
        if (newExpense.splitAmong.includes(roommate.id)) {
          initialExactAmounts[roommate.id] = '';
          initialPercentages[roommate.id] = '';
        }
      });
      
      setExactAmounts(initialExactAmounts);
      setPercentages(initialPercentages);
    }
  }, [roommates, newExpense.splitAmong]);
  
  // Handle toggle participant with split type logic
  const handleToggleParticipant = (roommateId) => {
    const isSelected = newExpense.splitAmong.includes(roommateId);
    
    if (isSelected) {
      // Remove from split
      setNewExpense({
        ...newExpense,
        splitAmong: newExpense.splitAmong.filter(id => id !== roommateId)
      });
      
      // Clean up exact amounts and percentages
      const newExactAmounts = { ...exactAmounts };
      const newPercentages = { ...percentages };
      delete newExactAmounts[roommateId];
      delete newPercentages[roommateId];
      setExactAmounts(newExactAmounts);
      setPercentages(newPercentages);
    } else {
      // Add to split
      setNewExpense({
        ...newExpense,
        splitAmong: [...newExpense.splitAmong, roommateId]
      });
      
      // Initialize with empty values
      setExactAmounts({
        ...exactAmounts,
        [roommateId]: ''
      });
      setPercentages({
        ...percentages,
        [roommateId]: ''
      });
    }
  };
  
  // Handle exact amount change
  const handleExactAmountChange = (roommateId, value) => {
    setExactAmounts({
      ...exactAmounts,
      [roommateId]: value
    });
  };
  
  // Handle percentage change
  const handlePercentageChange = (roommateId, value) => {
    setPercentages({
      ...percentages,
      [roommateId]: value
    });
  };
  
  // Calculate and validate split amounts
  const calculateSplitDetails = () => {
    const totalAmount = parseFloat(newExpense.amount) || 0;
    const participants = roommates.filter(r => newExpense.splitAmong.includes(r.id));
    
    if (participants.length === 0 || totalAmount === 0) {
      return { isValid: false, error: null, details: [] };
    }
    
    let isValid = true;
    let error = null;
    const details = [];
    let totalAllocated = 0;
    
    switch (splitType) {
      case 'equal':
        const equalShare = totalAmount / participants.length;
        participants.forEach(participant => {
          details.push({
            id: participant.id,
            name: participant.name,
            share: equalShare,
            type: 'equal'
          });
          totalAllocated += equalShare;
        });
        break;
        
      case 'exact':
        participants.forEach(participant => {
          const exactAmount = parseFloat(exactAmounts[participant.id]) || 0;
          details.push({
            id: participant.id,
            name: participant.name,
            share: exactAmount,
            type: 'exact'
          });
          totalAllocated += exactAmount;
        });
        
        if (Math.abs(totalAllocated - totalAmount) > 0.01) {
          isValid = false;
          error = `Total allocated (${formatCurrency(totalAllocated)}) doesn't match expense amount (${formatCurrency(totalAmount)})`;
        }
        break;
        
      case 'percentage':
        let totalPercentage = 0;
        participants.forEach(participant => {
          const percentage = parseFloat(percentages[participant.id]) || 0;
          totalPercentage += percentage;
          const share = (totalAmount * percentage) / 100;
          details.push({
            id: participant.id,
            name: participant.name,
            share: share,
            percentage: percentage,
            type: 'percentage'
          });
          totalAllocated += share;
        });
        
        if (Math.abs(totalPercentage - 100) > 0.01) {
          isValid = false;
          error = `Total percentage (${totalPercentage.toFixed(2)}%) doesn't equal 100%`;
        }
        break;
    }
    case 'default'    :
        break;
    return { isValid, error, details, totalAllocated };
  };
  
  // Auto-fill percentages for equal distribution
  const autoFillPercentages = () => {
    if (newExpense.splitAmong.length === 0) return;
    
    const equalPercentage = (100 / newExpense.splitAmong.length).toFixed(2);
    const newPercentages = {};
    
    newExpense.splitAmong.forEach(id => {
      newPercentages[id] = equalPercentage;
    });
    
    setPercentages(newPercentages);
  };
  
  // Auto-fill exact amounts for equal distribution
  const autoFillExactAmounts = () => {
    if (newExpense.splitAmong.length === 0 || !newExpense.amount) return;
    
    const totalAmount = parseFloat(newExpense.amount) || 0;
    const equalShare = totalAmount / newExpense.splitAmong.length;
    const newExactAmounts = {};
    
    newExpense.splitAmong.forEach(id => {
      newExactAmounts[id] = equalShare.toFixed(2);
    });
    
    setExactAmounts(newExactAmounts);
  };
  
  // Prepare expense data for submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { isValid, error } = calculateSplitDetails();
    
    if (!isValid) {
      alert(error || 'Please check your split configuration');
      return;
    }
    
    // Prepare split configuration based on type
    let splitConfig = {};
    
    switch (splitType) {
      case 'equal':
        splitConfig = { type: 'equal' };
        break;
        
      case 'exact':
        splitConfig = {
          type: 'exact',
          amounts: exactAmounts
        };
        break;
        
      case 'percentage':
        splitConfig = {
          type: 'percentage',
          percentages: percentages
        };
        break;
      case 'default':
        break;
    }
    
    // Call parent's onAddExpense with split configuration
    onAddExpense(splitConfig);
    
    // Reset form after submission
    setExactAmounts({});
    setPercentages({});
    setSplitType('equal');
  };
  
  if (roommates.length === 0) {
    return (
      <div className="section-container">
        <h2>Add New Expense</h2>
        <div className="empty-state">
          <p>You need to add roommates before adding expenses.</p>
          <button 
            type="button"
            className="redirect-button"
            onClick={() => setActiveTab('roommates')}
          >
            Go to Roommates
          </button>
        </div>
      </div>
    );
  }

  const splitDetails = calculateSplitDetails();
  
  return (
    <div className="section-container">
      <h2>Add New Expense</h2>
      
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="What was purchased?"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Amount</label>
            <div className="input-group">
              <span>₹</span>
              <input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Paid By</label>
            <select
              value={newExpense.paidBy}
              onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
              required
            >
              <option value="">Select roommate</option>
              {roommates.map(roommate => (
                <option key={roommate.id} value={roommate.id}>
                  {roommate.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              required
            />
          </div>
        </div>
        
        {/* Split Type Selection */}
        <div className="form-section">
          <h3>Split Type</h3>
          <div className="split-type-selector">
            <button
              type="button"
              className={`split-type-option ${splitType === 'equal' ? 'active' : ''}`}
              onClick={() => setSplitType('equal')}
            >
              <div className="split-type-icon">=</div>
              <div className="split-type-details">
                <strong>Equal Split</strong>
                <small>Divide equally among selected people</small>
              </div>
            </button>
            
            <button
              type="button"
              className={`split-type-option ${splitType === 'exact' ? 'active' : ''}`}
              onClick={() => setSplitType('exact')}
            >
              <div className="split-type-icon">₹</div>
              <div className="split-type-details">
                <strong>Exact Amount</strong>
                <small>Specify exact amount for each person</small>
              </div>
            </button>
            
            <button
              type="button"
              className={`split-type-option ${splitType === 'percentage' ? 'active' : ''}`}
              onClick={() => setSplitType('percentage')}
            >
              <div className="split-type-icon">%</div>
              <div className="split-type-details">
                <strong>Percentage Split</strong>
                <small>Split by percentage of total</small>
              </div>
            </button>
          </div>
        </div>
        
        {/* Participants Selection */}
        <div className="form-section">
          <div className="section-header">
            <h3>Split Among</h3>
            <p className="hint">Deselect roommates to exclude them from this expense</p>
          </div>
          
          <div className="split-selection">
            {roommates.map(roommate => (
              <div 
                key={roommate.id} 
                className={`split-option ${newExpense.splitAmong.includes(roommate.id) ? 'selected' : ''}`}
                onClick={() => handleToggleParticipant(roommate.id)}
              >
                <div className="avatar">
                  {roommate.name.charAt(0).toUpperCase()}
                </div>
                <span className="roommate-name">{roommate.name}</span>
                <span className="checkmark">
                  {newExpense.splitAmong.includes(roommate.id) ? '✓' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Split Details Based on Type */}
        {newExpense.splitAmong.length > 0 && (
          <div className="form-section">
            <h3>Split Details</h3>
            
            {splitType === 'equal' && (
              <div className="split-details">
                <p className="split-info">
                  <strong>Equal Split:</strong> Each person pays {formatCurrency(parseFloat(newExpense.amount || 0) / newExpense.splitAmong.length)}
                </p>
              </div>
            )}
            
            {splitType === 'exact' && (
              <div className="split-details">
                <div className="split-details-header">
                  <h4>Enter Exact Amounts</h4>
                  <button 
                    type="button" 
                    className="auto-fill-button"
                    onClick={autoFillExactAmounts}
                    disabled={!newExpense.amount}
                  >
                    Auto-fill Equal
                  </button>
                </div>
                
                <div className="exact-amounts-grid">
                  {roommates
                    .filter(r => newExpense.splitAmong.includes(r.id))
                    .map(roommate => (
                      <div key={roommate.id} className="exact-amount-row">
                        <label>{roommate.name}</label>
                        <div className="amount-input-group">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={exactAmounts[roommate.id] || ''}
                            onChange={(e) => handleExactAmountChange(roommate.id, e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>
                
                {splitDetails.error && (
                  <div className="split-error">
                    ⚠️ {splitDetails.error}
                  </div>
                )}
                
                {!splitDetails.error && splitDetails.details.length > 0 && (
                  <div className="split-summary">
                    <strong>Total Allocated:</strong> {formatCurrency(splitDetails.totalAllocated || 0)}
                    <span className={`total-status ${Math.abs(splitDetails.totalAllocated - parseFloat(newExpense.amount || 0)) < 0.01 ? 'valid' : 'invalid'}`}>
                      {Math.abs(splitDetails.totalAllocated - parseFloat(newExpense.amount || 0)) < 0.01 ? '✓ Balanced' : '✗ Unbalanced'}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {splitType === 'percentage' && (
              <div className="split-details">
                <div className="split-details-header">
                  <h4>Enter Percentages</h4>
                  <button 
                    type="button" 
                    className="auto-fill-button"
                    onClick={autoFillPercentages}
                  >
                    Auto-fill Equal
                  </button>
                </div>
                
                <div className="percentage-grid">
                  {roommates
                    .filter(r => newExpense.splitAmong.includes(r.id))
                    .map(roommate => (
                      <div key={roommate.id} className="percentage-row">
                        <label>{roommate.name}</label>
                        <div className="percentage-input-group">
                          <input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            max="100"
                            step="0.01"
                            value={percentages[roommate.id] || ''}
                            onChange={(e) => handlePercentageChange(roommate.id, e.target.value)}
                            required
                          />
                          <span>%</span>
                        </div>
                        <div className="percentage-amount">
                          {formatCurrency(
                            ((parseFloat(newExpense.amount || 0) * (parseFloat(percentages[roommate.id]) || 0)) / 100)
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
                
                {splitDetails.error && (
                  <div className="split-error">
                    ⚠️ {splitDetails.error}
                  </div>
                )}
                
                {!splitDetails.error && (
                  <div className="split-summary">
                    <strong>Total Percentage:</strong> {splitDetails.details.reduce((sum, detail) => sum + (detail.percentage || 0), 0).toFixed(2)}%
                    <span className={`total-status ${Math.abs(splitDetails.details.reduce((sum, detail) => sum + (detail.percentage || 0), 0) - 100) < 0.01 ? 'valid' : 'invalid'}`}>
                      {Math.abs(splitDetails.details.reduce((sum, detail) => sum + (detail.percentage || 0), 0) - 100) < 0.01 ? '✓ Balanced' : '✗ Unbalanced'}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Split Preview */}
            {splitDetails.details.length > 0 && (
              <div className="split-preview">
                <h4>Preview</h4>
                <div className="preview-table">
                  {splitDetails.details.map(detail => (
                    <div key={detail.id} className="preview-row">
                      <span className="preview-name">{detail.name}</span>
                      <span className="preview-amount">{formatCurrency(detail.share)}</span>
                      {detail.percentage && (
                        <span className="preview-percentage">({detail.percentage}%)</span>
                      )}
                    </div>
                  ))}
                  <div className="preview-total">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(newExpense.amount || 0))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit"
            className="add-button"
            disabled={!splitDetails.isValid}
          >
            Add Expense
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpensesSection;
