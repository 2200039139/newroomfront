//import { CURRENCY } from '../constants/config';

// utils/currency.js
export const formatCurrency = (value) => {
  // Handle NaN and undefined
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    return '$0.00';
  }
  
  // Format as currency with 2 decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};
