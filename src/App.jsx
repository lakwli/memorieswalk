import React, { useState } from 'react';
import './App.css';

// Previous functions remain the same: calculateIRR, generateCashflows
const calculateIRR = (cashflows) => {
  let guess = 0.1;
  const maxIterations = 100;
  const tolerance = 0.0000001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivativeNPV = 0;
    const firstDate = new Date(cashflows[0].date);

    cashflows.forEach((cf) => {
      const date = new Date(cf.date);
      const years = (date - firstDate) / (365 * 24 * 60 * 60 * 1000);
      const amount = cf.type === 'deposit' ? -cf.amount : cf.amount;

      npv += amount / Math.pow(1 + guess, years);
      derivativeNPV += -years * amount / Math.pow(1 + guess, years + 1);
    });

    const nextGuess = guess - npv / derivativeNPV;
    if (Math.abs(nextGuess - guess) < tolerance) {
      return nextGuess;
    }
    guess = nextGuess;
  }
  return guess;
};

const generateVerificationTable = (cashflows, irr) => {
  const sortedCashflows = [...cashflows].sort((a, b) => new Date(a.date) - new Date(b.date));
  let balance = 0;
  const firstDate = new Date(sortedCashflows[0].date);
  const lastDate = new Date(sortedCashflows[sortedCashflows.length - 1].date);
  const result = [];
  let lastYearFraction = 0;

  // Get all years between first and last transaction
  const startYear = firstDate.getFullYear();
  const endYear = lastDate.getFullYear();
  const years = new Set();
  for (let year = startYear; year <= endYear; year++) {
    years.add(year);
  }

  // Process actual cashflows and EOY projections
  const allDates = [...sortedCashflows.map(cf => ({ 
    date: cf.date, 
    isTransaction: true, 
    cashflow: cf,
    isFinal: false
  }))];

  // Add EOY dates
  Array.from(years).forEach(year => {
    const eoyDate = `${year}-12-31`;
    if (!sortedCashflows.some(cf => cf.date === eoyDate)) {
      allDates.push({ 
        date: eoyDate, 
        isTransaction: false,
        isFinal: false
      });
    }
  });

  // Find the last actual transaction
  const lastTransaction = sortedCashflows[sortedCashflows.length - 1];
  const lastTransactionDate = new Date(lastTransaction.date);
  const preFinalDate = new Date(lastTransactionDate);
  preFinalDate.setDate(preFinalDate.getDate() - 1);
  
  // Add pre-final balance date
  allDates.push({
    date: preFinalDate.toISOString().split('T')[0],
    isTransaction: false,
    isPreFinal: true
  });

  // Mark the last transaction
  allDates.find(d => d.date === lastTransaction.date).isFinal = true;

  // Sort all dates
  allDates.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Process each date
  allDates.forEach(entry => {
    const date = new Date(entry.date);
    const yearFraction = (date - firstDate) / (365 * 24 * 60 * 60 * 1000);
    let growthAmount = 0;
    let transactionAmount = 0;

    if (yearFraction > 0) {
      const newBalance = balance * Math.pow(1 + irr, yearFraction - lastYearFraction);
      growthAmount = newBalance - balance;
      balance = newBalance;
    }

    if (entry.isTransaction) {
      const cf = entry.cashflow;
      transactionAmount = cf.type === 'deposit' ? cf.amount : -cf.amount;
      
      // Update the final balance with both growth and transaction
      balance += transactionAmount;

      result.push({
        date: entry.date,
        type: cf.type === 'deposit' ? 'deposit' : 'withdraw',
        amount: Math.abs(cf.amount),
        growthAmount: Math.round(growthAmount * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        isEoy: false,
        isPreFinal: false,
        isFinal: entry.isFinal
      });
    } else if (entry.isPreFinal) {
      result.push({
        date: entry.date,
        type: 'Pre-Final Balance',
        amount: 0,
        growthAmount: Math.round(growthAmount * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        isEoy: false,
        isPreFinal: true,
        isFinal: false
      });
    } else {
      // EOY projection
      result.push({
        date: entry.date,
        type: 'EOY Balance',
        amount: 0,
        growthAmount: Math.round(growthAmount * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        isEoy: true,
        isPreFinal: false,
        isFinal: false
      });
    }

    lastYearFraction = yearFraction;
  });

  return result;
};

const generateCashflows = (baseFlow, occurrence) => {
  if (!occurrence || occurrence.count <= 1) return [baseFlow];

  const flows = [];
  const baseDate = new Date(baseFlow.date);
  
  for (let i = 0; i < occurrence.count; i++) {
    const newDate = new Date(baseDate);
    
    if (occurrence.frequency === 'year') {
      newDate.setFullYear(baseDate.getFullYear() + i);
    } else if (occurrence.frequency === 'quarter') {
      newDate.setMonth(baseDate.getMonth() + (i * 3));
    }

    flows.push({
      ...baseFlow,
      date: newDate.toISOString().split('T')[0]
    });
  }

  return flows;
};

const App = () => {
  const [cashflows, setCashflows] = useState([
    { 
      id: 1, 
      date: '', 
      amount: '', 
      type: 'deposit',
      occurrence: { frequency: 'none', count: 1 }
    },
    { 
      id: 2, 
      date: '', 
      amount: '', 
      type: 'received',
      occurrence: { frequency: 'none', count: 1 }
    }
  ]);
  const [result, setResult] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedId(null);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedId === id) return;

    const draggedIndex = cashflows.findIndex(cf => cf.id === draggedId);
    const hoverIndex = cashflows.findIndex(cf => cf.id === id);

    if (draggedIndex === -1 || hoverIndex === -1) return;

    const draggedRow = e.currentTarget.parentNode.children[draggedIndex];
    const hoverRow = e.currentTarget.parentNode.children[hoverIndex];

    if (draggedRow && hoverRow) {
      const hoverBoundingRect = hoverRow.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = e.clientY - hoverBoundingRect.top;

      // Only perform the move when mouse has crossed half of the item's height
      if (draggedIndex < hoverIndex && clientOffset < hoverMiddleY) return;
      if (draggedIndex > hoverIndex && clientOffset > hoverMiddleY) return;

      // Perform the reorder
      const newCashflows = [...cashflows];
      const [removed] = newCashflows.splice(draggedIndex, 1);
      newCashflows.splice(hoverIndex, 0, removed);
      setCashflows(newCashflows);
    }
  };

  const handleDragEnter = (e) => {
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleAddCashflow = () => {
    setCashflows([...cashflows, {
      id: Date.now(),
      date: '',
      amount: '',
      type: 'deposit',
      occurrence: { frequency: 'none', count: 1 }
    }]);
  };

  const handleRemoveCashflow = (id) => {
    setCashflows(cashflows.filter(cf => cf.id !== id));
  };

  const handleCashflowChange = (id, field, value) => {
    setCashflows(cashflows.map(cf => 
      cf.id === id ? { ...cf, [field]: value } : cf
    ));
  };

  const handleOccurrenceChange = (id, field, value) => {
    setCashflows(cashflows.map(cf =>
      cf.id === id ? {
        ...cf,
        occurrence: {
          ...cf.occurrence,
          [field]: value
        }
      } : cf
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isValid = cashflows.every(cf => 
      cf.date && 
      cf.amount && 
      !isNaN(parseFloat(cf.amount)) && 
      parseFloat(cf.amount) > 0
    );

    if (!isValid) {
      alert('Please fill all fields with valid values');
      return;
    }

    const expandedCashflows = cashflows.flatMap(cf => 
      generateCashflows({
        date: cf.date,
        amount: parseFloat(cf.amount),
        type: cf.type
      }, cf.occurrence)
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const irr = calculateIRR(expandedCashflows);
    const verificationTable = generateVerificationTable(expandedCashflows, irr);

    setResult({
      irr: irr * 100,
      table: verificationTable
    });
  };

  return (
    <div className="App">
      <h1>Dynamic Cashflow IRR Calculator</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="cashflows">
          {cashflows.map((cf) => (
            <div
              key={cf.id}
              className="cashflow-row"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, cf.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, cf.id)}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <div className="drag-handle">⋮⋮</div>
              <select
                value={cf.type}
                onChange={(e) => handleCashflowChange(cf.id, 'type', e.target.value)}
              >
                <option value="deposit">Deposit</option>
                <option value="received">Received</option>
              </select>

              <input
                type="date"
                value={cf.date}
                onChange={(e) => handleCashflowChange(cf.id, 'date', e.target.value)}
                required
              />

              <input
                type="number"
                value={cf.amount}
                onChange={(e) => handleCashflowChange(cf.id, 'amount', e.target.value)}
                placeholder="Amount"
                step="0.01"
                min="0"
                required
              />

              <select
                value={cf.occurrence.frequency}
                onChange={(e) => handleOccurrenceChange(cf.id, 'frequency', e.target.value)}
              >
                <option value="none">One time</option>
                <option value="year">Yearly</option>
                <option value="quarter">Quarterly</option>
              </select>

              {cf.occurrence.frequency !== 'none' && (
                <input
                  type="number"
                  value={cf.occurrence.count}
                  onChange={(e) => handleOccurrenceChange(cf.id, 'count', parseInt(e.target.value))}
                  placeholder="Occurrences"
                  min="1"
                  required
                />
              )}

              {cashflows.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCashflow(cf.id)}
                  className="remove-btn"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={handleAddCashflow} className="add-btn">
          Add Cashflow
        </button>

        <button type="submit" className="submit-btn">
          Calculate IRR
        </button>
      </form>

      {result && (
        <div className="results">
          <h2>Results</h2>
          <p className="irr-result">Internal Rate of Return (IRR): {result.irr.toFixed(2)}%</p>
          
          <h3>Verification Table</h3>
          <p className="verification-description">
            This table demonstrates the equivalent scenario of a fixed-term deposit with an annual compounding rate 
            matching the calculated IRR, validating the return calculation over the investment period.
          </p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th className="number">Amount</th>
                <th className="number">Growth</th>
                <th className="number">Balance</th>
              </tr>
            </thead>
            <tbody>
              {result.table.map((row, index) => (
                <tr 
                  key={index} 
                  className={
                    row.isEoy ? 'eoy-row' : 
                    row.isPreFinal ? 'pre-final-row' : ''
                  }
                >
                  <td>{row.date}</td>
                  <td>{row.type}</td>
                  <td className="number">
                    ${row.type === 'withdraw' 
                      ? `-${row.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                      : row.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="number">
                    ${row.growthAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="number">
                    ${row.balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
