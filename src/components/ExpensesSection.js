import React from 'react';
import { formatCurrency } from '../utils/currency';
import './es.css'
const ExpensesSection = ({ 
  roommates, 
  newExpense, 
  setNewExpense, 
  onAddExpense,
  setActiveTab 
}) => {
  const handleToggleParticipant = (roommateId) => {
    const isSelected = newExpense.splitAmong.includes(roommateId);
    
    if (isSelected) {
      setNewExpense({
        ...newExpense,
        splitAmong: newExpense.splitAmong.filter(id => id !== roommateId)
      });
    } else {
      setNewExpense({
        ...newExpense,
        splitAmong: [...newExpense.splitAmong, roommateId]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddExpense();
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
        
        <div className="form-section">
          <h3>Split Among</h3>
          <p className="hint">Deselect roommates to exclude them from this expense</p>
          
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
                <span>{roommate.name}</span>
                <span className="checkmark">
                  {newExpense.splitAmong.includes(roommate.id) ? '✓' : ''}
                </span>
              </div>
            ))}
          </div>
          
          {newExpense.splitAmong.length > 0 && (
            <p className="split-info">
              {newExpense.amount && !isNaN(parseFloat(newExpense.amount)) ? 
                `Each person pays: ${formatCurrency(parseFloat(newExpense.amount) / newExpense.splitAmong.length)}` : 
                `Splitting among ${newExpense.splitAmong.length} people`}
            </p>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit"
            className="add-button"
          >
            Add Expense
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpensesSection;