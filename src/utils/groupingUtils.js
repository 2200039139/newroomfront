// utils/groupingUtils.js
// Utility functions for grouping expenses by time periods

export const groupByDay = (expensesList) => {
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

export const groupByWeek = (expensesList) => {
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

export const groupByMonth = (expensesList) => {
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