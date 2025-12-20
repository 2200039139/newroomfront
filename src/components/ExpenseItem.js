import React from 'react';
import { formatCurrency } from '../utils/currency';
import { formatShortDate } from '../utils/dateUtils';

const ExpenseItem = ({ expense, roommates }) => {
  const paidByRoommate = roommates.find(r => r.id === parseInt(expense.paidBy));
  const participants = expense.splitAmong && Array.isArray(expense.splitAmong) && expense.splitAmong.length > 0
    ? roommates.filter(r => expense.splitAmong.includes(r.id))
    : [];
  const participantNames = participants.length > 0 
    ? participants.map(r => r.name).join(', ')
    : 'No one selected';

  return (
    <div className="expense-card">
      <div className="expense-date">
        {formatShortDate(expense.date)}
      </div>
      
      <div className="expense-details">
        <div className="expense-description">
          {expense.description || 'No description'}
        </div>
        
        <div className="expense-payment">
          <span className="paid-by">
            Paid by {paidByRoommate ? paidByRoommate.name : 'Unknown'}
          </span>
          <span className="amount">
            {formatCurrency(parseFloat(expense.amount) || 0)}
          </span>
        </div>
        
        <div className="expense-split">
          Split among: {participantNames}
          {expense.splitAmong && expense.splitAmong.length > 0 && (
            <span className="split-count">
              ({expense.splitAmong.length} people, {formatCurrency((parseFloat(expense.amount) || 0) / expense.splitAmong.length)} each)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseItem;