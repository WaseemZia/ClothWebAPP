import React from 'react';

const ExpensesFilter = ({ 
    filter, 
    setFilter, 
    totalAmount,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate
 }) => {
  return (
    <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div className="input-group" style={{ marginBottom: 0, minWidth: '200px' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All Time Expenses</option>
          <option value="Daily">Today's Expenses</option>
          <option value="Weekly">Last 7 Days</option>
          <option value="Monthly">This Month</option>
          <option value="Custom">Custom Range</option>
        </select>
      </div>

      <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
        Filtered Total: <span style={{ color: 'var(--danger)' }}>Rs {totalAmount.toLocaleString()}</span>
      </div>
    </div>
     {/* This box only appears if the user selects "Custom Range" */}
      {filter === 'Custom' && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Start Date</label>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={(e) => setCustomStartDate(e.target.value)} 
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>End Date</label>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={(e) => setCustomEndDate(e.target.value)} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesFilter;
