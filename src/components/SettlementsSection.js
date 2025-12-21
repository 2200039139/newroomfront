import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { FaHistory, FaExchangeAlt, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import './settlements.css';

const SettlementsSection = ({
  roommates,
  expenses,
  settlements = [],
  splits,
  paymentSuggestions = [],
  onOpenSettleModal,
  setActiveTab,
  viewMode = 'desktop'
}) => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // Get today's date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Calculate pending settlements
  const pendingSettlements = useMemo(() => {
    return paymentSuggestions.map(suggestion => ({
      id: `pending-${suggestion.fromId}-${suggestion.toId}`,
      fromId: suggestion.fromId,
      toId: suggestion.toId,
      fromName: suggestion.fromName,
      toName: suggestion.toName,
      amount: suggestion.amount,
      status: 'pending',
      date: getTodayDate(),
      description: 'Pending settlement'
    }));
  }, [paymentSuggestions]);

  // Calculate completed settlements
  const completedSettlements = useMemo(() => {
    return settlements.map(s => ({
      ...s,
      status: 'completed',
      date: s.date || getTodayDate()
    }));
  }, [settlements]);

  // Combine all settlements
  const allSettlements = useMemo(() => {
    return [...pendingSettlements, ...completedSettlements];
  }, [pendingSettlements, completedSettlements]);

  // Filter settlements function - FIXED FILTER LOGIC
  const filterSettlements = () => {
    let filtered = allSettlements;

    // Apply status filter - FIXED: Check for exact status match
    if (filterType === 'pending') {
      filtered = filtered.filter(settlement => settlement.status === 'pending');
    } else if (filterType === 'completed') {
      filtered = filtered.filter(settlement => settlement.status === 'completed');
    }
    // If filterType is 'all', keep all settlements

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(settlement => {
        const fromName = settlement.fromName?.toLowerCase() || '';
        const toName = settlement.toName?.toLowerCase() || '';
        return fromName.includes(searchLower) || toName.includes(searchLower);
      });
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(settlement => {
        if (!settlement.date) return false;
        
        try {
          const settlementDate = new Date(settlement.date);
          if (isNaN(settlementDate.getTime())) return false;
          
          const settlementDay = new Date(
            settlementDate.getFullYear(), 
            settlementDate.getMonth(), 
            settlementDate.getDate()
          );
          
          if (dateFilter === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return settlementDay >= weekAgo;
          } else if (dateFilter === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return settlementDay >= monthAgo;
          }
        } catch (error) {
          return false;
        }
        
        return true;
      });
    }

    return filtered;
  };

  // Get filtered settlements
  const filteredSettlements = filterSettlements();

  // Sort settlements by date (newest first)
  const sortedSettlements = [...filteredSettlements].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });

  // Calculate statistics
  const settlementStats = {
    total: completedSettlements.length,
    pending: pendingSettlements.length,
    totalAmount: completedSettlements.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0),
    pendingAmount: pendingSettlements.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterType('all');
    setSearchTerm('');
    setDateFilter('all');
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const today = new Date();
      const todayFormatted = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateFormatted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (dateFormatted.getTime() === todayFormatted.getTime()) {
        return 'Today';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Check if settlement is from today
  const isToday = (dateString) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      
      const today = new Date();
      const todayFormatted = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateFormatted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return dateFormatted.getTime() === todayFormatted.getTime();
    } catch (error) {
      return false;
    }
  };

  // Check if any filter is active
  const isAnyFilterActive = filterType !== 'all' || searchTerm.trim() !== '' || dateFilter !== 'all';

  return (
    <div className={`section-container settlements-section ${viewMode === 'mobile' ? 'mobile-view' : ''}`}>
      <div className="section-header">
        <h2>
          <FaExchangeAlt className="header-icon" />
          Settlements
        </h2>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => onOpenSettleModal('', '')}
          >
            <span className="button-icon">+</span>
            Record Settlement
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="settlement-stats">
        <div className="stat-card">
          <div className="stat-icon completed">
            <FaHistory />
          </div>
          <div className="stat-content">
            <h3>{settlementStats.total}</h3>
            <p>Completed Settlements</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaExchangeAlt />
          </div>
          <div className="stat-content">
            <h3>{settlementStats.pending}</h3>
            <p>Pending Settlements</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon amount">
            <span className="currency">₹</span>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(settlementStats.totalAmount)}</h3>
            <p>Total Settled</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon outstanding">
            <span className="currency">₹</span>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(settlementStats.pendingAmount)}</h3>
            <p>To Be Settled</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <div className="filter-label">
            <FaFilter />
            <span>Status</span>
          </div>
          <div className="filter-buttons">
            <button 
              type="button"
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({allSettlements.length})
            </button>
            <button 
              type="button"
              className={`filter-btn ${filterType === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterType('pending')}
            >
              Pending ({pendingSettlements.length})
            </button>
            <button 
              type="button"
              className={`filter-btn ${filterType === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterType('completed')}
            >
              Completed ({completedSettlements.length})
            </button>
          </div>
        </div>
        
        <div className="filter-group">
          <div className="filter-label">
            <FaCalendarAlt />
            <span>Date Range</span>
          </div>
          <div className="filter-buttons">
            <button 
              type="button"
              className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
            <button 
              type="button"
              className={`filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              Last Week
            </button>
            <button 
              type="button"
              className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              Last Month
            </button>
          </div>
        </div>
        
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              type="button"
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Clear All Filters Button */}
        {isAnyFilterActive && (
          <button 
            type="button"
            className="clear-all-filters"
            onClick={clearAllFilters}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Settlements List */}
      <div className="settlements-list">
        <div className="list-header">
          <span className="header-item">From</span>
          <span className="header-item">To</span>
          <span className="header-item">Amount</span>
          <span className="header-item">Date</span>
          <span className="header-item">Status</span>
          <span className="header-item">Actions</span>
        </div>
        
        <div className="list-content">
          {sortedSettlements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p className="empty-text">
                {isAnyFilterActive 
                  ? "No settlements match your filters" 
                  : "No settlements found"}
              </p>
              {isAnyFilterActive && (
                <button 
                  type="button"
                  className="clear-filters-btn"
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            sortedSettlements.map((settlement, index) => (
              <div key={settlement.id || index} className={`settlement-row ${settlement.status}`}>
                <div className="settlement-cell">
                  <div className="user-info">
                    <div className="avatar">
                      {settlement.fromName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="user-name">{settlement.fromName || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className="user-info">
                    <div className="avatar">
                      {settlement.toName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="user-name">{settlement.toName || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className={`amount ${settlement.status === 'pending' ? 'pending-amount' : 'completed-amount'}`}>
                    {formatCurrency(settlement.amount)}
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className="date">
                    {formatDisplayDate(settlement.date)}
                    {settlement.status === 'pending' && isToday(settlement.date) && (
                      <span className="date-badge">Today</span>
                    )}
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className={`status-badge ${settlement.status}`}>
                    {settlement.status === 'pending' ? 'Pending' : 'Completed'}
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className="action-buttons">
                    {settlement.status === 'pending' ? (
                      <button
                        type="button"
                        className="action-btn settle-btn"
                        onClick={() => onOpenSettleModal(settlement.fromId, settlement.toId)}
                      >
                        Settle Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="action-btn view-btn"
                        onClick={() => setSelectedSettlement(settlement)}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settlement Details Modal */}
      {selectedSettlement && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Settlement Details</h3>
              <button 
                type="button"
                className="close-btn" 
                onClick={() => setSelectedSettlement(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">From:</span>
                <span className="detail-value">{selectedSettlement.fromName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">To:</span>
                <span className="detail-value">{selectedSettlement.toName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value amount">{formatCurrency(selectedSettlement.amount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDisplayDate(selectedSettlement.date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status ${selectedSettlement.status}`}>
                  {selectedSettlement.status === 'pending' ? 'Pending' : 'Completed'}
                </span>
              </div>
              {selectedSettlement.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{selectedSettlement.description}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setSelectedSettlement(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementsSection;
