import React, { useState } from 'react';
import ExpenseItem from './ExpenseItem';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import './hs.css';

const HistorySection = ({
  roommates,
  expenses,
  settlements,
  historyTab,
  setHistoryTab,
  expenseViewType,
  setExpenseViewType,
  sortOrder,
  setSortOrder,
  setActiveTab
}) => {
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedRoommates, setSelectedRoommates] = useState([]);
  const [paidByFilter, setPaidByFilter] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (roommates.length === 0) {
    return (
      <div className="section-container history-section">
        <div className="section-header">
          <h2>
            <span className="header-icon">📊</span>
            History
          </h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p className="empty-text">You need to add roommates before tracking expenses.</p>
          <button 
            className="redirect-button"
            onClick={() => setActiveTab('roommates')}
          >
            <span className="button-icon">➕</span>
            Go to Roommates
          </button>
        </div>
      </div>
    );
  }

  // Filter functions
  const filterExpenses = (expensesList) => {
    return expensesList.filter(expense => {
      // Date range filter
      if (dateRange.from && dateRange.to) {
        const expenseDate = new Date(expense.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        if (expenseDate < fromDate || expenseDate > toDate) {
          return false;
        }
      }

      // Paid by filter
      if (paidByFilter && expense.paidBy !== parseInt(paidByFilter)) {
        return false;
      }

      // Amount range filter
      const amount = parseFloat(expense.amount) || 0;
      if (amountRange.min && amount < parseFloat(amountRange.min)) {
        return false;
      }
      if (amountRange.max && amount > parseFloat(amountRange.max)) {
        return false;
      }

      // Roommates filter (expense should include selected roommates)
      if (selectedRoommates.length > 0) {
        const expenseParticipants = expense.splitAmong || [];
        const hasSelectedParticipant = selectedRoommates.some(roommateId => 
          expenseParticipants.includes(roommateId)
        );
        if (!hasSelectedParticipant) {
          return false;
        }
      }

      // Category filter (assuming expense has category field)
      if (categoryFilter && expense.category !== categoryFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const description = expense.description?.toLowerCase() || '';
        const paidByName = roommates.find(r => r.id === expense.paidBy)?.name?.toLowerCase() || '';
        
        if (!description.includes(query) && !paidByName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

  const filterSettlements = (settlementsList) => {
    return settlementsList.filter(settlement => {
      // Date range filter
      if (dateRange.from && dateRange.to) {
        const settlementDate = new Date(settlement.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        if (settlementDate < fromDate || settlementDate > toDate) {
          return false;
        }
      }

      // Roommate filter
      if (selectedRoommates.length > 0) {
        const fromId = parseInt(settlement.fromId);
        const toId = parseInt(settlement.toId);
        const isFromSelected = selectedRoommates.includes(fromId);
        const isToSelected = selectedRoommates.includes(toId);
        
        if (!isFromSelected && !isToSelected) {
          return false;
        }
      }

      // Amount range filter
      const amount = parseFloat(settlement.amount) || 0;
      if (amountRange.min && amount < parseFloat(amountRange.min)) {
        return false;
      }
      if (amountRange.max && amount > parseFloat(amountRange.max)) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fromName = roommates.find(r => r.id === parseInt(settlement.fromId))?.name?.toLowerCase() || '';
        const toName = roommates.find(r => r.id === parseInt(settlement.toId))?.name?.toLowerCase() || '';
        
        if (!fromName.includes(query) && !toName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

  // Apply filters
  const filteredExpenses = filterExpenses(expenses);
  const filteredSettlements = filterSettlements(settlements);

  // Reset all filters
  const resetFilters = () => {
    setDateRange({ from: '', to: '' });
    setSelectedRoommates([]);
    setPaidByFilter('');
    setAmountRange({ min: '', max: '' });
    setCategoryFilter('');
    setSearchQuery('');
  };

  // Toggle roommate selection
  const toggleRoommateSelection = (roommateId) => {
    if (selectedRoommates.includes(roommateId)) {
      setSelectedRoommates(selectedRoommates.filter(id => id !== roommateId));
    } else {
      setSelectedRoommates([...selectedRoommates, roommateId]);
    }
  };

  // Grouping functions
  const groupByDay = (expensesList) => {
    const groups = {};
    
    expensesList.forEach(expense => {
      if (!expense || !expense.date) return;
      
      const date = new Date(expense.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = {
          date,
          total: 0,
          expenses: []
        };
      }
      
      groups[date].total += parseFloat(expense.amount) || 0;
      groups[date].expenses.push(expense);
    });
    
    return Object.values(groups);
  };

  const groupByWeek = (expensesList) => {
    const groups = {};
    
    const getWeekNumber = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return weekNo;
    };
    
    expensesList.forEach(expense => {
      if (!expense || !expense.date) return;
      
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      const key = `${year}-W${week}`;
      
      if (!groups[key]) {
        groups[key] = {
          key,
          year,
          week,
          total: 0,
          expenses: []
        };
      }
      
      groups[key].total += parseFloat(expense.amount) || 0;
      groups[key].expenses.push(expense);
    });
    
    return Object.values(groups);
  };

  const groupByMonth = (expensesList) => {
    const groups = {};
    
    expensesList.forEach(expense => {
      if (!expense || !expense.date) return;
      
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const key = `${year}-${month}`;
      
      if (!groups[key]) {
        groups[key] = {
          key,
          year,
          month,
          total: 0,
          expenses: []
        };
      }
      
      groups[key].total += parseFloat(expense.amount) || 0;
      groups[key].expenses.push(expense);
    });
    
    return Object.values(groups);
  };

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = new Date(a.date || new Date());
    const dateB = new Date(b.date || new Date());
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Sort settlements
  const sortedSettlements = [...filteredSettlements].sort((a, b) => {
    const dateA = new Date(a.date || new Date());
    const dateB = new Date(b.date || new Date());
    return dateB - dateA;
  });

  // Get totals
  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + (parseFloat(expense.amount) || 0), 0);
  };

  const getTotalSettlements = () => {
    return filteredSettlements.reduce((total, settlement) => total + (parseFloat(settlement.amount) || 0), 0);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange.from || dateRange.to) count++;
    if (selectedRoommates.length > 0) count++;
    if (paidByFilter) count++;
    if (amountRange.min || amountRange.max) count++;
    if (categoryFilter) count++;
    if (searchQuery) count++;
    return count;
  };

  // Get unique categories from expenses
  const getCategories = () => {
    const categories = new Set();
    expenses.forEach(expense => {
      if (expense.category) {
        categories.add(expense.category);
      }
    });
    return Array.from(categories);
  };

  const categories = getCategories();

  return (
    <div className="section-container history-section">
      <div className="section-header">
        <div className="header-content">
          <h2>
            <span className="header-icon">📊</span>
            History
          </h2>
          <div className="history-stats">
            <div className="stat-item">
              <span className="stat-icon">💸</span>
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value">{formatCurrency(getTotalExpenses())}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Total Settlements</span>
              <span className="stat-value">{formatCurrency(getTotalSettlements())}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search expenses or settlements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Filters Dropdown */}
        <div className="filters-dropdown">
          <button 
            className={`filters-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="filter-icon">⚙️</span>
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="filter-badge">{getActiveFilterCount()}</span>
            )}
            <span className="dropdown-arrow">{showFilters ? '▲' : '▼'}</span>
          </button>
          
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-header">
                <h4>Filter Options</h4>
                <button 
                  className="reset-filters"
                  onClick={resetFilters}
                >
                  Reset All
                </button>
              </div>
              
              <div className="filters-content">
                {/* Date Range Filter */}
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-group-icon">📅</span>
                    Date Range
                  </label>
                  <div className="date-range-filters">
                    <div className="date-input-group">
                      <label>From</label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                      />
                    </div>
                    <div className="date-input-group">
                      <label>To</label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Roommates Filter */}
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-group-icon">👥</span>
                    Roommates
                  </label>
                  <div className="roommate-filters">
                    {roommates.map(roommate => (
                      <div 
                        key={roommate.id}
                        className={`roommate-filter-option ${selectedRoommates.includes(roommate.id) ? 'selected' : ''}`}
                        onClick={() => toggleRoommateSelection(roommate.id)}
                      >
                        <div className="roommate-avatar">
                          {roommate.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{roommate.name}</span>
                        <span className="checkmark">
                          {selectedRoommates.includes(roommate.id) ? '✓' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Paid By Filter (for expenses tab) */}
                {historyTab === 'expenses' && (
                  <div className="filter-group">
                    <label className="filter-label">
                      <span className="filter-group-icon">💳</span>
                      Paid By
                    </label>
                    <select
                      value={paidByFilter}
                      onChange={(e) => setPaidByFilter(e.target.value)}
                      className="paid-by-select"
                    >
                      <option value="">All Roommates</option>
                      {roommates.map(roommate => (
                        <option key={roommate.id} value={roommate.id}>
                          {roommate.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Amount Range Filter */}
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-group-icon">💰</span>
                    Amount Range
                  </label>
                  <div className="amount-range-filters">
                    <div className="amount-input-group">
                      <label>Min</label>
                      <div className="input-with-symbol">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={amountRange.min}
                          onChange={(e) => setAmountRange({...amountRange, min: e.target.value})}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="amount-input-group">
                      <label>Max</label>
                      <div className="input-with-symbol">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          placeholder="Any"
                          value={amountRange.max}
                          onChange={(e) => setAmountRange({...amountRange, max: e.target.value})}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Category Filter */}
                {historyTab === 'expenses' && categories.length > 0 && (
                  <div className="filter-group">
                    <label className="filter-label">
                      <span className="filter-group-icon">🏷️</span>
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="category-select"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Applied Filters Display */}
                {getActiveFilterCount() > 0 && (
                  <div className="active-filters">
                    <h5>Active Filters:</h5>
                    <div className="filter-chips">
                      {dateRange.from && dateRange.to && (
                        <span className="filter-chip">
                          Date: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                          <button onClick={() => setDateRange({ from: '', to: '' })}>✕</button>
                        </span>
                      )}
                      {selectedRoommates.length > 0 && (
                        <span className="filter-chip">
                          {selectedRoommates.length} roommate{selectedRoommates.length !== 1 ? 's' : ''}
                          <button onClick={() => setSelectedRoommates([])}>✕</button>
                        </span>
                      )}
                      {paidByFilter && (
                        <span className="filter-chip">
                          Paid by: {roommates.find(r => r.id === parseInt(paidByFilter))?.name}
                          <button onClick={() => setPaidByFilter('')}>✕</button>
                        </span>
                      )}
                      {(amountRange.min || amountRange.max) && (
                        <span className="filter-chip">
                          Amount: ₹{amountRange.min || 0} - ₹{amountRange.max || '∞'}
                          <button onClick={() => setAmountRange({ min: '', max: '' })}>✕</button>
                        </span>
                      )}
                      {categoryFilter && (
                        <span className="filter-chip">
                          Category: {categoryFilter}
                          <button onClick={() => setCategoryFilter('')}>✕</button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* History Tabs */}
      <div className="history-tabs">
        <button 
          className={`sub-tab ${historyTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setHistoryTab('expenses')}
        >
          <span className="tab-icon">🛒</span>
          Expenses
          <span className="tab-badge">
            {filteredExpenses.length}{filteredExpenses.length !== expenses.length && `/${expenses.length}`}
          </span>
        </button>
        <button 
          className={`sub-tab ${historyTab === 'settlements' ? 'active' : ''}`}
          onClick={() => setHistoryTab('settlements')}
        >
          <span className="tab-icon">💸</span>
          Settlements
          <span className="tab-badge">
            {filteredSettlements.length}{filteredSettlements.length !== settlements.length && `/${settlements.length}`}
          </span>
        </button>
      </div>
      
      {/* Main Content */}
      {historyTab === 'expenses' ? (
        filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-text">
              {expenses.length === 0 
                ? "No expenses added yet. Add your first expense in the 'Add Expense' tab."
                : "No expenses match your filters. Try adjusting your filter criteria."
              }
            </p>
            {expenses.length === 0 ? (
              <button 
                className="redirect-button"
                onClick={() => setActiveTab('expenses')}
              >
                <span className="button-icon">➕</span>
                Add Expenses
              </button>
            ) : (
              <button 
                className="redirect-button"
                onClick={resetFilters}
              >
                <span className="button-icon">🔄</span>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="view-controls">
              <div className="view-control-group">
                <span className="control-label">
                  <span className="control-icon">📅</span>
                  View by:
                </span>
                <div className="view-type-selector">
                  <button
                    type="button"
                    className={`view-type-btn ${expenseViewType === 'day' ? 'active' : ''}`}
                    onClick={() => setExpenseViewType('day')}
                  >
                    <span className="btn-icon">📆</span>
                    Daily
                  </button>
                  <button
                    type="button"
                    className={`view-type-btn ${expenseViewType === 'week' ? 'active' : ''}`}
                    onClick={() => setExpenseViewType('week')}
                  >
                    <span className="btn-icon">🗓️</span>
                    Weekly
                  </button>
                  <button
                    type="button"
                    className={`view-type-btn ${expenseViewType === 'month' ? 'active' : ''}`}
                    onClick={() => setExpenseViewType('month')}
                  >
                    <span className="btn-icon">📅</span>
                    Monthly
                  </button>
                </div>
              </div>
              
              <div className="view-control-group">
                <span className="control-label">
                  <span className="control-icon">🔀</span>
                  Sort by:
                </span>
                <div className="sort-controls">
                  <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="sort-select"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                  <div className="sort-arrow">
                    {sortOrder === 'desc' ? '⬇️' : '⬆️'}
                  </div>
                </div>
              </div>
            </div>

            <div className="results-summary">
              <p>
                Showing {filteredExpenses.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                {getActiveFilterCount() > 0 && ' (filtered)'}
              </p>
            </div>

            <div className="content-container">
              {expenseViewType === 'day' && (
                <div className="expenses-grouped">
                  {groupByDay(sortedExpenses).map((group, index) => (
                    <div key={index} className="expense-group" style={{ '--index': index }}>
                      <div className="group-header">
                        <div className="group-header-content">
                          <div className="group-title">
                            <span className="group-icon">📅</span>
                            <h4>{group.date}</h4>
                          </div>
                          <div className="group-summary">
                            <span className="group-count">
                              {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                            </span>
                            <span className="group-total">{formatCurrency(group.total)}</span>
                          </div>
                        </div>
                        <div className="group-timeline"></div>
                      </div>
                      <div className="group-content">
                        {group.expenses.map((expense, expIndex) => (
                          <ExpenseItem 
                            key={expense.id} 
                            expense={expense} 
                            roommates={roommates}
                            index={expIndex}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expenseViewType === 'week' && (
                <div className="expenses-grouped">
                  {groupByWeek(sortedExpenses).map((group, index) => (
                    <div key={index} className="expense-group" style={{ '--index': index }}>
                      <div className="group-header">
                        <div className="group-header-content">
                          <div className="group-title">
                            <span className="group-icon">🗓️</span>
                            <h4>{`Week ${group.week}, ${group.year}`}</h4>
                          </div>
                          <div className="group-summary">
                            <span className="group-count">
                              {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                            </span>
                            <span className="group-total">{formatCurrency(group.total)}</span>
                          </div>
                        </div>
                        <div className="group-timeline"></div>
                      </div>
                      <div className="group-content">
                        {group.expenses.map((expense, expIndex) => (
                          <ExpenseItem 
                            key={expense.id} 
                            expense={expense} 
                            roommates={roommates}
                            index={expIndex}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expenseViewType === 'month' && (
                <div className="expenses-grouped">
                  {groupByMonth(sortedExpenses).map((group, index) => (
                    <div key={index} className="expense-group" style={{ '--index': index }}>
                      <div className="group-header">
                        <div className="group-header-content">
                          <div className="group-title">
                            <span className="group-icon">📅</span>
                            <h4>{`${group.month} ${group.year}`}</h4>
                          </div>
                          <div className="group-summary">
                            <span className="group-count">
                              {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                            </span>
                            <span className="group-total">{formatCurrency(group.total)}</span>
                          </div>
                        </div>
                        <div className="group-timeline"></div>
                      </div>
                      <div className="group-content">
                        {group.expenses.map((expense, expIndex) => (
                          <ExpenseItem 
                            key={expense.id} 
                            expense={expense} 
                            roommates={roommates}
                            index={expIndex}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
      ) : (
        filteredSettlements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-text">
              {settlements.length === 0 
                ? "No settlements recorded yet."
                : "No settlements match your filters. Try adjusting your filter criteria."
              }
            </p>
            {settlements.length > 0 && (
              <button 
                className="redirect-button"
                onClick={resetFilters}
              >
                <span className="button-icon">🔄</span>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="settlements-container">
            <div className="results-summary">
              <p>
                Showing {filteredSettlements.length} of {settlements.length} settlement{settlements.length !== 1 ? 's' : ''}
                {getActiveFilterCount() > 0 && ' (filtered)'}
              </p>
            </div>
            
            <div className="settlements-list">
              {sortedSettlements.map((settlement, index) => {
                const fromRoommate = roommates.find(r => r.id === parseInt(settlement.fromId));
                const toRoommate = roommates.find(r => r.id === parseInt(settlement.toId));
                
                return (
                  <div key={settlement.id} className="settlement-card" style={{ '--index': index }}>
                    <div className="settlement-timeline">
                      <div className="timeline-dot"></div>
                      {index !== sortedSettlements.length - 1 && (
                        <div className="timeline-line"></div>
                      )}
                    </div>
                    
                    <div className="settlement-content">
                      <div className="settlement-date">
                        <span className="date-icon">📅</span>
                        {formatDate(settlement.date)}
                      </div>
                      
                      <div className="settlement-details">
                        <div className="settlement-flow">
                          <div className="from-person">
                            <div className="person-avatar from-avatar">
                              {fromRoommate?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="person-name">{fromRoommate?.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="flow-arrow">
                            <span className="arrow-icon">→</span>
                            <div className="flow-amount">{formatCurrency(parseFloat(settlement.amount) || 0)}</div>
                          </div>
                          
                          <div className="to-person">
                            <div className="person-avatar to-avatar">
                              {toRoommate?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="person-name">{toRoommate?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        
                        <div className="settlement-status">
                          <span className="status-badge">
                            <span className="status-icon">✅</span>
                            Settled
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default HistorySection;