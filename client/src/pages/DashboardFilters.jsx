import React from 'react';

const DashboardFilter = ({ dateFilter, setDateFilter, customStart, setCustomStart, customEnd, setCustomEnd }) => {
  return (
    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ fontWeight: '600', fontSize: '1rem' }}>Global Filter:</div>
      
      <select 
         value={dateFilter} 
         onChange={(e) => setDateFilter(e.target.value)}
         style={{ padding: '8px', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', outline:'none', cursor:'pointer' }}
      >
         <option value="All">All Time</option>
         <option value="Daily">Today</option>
         <option value="Weekly">Last 7 Days</option>
         <option value="Monthly">This Month</option>
         <option value="Custom">Custom Date</option>
      </select>
      
      {dateFilter === 'Custom' && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ padding: '6px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }} />
          <span style={{color: 'var(--text-muted)'}}>to</span>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ padding: '6px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }} />
        </div>
      )}
    </div>
  );
};

export default DashboardFilter;
