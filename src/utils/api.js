import { API_URL } from '../constants/config';

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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

export const fetchRoommates = () => apiRequest('/roommates');
export const fetchExpenses = () => apiRequest('/expenses');
export const fetchSettlements = () => apiRequest('/settlements');

export const addRoommate = (name) => 
  apiRequest('/roommates', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const removeRoommate = (id) => 
  apiRequest(`/roommates/${id}`, {
    method: 'DELETE',
  });

export const addExpense = (expenseData) => 
  apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });

export const addSettlement = (settlementData) => 
  apiRequest('/settlements', {
    method: 'POST',
    body: JSON.stringify(settlementData),
  });