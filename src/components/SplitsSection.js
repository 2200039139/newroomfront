import React from 'react';
import {  FaArrowRight, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import './ss.css';

const SplitsSection = ({ 
  roommates, 
  expenses, 
  splits, 
  paymentSuggestions, 
  onOpenSettleModal, 
  setActiveTab,
  viewMode 
}) => {
  // Safe function to get roommate name
  const getRoommateName = (id) => {
    const roommate = roommates.find(r => r?.id === id);
    return roommate?.name || `Roommate ${id}`;
  };

  // Safe function to get roommate initial
  const getRoommateInitial = (id) => {
    const roommate = roommates.find(r => r?.id === id);
    const name = roommate?.name || '';
    return name.charAt(0)?.toUpperCase() || '?';
  };

  // Safe function to get split data
  const getSplitData = (roommateId) => {
    if (!splits || typeof splits !== 'object') {
      return { paid: 0, owes: 0, net: 0 };
    }
    const split = splits[roommateId];
    if (!split) {
      return { paid: 0, owes: 0, net: 0 };
    }
    return {
      paid: parseFloat(split.paid) || 0,
      owes: parseFloat(split.owes) || 0,
      net: parseFloat(split.net) || 0
    };
  };

  // Filter out invalid roommates
  const validRoommates = Array.isArray(roommates) 
    ? roommates.filter(roommate => roommate && roommate.id && roommate.name)
    : [];

  // Debug: Log the data to see what's happening
  console.log('Payment Suggestions:', paymentSuggestions);
  console.log('Roommates:', roommates);
  console.log('Splits:', splits);

  if (validRoommates.length === 0) {
    return (
      <div className="no-data-message">
        <FaInfoCircle />
        <h3>No roommates added yet</h3>
        <p>Add roommates to start tracking expenses and splits</p>
        <button 
          className="btn-primary"
          onClick={() => setActiveTab('roommates')}
        >
          Add Roommates
        </button>
      </div>
    );
  }

  return (
    <div className={`splits-section ${viewMode}`}>
      {/* Balance Overview */}
      <div className="balance-overview">
        <h2>Balance Overview</h2>
        <p className="section-subtitle">Current financial standings among roommates</p>
        
        <div className="balance-cards">
          {validRoommates.map(roommate => {
            const splitData = getSplitData(roommate.id);
            const isPositive = splitData.net > 0;
            const isNegative = splitData.net < 0;
            const isZero = splitData.net === 0;
            
            return (
              <div key={roommate.id} className="balance-card">
                <div className="balance-card-header">
                  <div className="roommate-avatar">
                    {getRoommateInitial(roommate.id)}
                  </div>
                  <div className="roommate-info">
                    <h4>{roommate.name}</h4>
                    <p className="roommate-status">
                      {isZero ? 'Settled' : isPositive ? 'Owes You' : 'You Owe'}
                    </p>
                  </div>
                </div>
                
                <div className="balance-details">
                  <div className="balance-row">
                    <span>Paid:</span>
                    <span className="amount-paid">₹{splitData.paid.toFixed(2)}</span>
                  </div>
                  <div className="balance-row">
                    <span>Owes:</span>
                    <span className="amount-owes">₹{splitData.owes.toFixed(2)}</span>
                  </div>
                  <div className="balance-row total">
                    <span>Net Balance:</span>
                    <span className={`amount-net ${isPositive ? 'positive' : isNegative ? 'negative' : 'zero'}`}>
                      ₹{Math.abs(splitData.net).toFixed(2)} {isPositive ? '(+)' : isNegative ? '(-)' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Suggestions */}
      {paymentSuggestions && paymentSuggestions.length > 0 && (
        <div className="payment-suggestions">
          <h2>Payment Suggestions</h2>
          <p className="section-subtitle">Recommended settlements to clear balances</p>
          
          <div className="suggestions-list">
            {paymentSuggestions.map((suggestion, index) => {
              // Use the names directly from the suggestion if available
              const fromName = suggestion.fromName || getRoommateName(suggestion.from);
              const toName = suggestion.toName || getRoommateName(suggestion.to);
              
              return (
                <div key={index} className="suggestion-card">
                  <div className="suggestion-details">
                    <div className="suggestion-from">
                      <div className="suggestion-avatar">
                        {getRoommateInitial(suggestion.from)}
                      </div>
                      <div className="suggestion-info">
                        <span className="suggestion-label">From:</span>
                        <span className="suggestion-name">{fromName}</span>
                      </div>
                    </div>
                    
                    <div className="suggestion-arrow">
                      <FaArrowRight />
                      <div className="suggestion-amount">₹{suggestion.amount.toFixed(2)}</div>
                    </div>
                    
                    <div className="suggestion-to">
                      <div className="suggestion-avatar">
                        {getRoommateInitial(suggestion.to)}
                      </div>
                      <div className="suggestion-info">
                        <span className="suggestion-label">To:</span>
                        <span className="suggestion-name">{toName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className="btn-settle"
                    onClick={() => onOpenSettleModal(suggestion.from, suggestion.to)}
                  >
                    Record Settlement
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Simplified View for Mobile */}
      {viewMode === 'mobile' && (
        <div className="mobile-splits-view">
          <h3>Quick Balances</h3>
          <div className="mobile-balance-list">
            {validRoommates.map(roommate => {
              const splitData = getSplitData(roommate.id);
              const isPositive = splitData.net > 0;
              
              return (
                <div key={roommate.id} className="mobile-balance-item">
                  <div className="mobile-balance-left">
                    <div className="mobile-avatar">
                      {getRoommateInitial(roommate.id)}
                    </div>
                    <span className="mobile-name">{roommate.name}</span>
                  </div>
                  <div className={`mobile-balance-right ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : '-'}₹{Math.abs(splitData.net).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Balances Message */}
      {paymentSuggestions && paymentSuggestions.length === 0 && validRoommates.length > 0 && (
        <div className="no-balances-message">
          <FaCheckCircle className="success-icon" />
          <h3>All Balances are Settled!</h3>
          <p>No pending payments needed at this time.</p>
          <button 
            className="btn-secondary"
            onClick={() => setActiveTab('expenses')}
          >
            Add New Expense
          </button>
        </div>
      )}
    </div>
  );
};

export default SplitsSection;
