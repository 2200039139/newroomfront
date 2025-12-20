import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './res.css';
import RoommatesSection from './RoommatesSection';
import ExpensesSection from './ExpensesSection';
import SplitsSection from './SplitsSection';
import SettlementsSection from './SettlementsSection';
import HistorySection from './HistorySection';
import SettlementModal from './SettlementModal';
import Notification from './notifications';
import { 
  generatePaymentSuggestions, 
  calculateOutstandingBalance,
  calculateTotalOutstanding,
  calculateTotalOwed,
  calculateTotalPaid 
} from '../utils/calculations';
import { 
  FaUsers, 
  FaReceipt, 
  FaBalanceScale, 
  FaHistory, 
  FaSignOutAlt,
  FaPlusCircle,
  FaUserPlus,
  FaChartPie,
  FaRupeeSign,
  FaBell,
  FaHome,
  FaBars,
  FaTimes,
  FaMobile,
  FaDesktop,
  FaSync,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaExchangeAlt
} from 'react-icons/fa';

const API_URL = 'https://newroomback-production.up.railway.app/api';


const RoommateExpenseTracker = () => {
  const navigate = useNavigate();
  
  const [roommates, setRoommates] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [splits, setSplits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newRoommate, setNewRoommate] = useState('');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    date: new Date().toISOString().split('T')[0],
    splitAmong: []
  });
  
  const [activeTab, setActiveTab] = useState('roommates');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [currentSettlement, setCurrentSettlement] = useState({
    fromId: '',
    toId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [historyTab, setHistoryTab] = useState('expenses');
  const [expenseViewType, setExpenseViewType] = useState('day');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [viewMode, setViewMode] = useState('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalSettlements: 0,
    activeRoommates: 0,
    outstandingBalance: 0,
    averageExpense: 0,
    highestExpense: 0,
    recentActivity: 0
  });

  // Get user info from localStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        navigate('/login');
        return null;
      }
      const parsedUser = JSON.parse(savedUser);
      return {
        fullName: parsedUser?.fullName || 'User',
        email: parsedUser?.email || 'user@example.com'
      };
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      navigate('/login');
      return { fullName: 'User', email: 'user@example.com' };
    }
  });

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setMobileView(isMobile);
      if (isMobile) {
        setSidebarCollapsed(true);
        setViewMode('mobile');
      } else {
        setViewMode('desktop');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fixSplitAmongData = (expensesData) => {
    if (!expensesData || !Array.isArray(expensesData)) {
      return [];
    }
    
    return expensesData.map(expense => {
      let splitAmongArray = [];
      
      if (expense.splitAmong) {
        if (Array.isArray(expense.splitAmong)) {
          splitAmongArray = expense.splitAmong.map(id => {
            const numId = parseInt(id);
            return isNaN(numId) ? 0 : numId;
          }).filter(id => id !== 0);
        } else if (typeof expense.splitAmong === 'string') {
          try {
            const parsed = JSON.parse(expense.splitAmong);
            if (Array.isArray(parsed)) {
              splitAmongArray = parsed.map(id => {
                const numId = parseInt(id);
                return isNaN(numId) ? 0 : numId;
              }).filter(id => id !== 0);
            }
          } catch (e) {
            console.warn('Failed to parse splitAmong as JSON:', e);
            splitAmongArray = [];
          }
        }
      }
      
      return {
        ...expense,
        id: expense.id || Date.now(),
        amount: parseFloat(expense.amount) || 0,
        date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
        splitAmong: splitAmongArray
      };
    });
  };

  // Helper function to convert backend splits array to frontend object format
  const convertSplitsToObject = (splitsArray, roommatesList = []) => {
    const splitsObject = {};
    
    // Initialize with all roommates first
    roommatesList.forEach(roommate => {
      if (roommate && roommate.id) {
        splitsObject[roommate.id] = {
          paid: 0,
          owes: 0,
          net: 0,
          roommateId: roommate.id,
          roommateName: roommate.name || `Roommate ${roommate.id}`
        };
      }
    });
    
    // Update with backend data
    if (splitsArray && Array.isArray(splitsArray)) {
      splitsArray.forEach(split => {
        const roommateId = split.roommate_id || split.roommateId || split.id;
        if (roommateId) {
          // Ensure the object exists for this roommate
          if (!splitsObject[roommateId]) {
            splitsObject[roommateId] = {
              paid: 0,
              owes: 0,
              net: 0,
              roommateId: roommateId,
              roommateName: split.roommateName || `Roommate ${roommateId}`
            };
          }
          
          // Update with backend values
          splitsObject[roommateId].paid = parseFloat(split.paid) || 0;
          splitsObject[roommateId].owes = parseFloat(split.owes) || 0;
          splitsObject[roommateId].net = parseFloat(split.net) || 0;
          
          // Preserve roommate name if not set
          if (!splitsObject[roommateId].roommateName && split.roommateName) {
            splitsObject[roommateId].roommateName = split.roommateName;
          }
        }
      });
    }
    
    return splitsObject;
  };

  // API request helper
  const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          throw new Error('Session expired. Please login again');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  // API functions
  const fetchRoommates = () => apiRequest('/roommates');
  const fetchExpenses = () => apiRequest('/expenses');
  const fetchSettlements = () => apiRequest('/settlements');
  const fetchSplits = () => apiRequest('/splits');
  
  const addRoommateApi = (name) => 
    apiRequest('/roommates', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

  const removeRoommateApi = (id) => 
    apiRequest(`/roommates/${id}`, {
      method: 'DELETE',
    });

  const addExpenseApi = (expenseData) => 
    apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });

  const addSettlementApi = (settlementData) => 
    apiRequest('/settlements', {
      method: 'POST',
      body: JSON.stringify(settlementData),
    });

  // Enhanced statistics calculation
  const calculateStats = useMemo(() => () => {
    try {
      const totalExpenses = Array.isArray(expenses) 
        ? expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
        : 0;
      
      const totalSettlements = Array.isArray(settlements)
        ? settlements.reduce((sum, settlement) => sum + (parseFloat(settlement.amount) || 0), 0)
        : 0;
      
      const activeRoommates = Array.isArray(roommates) ? roommates.length : 0;
      
      // Calculate outstanding balance from splits object
      const outstandingBalance = calculateOutstandingBalance(splits);
      
      // Calculate average expense per roommate
      const averageExpense = activeRoommates > 0 ? totalExpenses / activeRoommates : 0;
      
      // Find highest expense
      const highestExpense = Array.isArray(expenses) && expenses.length > 0
        ? Math.max(...expenses.map(e => parseFloat(e.amount) || 0))
        : 0;
      
      // Calculate recent activity (expenses in last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentActivity = Array.isArray(expenses)
        ? expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= oneWeekAgo;
          }).length
        : 0;
      
      setStats({
        totalExpenses,
        totalSettlements,
        activeRoommates,
        outstandingBalance,
        averageExpense,
        highestExpense,
        recentActivity
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats({
        totalExpenses: 0,
        totalSettlements: 0,
        activeRoommates: 0,
        outstandingBalance: 0,
        averageExpense: 0,
        highestExpense: 0,
        recentActivity: 0
      });
    }
  }, [roommates, expenses, settlements, splits]);

  // Fetch data
  const fetchData = async (showLoading = true) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available, skipping data fetch');
      setIsLoading(false);
      navigate('/login');
      return;
    }
    
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      // Fetch roommates
      const roommatesData = await fetchRoommates();
      
      if (roommatesData.success) {
        const safeRoommates = (roommatesData.data || []).map(roommate => ({
          id: roommate.id || Date.now(),
          name: roommate.name || `Roommate ${roommate.id || 'Unknown'}`,
          ...roommate
        })).filter(roommate => roommate && roommate.id);
        setRoommates(safeRoommates);
      } else {
        throw new Error(roommatesData.error || 'Failed to fetch roommates');
      }
      
      // Fetch expenses
      const expensesData = await fetchExpenses();
      
      if (expensesData.success) {
        const formattedExpenses = fixSplitAmongData(expensesData.data || []);
        setExpenses(formattedExpenses);
      } else {
        throw new Error(expensesData.error || 'Failed to fetch expenses');
      }
      
      // Fetch settlements
      const settlementsData = await fetchSettlements();
      
      if (settlementsData.success) {
        setSettlements(settlementsData.data || []);
      } else {
        throw new Error(settlementsData.error || 'Failed to fetch settlements');
      }
      
      // Fetch splits from backend and convert to object format
      const splitsData = await fetchSplits();
      const currentRoommates = roommatesData.success ? roommatesData.data || [] : [];
      
      if (splitsData.success) {
        const splitsObject = convertSplitsToObject(splitsData.data || [], currentRoommates);
        setSplits(splitsObject);
      } else {
        // Initialize empty splits object
        const splitsObject = {};
        currentRoommates.forEach(roommate => {
          if (roommate && roommate.id) {
            splitsObject[roommate.id] = {
              paid: 0,
              owes: 0,
              net: 0,
              roommateId: roommate.id,
              roommateName: roommate.name || `Roommate ${roommate.id}`
            };
          }
        });
        setSplits(splitsObject);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, []);

  // Calculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Initialize splitAmong when switching to expenses tab
  useEffect(() => {
    if (activeTab === 'expenses' && roommates.length > 0) {
      setNewExpense(prev => ({
        ...prev,
        splitAmong: roommates.map(r => r.id)
      }));
    }
  }, [activeTab, roommates]);

  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (roommates.length === 0 && tab !== 'roommates') {
      showNotification('Please add roommates first', 'info');
      setActiveTab('roommates');
    }
    // Close mobile menu when a tab is selected
    setMobileMenuOpen(false);
  };

  const handleAddRoommate = async () => {
    if (newRoommate.trim() === '') {
      showNotification('Please enter a roommate name', 'error');
      return;
    }
    
    try {
      const result = await addRoommateApi(newRoommate);
      if (result.success) {
        const newRoommateData = {
          id: result.data?.id || Date.now(),
          name: result.data?.name || newRoommate,
          ...result.data
        };
        setRoommates(prev => [...prev, newRoommateData]);
        setNewRoommate('');
        showNotification(`${newRoommate} added successfully!`);
        // Refresh splits after adding roommate
        fetchData(false);
      } else {
        throw new Error(result.error || 'Failed to add roommate');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleRemoveRoommate = async (id) => {
    try {
      const roommateToRemove = roommates.find(roommate => roommate.id === id);
      const result = await removeRoommateApi(id);
      if (result.success) {
        setRoommates(prev => prev.filter(roommate => roommate.id !== id));
        showNotification(`${roommateToRemove?.name || 'Roommate'} removed successfully`, 'info');
        // Refresh splits after removing roommate
        fetchData(false);
      } else {
        throw new Error(result.error || 'Failed to remove roommate');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleAddExpense = async () => {
    if (roommates.length === 0) {
      showNotification('Please add at least one roommate first', 'error');
      setActiveTab('roommates');
      return;
    }
    
    if (newExpense.description.trim() === '') {
      showNotification('Please enter a description', 'error');
      return;
    }
    
    if (newExpense.amount === '' || isNaN(parseFloat(newExpense.amount)) || parseFloat(newExpense.amount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (newExpense.paidBy === '') {
      showNotification('Please select who paid', 'error');
      return;
    }

    if (newExpense.splitAmong.length === 0) {
      showNotification('Please select at least one person to split the expense with', 'error');
      return;
    }

    try {
      const result = await addExpenseApi({
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        paidBy: parseInt(newExpense.paidBy),
        date: newExpense.date,
        splitAmong: newExpense.splitAmong
      });
      
      if (result.success) {
        const newExpenseData = {
          ...result.data,
          amount: parseFloat(result.data.amount) || 0,
          splitAmong: Array.isArray(result.data.splitAmong) ? result.data.splitAmong : [],
          date: result.data.date ? result.data.date.split('T')[0] : new Date().toISOString().split('T')[0]
        };
        
        setExpenses(prev => [newExpenseData, ...prev]);
        showNotification(`Expense "${newExpense.description}" added successfully!`);
        
        setNewExpense({
          description: '',
          amount: '',
          paidBy: '',
          date: newExpense.date,
          splitAmong: roommates.map(r => r.id)
        });
        
        // Refresh splits after adding expense
        fetchData(false);
      } else {
        throw new Error(result.error || 'Failed to add expense');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleAddSettlement = async () => {
    if (!currentSettlement.fromId || !currentSettlement.toId || !currentSettlement.amount || isNaN(parseFloat(currentSettlement.amount))) {
      showNotification('Please fill all settlement details', 'error');
      return;
    }

    if (parseFloat(currentSettlement.amount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    try {
      const result = await addSettlementApi({
        fromId: parseInt(currentSettlement.fromId),
        toId: parseInt(currentSettlement.toId),
        amount: parseFloat(currentSettlement.amount),
        date: currentSettlement.date
      });
      
      if (result.success) {
        setSettlements(prev => [...prev, result.data]);
        setShowSettleModal(false);
        showNotification('Settlement recorded successfully!');
        
        // Reset settlement form
        setCurrentSettlement({
          fromId: '',
          toId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        
        // Refresh all data including splits after settlement
        fetchData(false);
      } else {
        throw new Error(result.error || 'Failed to add settlement');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleOpenSettleModal = (fromId, toId) => {
    setCurrentSettlement({
      fromId: fromId || '',
      toId: toId || '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowSettleModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Generate payment suggestions using splits object
  const getPaymentSuggestions = () => {
    try {
      return generatePaymentSuggestions(roommates, splits);
    } catch (error) {
      console.error('Error generating payment suggestions:', error);
      return [];
    }
  };

  const paymentSuggestions = getPaymentSuggestions();

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'desktop' ? 'mobile' : 'desktop');
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-overlay">
          <div className="spinner">
            <div className="double-bounce1"></div>
            <div className="double-bounce2"></div>
          </div>
          <p>Loading your expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Notification 
        notification={notification} 
        onClose={() => setNotification({ show: false, message: '', type: 'success' })} 
      />
      
      <SettlementModal
        show={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        currentSettlement={currentSettlement}
        setCurrentSettlement={setCurrentSettlement}
        roommates={roommates}
        onAddSettlement={handleAddSettlement}
      />
      
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <FaHome className="logo-icon" />
            {!sidebarCollapsed && <span className="logo-text">ExpenseHub</span>}
          </div>
          <button 
            className="collapse-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <div className="user-profile">
          {user && (
            <>
              <div className="avatar">
                {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="user-details">
                  <h3>{user.fullName}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'roommates' ? 'active' : ''}`}
            onClick={() => handleTabChange('roommates')}
          >
            <FaUsers className="nav-icon" />
            {!sidebarCollapsed && <span>Roommates</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => handleTabChange('expenses')}
          >
            <FaReceipt className="nav-icon" />
            {!sidebarCollapsed && <span>Add Expense</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'splits' ? 'active' : ''}`}
            onClick={() => handleTabChange('splits')}
          >
            <FaBalanceScale className="nav-icon" />
            {!sidebarCollapsed && <span>Splits</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'settlements' ? 'active' : ''}`}
            onClick={() => handleTabChange('settlements')}
          >
            <FaExchangeAlt className="nav-icon" />
            {!sidebarCollapsed && <span>Settlements</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <FaHistory className="nav-icon" />
            {!sidebarCollapsed && <span>History</span>}
          </button>
        </nav>
        
        {!sidebarCollapsed && (
          <div className="quick-stats">
            <h4>Quick Stats</h4>
            <div className="stat-item">
              <FaUsers className="stat-icon" />
              <div>
                <span className="stat-value">{stats.activeRoommates}</span>
                <span className="stat-label">Roommates</span>
              </div>
            </div>
            <div className="stat-item">
              <FaRupeeSign className="stat-icon" />
              <div>
                <span className="stat-value">₹{stats.totalExpenses.toLocaleString()}</span>
                <span className="stat-label">Total Expenses</span>
              </div>
            </div>
            <div className="stat-item">
              <FaChartPie className="stat-icon" />
              <div>
                <span className="stat-value">₹{stats.outstandingBalance.toLocaleString()}</span>
                <span className="stat-label">Outstanding</span>
              </div>
            </div>
          </div>
        )}
        
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-content">
            <h1>
              {activeTab === 'roommates' && <FaUsers />}
              {activeTab === 'expenses' && <FaReceipt />}
              {activeTab === 'splits' && <FaBalanceScale />}
              {activeTab === 'settlements' && <FaExchangeAlt />}
              {activeTab === 'history' && <FaHistory />}
              <span>
                {activeTab === 'roommates' && 'Roommates'}
                {activeTab === 'expenses' && 'Add New Expense'}
                {activeTab === 'splits' && 'Balance & Splits'}
                {activeTab === 'settlements' && 'Settlements'}
                {activeTab === 'history' && 'Transaction History'}
              </span>
            </h1>
            
            <div className="header-actions">
              {/* View Mode Toggle - Visible on desktop */}
              {!mobileView && (
                <button 
                  className="btn-icon view-toggle"
                  onClick={toggleViewMode}
                  title={viewMode === 'desktop' ? 'Switch to Mobile View' : 'Switch to Desktop View'}
                >
                  {viewMode === 'desktop' ? <FaMobile /> : <FaDesktop />}
                </button>
              )}
              
              {/* Sort Button for History Tab */}
              {activeTab === 'history' && (
                <button 
                  className="btn-icon"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                </button>
              )}
              
              <button className="btn-icon">
                <FaBell />
              </button>
            </div>
          </div>
        </header>
        
        {/* View Mode Indicator */}
        <div className="view-mode-indicator">
          <span className={`view-mode-tag ${viewMode}`}>
            {viewMode === 'desktop' ? <FaDesktop /> : <FaMobile />}
            {viewMode === 'desktop' ? 'Desktop View' : 'Mobile View'}
          </span>
        </div>
        
        {/* Stats Cards - Responsive Layout */}
        <div className={`stats-container ${viewMode === 'mobile' ? 'mobile-view' : 'desktop-view'}`}>
          {viewMode === 'desktop' ? (
            // Desktop View: Full analysis with charts and detailed stats
            <div className="stats-grid detailed">
              <div className="stat-card blue">
                <FaUsers className="stat-card-icon" />
                <div className="stat-card-content">
                  <h3>{stats.activeRoommates}</h3>
                  <p>Active Roommates</p>
                  <div className="stat-analysis">
                    <span className="analysis-label">Average per person:</span>
                    <span className="analysis-value">₹{stats.averageExpense.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card green">
                <FaRupeeSign className="stat-card-icon" />
                <div className="stat-card-content">
                  <h3>₹{stats.totalExpenses.toLocaleString()}</h3>
                  <p>Total Expenses</p>
                  <div className="stat-analysis">
                    <span className="analysis-label">Highest expense:</span>
                    <span className="analysis-value">₹{stats.highestExpense.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card orange">
                <FaChartPie className="stat-card-icon" />
                <div className="stat-card-content">
                  <h3>₹{stats.totalSettlements.toLocaleString()}</h3>
                  <p>Settlements Made</p>
                  <div className="stat-analysis">
                    <span className="analysis-label">Recent activity:</span>
                    <span className="analysis-value">{stats.recentActivity} expenses this week</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card red">
                <FaBalanceScale className="stat-card-icon" />
                <div className="stat-card-content">
                  <h3>₹{stats.outstandingBalance.toLocaleString()}</h3>
                  <p>Outstanding Balance</p>
                  <div className="stat-analysis">
                    <span className="analysis-label">To settle:</span>
                    <span className="analysis-value">{paymentSuggestions.length} pending</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Mobile View: Compact stats with swipeable carousel
            <div className="stats-grid compact">
              <div className="stat-card-mobile blue">
                <div className="mobile-stat-header">
                  <FaUsers />
                  <span>Roommates</span>
                </div>
                <div className="mobile-stat-value">{stats.activeRoommates}</div>
                <div className="mobile-stat-label">Active</div>
              </div>
              
              <div className="stat-card-mobile green">
                <div className="mobile-stat-header">
                  <FaRupeeSign />
                  <span>Expenses</span>
                </div>
                <div className="mobile-stat-value">₹{stats.totalExpenses.toLocaleString()}</div>
                <div className="mobile-stat-label">Total</div>
              </div>
              
              <div className="stat-card-mobile orange">
                <div className="mobile-stat-header">
                  <FaChartPie />
                  <span>Settlements</span>
                </div>
                <div className="mobile-stat-value">₹{stats.totalSettlements.toLocaleString()}</div>
                <div className="mobile-stat-label">Made</div>
              </div>
              
              <div className="stat-card-mobile red">
                <div className="mobile-stat-header">
                  <FaBalanceScale />
                  <span>Balance</span>
                </div>
                <div className="mobile-stat-value">₹{stats.outstandingBalance.toLocaleString()}</div>
                <div className="mobile-stat-label">Outstanding</div>
              </div>
            </div>
          )}
          
          {/* Mobile View Toggle */}
          {mobileView && (
            <div className="mobile-view-toggle">
              <button 
                className={`view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewMode('desktop')}
              >
                <FaDesktop /> Detailed
              </button>
              <button 
                className={`view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewMode('mobile')}
              >
                <FaMobile /> Compact
              </button>
            </div>
          )}
        </div>
        
        {/* Tab Content */}
        <div className={`tab-content-wrapper ${viewMode === 'mobile' ? 'mobile-view' : ''}`}>
          {activeTab === 'roommates' && (
            <RoommatesSection
              roommates={roommates}
              newRoommate={newRoommate}
              setNewRoommate={setNewRoommate}
              onAddRoommate={handleAddRoommate}
              onRemoveRoommate={handleRemoveRoommate}
              viewMode={viewMode}
            />
          )}
          
          {activeTab === 'expenses' && (
            <ExpensesSection
              roommates={roommates}
              newExpense={newExpense}
              setNewExpense={setNewExpense}
              onAddExpense={handleAddExpense}
              setActiveTab={setActiveTab}
              viewMode={viewMode}
            />
          )}
          
          {activeTab === 'splits' && (
            <SplitsSection
              roommates={roommates}
              expenses={expenses}
              splits={splits}
              paymentSuggestions={paymentSuggestions}
              onOpenSettleModal={handleOpenSettleModal}
              setActiveTab={setActiveTab}
              viewMode={viewMode}
            />
          )}
          
          {activeTab === 'settlements' && (
            <SettlementsSection
              roommates={roommates}
              expenses={expenses}
              settlements={settlements}
              splits={splits}
              paymentSuggestions={paymentSuggestions}
              onOpenSettleModal={handleOpenSettleModal}
              setActiveTab={setActiveTab}
              viewMode={viewMode}
            />
          )}
          
          {activeTab === 'history' && (
            <HistorySection
              roommates={roommates}
              expenses={expenses}
              settlements={settlements}
              historyTab={historyTab}
              setHistoryTab={setHistoryTab}
              expenseViewType={expenseViewType}
              setExpenseViewType={setExpenseViewType}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              setActiveTab={setActiveTab}
              viewMode={viewMode}
            />
          )}
        </div>
        
        <div className={`quick-actions ${showQuickActions ? 'open' : ''}`}>

  {/* + Toggle Button */}
  <button
    className="quick-action-btn fab-toggle"
    onClick={() => setShowQuickActions(prev => !prev)}
    title="Quick Actions"
  >
    <FaPlus />
  </button>

  {showQuickActions && (
    <>
      <button
        className="quick-action-btn"
        onClick={() => {
          handleTabChange('expenses');
          setShowQuickActions(false);
        }}
        title="Add Expense"
      >
        <FaReceipt />
      </button>

      <button
        className="quick-action-btn"
        onClick={() => {
          handleTabChange('roommates');
          setShowQuickActions(false);
        }}
        title="Add Roommate"
      >
        <FaUserPlus />
      </button>

      <button
        className="quick-action-btn"
        onClick={() => {
          handleTabChange('splits');
          setShowQuickActions(false);
        }}
        title="View Balances"
      >
        <FaBalanceScale />
      </button>

      <button
        className="quick-action-btn"
        onClick={() => {
          handleTabChange('settlements');
          setShowQuickActions(false);
        }}
        title="Settlements"
      >
        <FaExchangeAlt />
      </button>

      <button
        className="quick-action-btn"
        onClick={() => {
          handleRefresh();
          setShowQuickActions(false);
        }}
        title="Refresh Data"
      >
        <FaSync className={isRefreshing ? 'spin' : ''} />
      </button>
    </>
  )}

</div>
  );
};

export default RoommateExpenseTracker;
