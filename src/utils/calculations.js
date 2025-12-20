// utils/calculations.js

export const generatePaymentSuggestions = (roommates, splits) => {
  try {
    if (!roommates || !Array.isArray(roommates) || roommates.length === 0) {
      return [];
    }

    if (!splits || typeof splits !== 'object') {
      return [];
    }

    // Create an array of balances
    const balances = roommates.map(roommate => {
      const split = splits[roommate.id] || { paid: 0, owes: 0, net: 0 };
      return {
        id: roommate.id,
        name: roommate.name || `Roommate ${roommate.id}`,
        balance: parseFloat(split.net) || 0
      };
    }).filter(roommate => Math.abs(roommate.balance) > 0.01);

    // Sort by balance (negative first, then positive)
    balances.sort((a, b) => a.balance - b.balance);

    const suggestions = [];
    let i = 0;
    let j = balances.length - 1;

    while (i < j) {
      const debtor = balances[i]; // Negative balance (owes money)
      const creditor = balances[j]; // Positive balance (is owed money)

      if (Math.abs(debtor.balance) < 0.01 || Math.abs(creditor.balance) < 0.01) {
        i++;
        j--;
        continue;
      }

      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
      
      if (amount > 0.01) {
        suggestions.push({
          from: debtor.id,
          fromName: debtor.name,
          to: creditor.id,
          toName: creditor.name,
          amount: parseFloat(amount.toFixed(2))
        });

        // Update balances
        debtor.balance += amount;
        creditor.balance -= amount;

        // If debtor balance is close to zero, move to next debtor
        if (Math.abs(debtor.balance) < 0.01) {
          i++;
        }
        // If creditor balance is close to zero, move to next creditor
        if (Math.abs(creditor.balance) < 0.01) {
          j--;
        }
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating payment suggestions:', error);
    return [];
  }
};

// Function to calculate outstanding balance from splits
export const calculateOutstandingBalance = (splits) => {
  try {
    if (!splits || typeof splits !== 'object') {
      return 0;
    }

    let totalOutstanding = 0;
    
    // Sum up all positive balances (amounts owed to others)
    Object.values(splits).forEach(split => {
      if (split && typeof split === 'object') {
        // If net balance is negative (person owes money), add to outstanding
        const net = parseFloat(split.net) || 0;
        if (net < 0) {
          totalOutstanding += Math.abs(net);
        }
      }
    });

    return parseFloat(totalOutstanding.toFixed(2));
  } catch (error) {
    console.error('Error calculating outstanding balance:', error);
    return 0;
  }
};

// Alternative calculation: Sum of all money that needs to change hands
export const calculateTotalOutstanding = (splits) => {
  try {
    if (!splits || typeof splits !== 'object') {
      return 0;
    }

    let total = 0;
    
    Object.values(splits).forEach(split => {
      if (split && typeof split === 'object') {
        const net = parseFloat(split.net) || 0;
        total += Math.abs(net);
      }
    });

    // Divide by 2 because each transaction involves two people
    return parseFloat((total / 2).toFixed(2));
  } catch (error) {
    console.error('Error calculating total outstanding:', error);
    return 0;
  }
};

// Function to calculate total amount owed (negative balances)
export const calculateTotalOwed = (splits) => {
  try {
    if (!splits || typeof splits !== 'object') {
      return 0;
    }

    let totalOwed = 0;
    
    Object.values(splits).forEach(split => {
      if (split && typeof split === 'object') {
        const owes = parseFloat(split.owes) || 0;
        totalOwed += owes;
      }
    });

    return parseFloat(totalOwed.toFixed(2));
  } catch (error) {
    console.error('Error calculating total owed:', error);
    return 0;
  }
};

// Function to calculate total amount paid
export const calculateTotalPaid = (splits) => {
  try {
    if (!splits || typeof splits !== 'object') {
      return 0;
    }

    let totalPaid = 0;
    
    Object.values(splits).forEach(split => {
      if (split && typeof split === 'object') {
        const paid = parseFloat(split.paid) || 0;
        totalPaid += paid;
      }
    });

    return parseFloat(totalPaid.toFixed(2));
  } catch (error) {
    console.error('Error calculating total paid:', error);
    return 0;
  }
};