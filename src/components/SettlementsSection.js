import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import SettlementModal from './SettlementModal';
import { FaHistory, FaExchangeAlt, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import './settlements.css';

const SettlementsSection = ({
  roommates,
  expenses,
  settlements,
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get date X days ago
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  // Calculate pending settlements
  const pendingSettlements = paymentSuggestions.map(suggestion => ({
    id: `pending-${suggestion.fromId}-${suggestion.toId}`,
    fromId: suggestion.fromId,
    toId: suggestion.toId,
    fromName: suggestion.fromName,
    toName: suggestion.toName,
    amount: suggestion.amount,
    status: 'pending',
    date: getTodayDate() // Use today's date for pending settlements
  }));

  // Combine pending and completed settlements
  const allSettlements = [
    ...pendingSettlements,
    ...settlements.map(s => ({
      ...s,
      status: 'completed',
      date: s.date || s.createdAt || getTodayDate() // Ensure date exists
    }))
  ];

  // Filter settlements function
  const filterSettlements = (settlement) => {
    // Status filter
    if (filterType === 'pending' && settlement.status !== 'pending') return false;
    if (filterType === 'completed' && settlement.status !== 'completed') return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fromName = settlement.fromName?.toLowerCase() || '';
      const toName = settlement.toName?.toLowerCase() || '';
      
      if (!fromName.includes(searchLower) && !toName.includes(searchLower)) {
        return false;
      }
    }
    
    // Date filter
    if (dateFilter !== 'all' && settlement.date) {
      const settlementDate = new Date(settlement.date);
      
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (settlementDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (settlementDate < monthAgo) return false;
      }
      // Note: For 'custom' date filter, you would need additional state for custom dates
    }
    
    return true;
  };

  // Apply filters
  const filteredSettlements = allSettlements.filter(filterSettlements);

  // Sort by date (newest first)
  const sortedSettlements = [...filteredSettlements].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // Calculate settlement statistics
  const settlementStats = {
    total: settlements.length,
    pending: pendingSettlements.length,
    totalAmount: settlements.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0),
    pendingAmount: pendingSettlements.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterType('all');
    setSearchTerm('');
    setDateFilter('all');
  };

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
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterType === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterType('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${filterType === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterType('completed')}
            >
              Completed
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
              className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
            <button 
              className={`filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              Last Week
            </button>
            <button 
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
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Clear All Filters Button */}
        {(filterType !== 'all' || searchTerm || dateFilter !== 'all') && (
          <button 
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
              <p className="empty-text">No settlements found</p>
              <button 
                className="clear-filters-btn"
                onClick={clearAllFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            sortedSettlements.map((settlement, index) => (
              <div key={settlement.id || index} className={`settlement-row ${settlement.status}`}>
                <div className="settlement-cell">
                  <div className="user-info">
                    <div className="avatar">
                      {settlement.fromName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">{settlement.fromName}</span>
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className="user-info">
                    <div className="avatar">
                      {settlement.toName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">{settlement.toName}</span>
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className={`amount ${settlement.status === 'pending' ? 'pending-amount' : 'completed-amount'}`}>
                    {formatCurrency(settlement.amount)}
                  </div>
                </div>
                
                <div className="settlement-cell">
                  <div className="date">
                    {settlement.date}
                    {settlement.status === 'pending' && (
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
                        className="action-btn settle-btn"
                        onClick={() => onOpenSettleModal(settlement.fromId, settlement.toId)}
                      >
                        Settle Now
                      </button>
                    ) : (
                      <button
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
              <button className="close-btn" onClick={() => setSelectedSettlement(null)}>×</button>
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
                <span className="detail-value">{selectedSettlement.date}</span>
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
              <button className="btn-secondary" onClick={() => setSelectedSettlement(null)}>
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
