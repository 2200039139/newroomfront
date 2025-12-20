import { useState, useCallback } from 'react';
import {
  fetchRoommates as fetchRoommatesApi,
  fetchExpenses as fetchExpensesApi,
  fetchSettlements as fetchSettlementsApi,
  addRoommate as addRoommateApi,
  removeRoommate as removeRoommateApi,
  addExpense as addExpenseApi,
  addSettlement as addSettlementApi
} from '../utils/api';
import { fixSplitAmongData } from '../utils/calculations';

export const useApi = () => {
  const [roommates, setRoommates] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [roommatesData, expensesData, settlementsData] = await Promise.all([
        fetchRoommatesApi(),
        fetchExpensesApi(),
        fetchSettlementsApi()
      ]);
      
      if (roommatesData.success) {
        setRoommates(roommatesData.data || []);
      } else {
        throw new Error(roommatesData.error || 'Failed to fetch roommates');
      }
      
      if (expensesData.success) {
        const formattedExpenses = fixSplitAmongData(expensesData.data || []);
        setExpenses(formattedExpenses);
      } else {
        throw new Error(expensesData.error || 'Failed to fetch expenses');
      }
      
      if (settlementsData.success) {
        setSettlements(settlementsData.data || []);
      } else {
        throw new Error(settlementsData.error || 'Failed to fetch settlements');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRoommate = useCallback(async (name) => {
    const result = await addRoommateApi(name);
    if (result.success) {
      setRoommates(prev => [...prev, result.data]);
    } else {
      throw new Error(result.error || 'Failed to add roommate');
    }
    return result;
  }, []);

  const removeRoommate = useCallback(async (id) => {
    const result = await removeRoommateApi(id);
    if (result.success) {
      setRoommates(prev => prev.filter(roommate => roommate.id !== id));
    } else {
      throw new Error(result.error || 'Failed to remove roommate');
    }
    return result;
  }, []);

  const addExpense = useCallback(async (expenseData) => {
    const result = await addExpenseApi(expenseData);
    if (result.success) {
      const newExpense = {
        ...result.data,
        amount: parseFloat(result.data.amount) || 0,
        splitAmong: Array.isArray(result.data.splitAmong) ? result.data.splitAmong : [],
        date: result.data.date ? result.data.date.split('T')[0] : new Date().toISOString().split('T')[0]
      };
      setExpenses(prev => [newExpense, ...prev]);
    } else {
      throw new Error(result.error || 'Failed to add expense');
    }
    return result;
  }, []);

  const addSettlement = useCallback(async (settlementData) => {
    const result = await addSettlementApi(settlementData);
    if (result.success) {
      setSettlements(prev => [...prev, result.data]);
    } else {
      throw new Error(result.error || 'Failed to add settlement');
    }
    return result;
  }, []);

  return {
    roommates,
    expenses,
    settlements,
    isLoading,
    error,
    fetchData,
    addRoommate,
    removeRoommate,
    addExpense,
    addSettlement
  };
};