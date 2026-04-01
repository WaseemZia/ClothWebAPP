import React from 'react';

const ExpensesFilter = ({ filter, setFilter, totalAmount }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div className="input-group" style={{ marginBottom: 0, minWidth: '200px' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All Time Expenses</option>
          <option value="Daily">Today's Expenses</option>
          <option value="Weekly">Last 7 Days</option>
          <option value="Monthly">This Month</option>
        </select>
      </div>

      <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
        Filtered Total: <span style={{ color: 'var(--danger)' }}>Rs {totalAmount.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default ExpensesFilter;
