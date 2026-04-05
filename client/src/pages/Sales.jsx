import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus } from 'lucide-react';
import DashboardFilter from '../pages/DashboardFilters'; // Importing our reusable filter!

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({ itemId: '', quantitySold: 1, soldRate: 0 });

  // 1. BRAND NEW STATES FOR OUR FILTERS
  const [searchName, setSearchName] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchData = async () => {
    try {
      const [salesRes, itemsRes] = await Promise.all([ api.get('/sales'), api.get('/items') ]);
      setSales(salesRes.data);
      setItems(itemsRes.data.filter(i => i.remainingQuantity > 0)); // Only items in stock
      if(itemsRes.data.length > 0 && formData.itemId === '') {
          setFormData(prev => ({...prev, itemId: itemsRes.data[0].id}));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.post('/sales', formData);
      setShowForm(false);
      setFormData({ itemId: items.length > 0 ? items[0].id : '', quantitySold: 1, soldRate: 0 });
      fetchData();
    } catch (err) { 
      setErrorMsg(typeof err.response?.data === 'string' ? err.response.data : "An error occurred while adding the sale.");
    }
  };

  // 2. THE DUAL-FILTER LOGIC (Name + Date)
  const getFilteredSales = () => {
    const now = new Date();
    return sales.filter(sale => {
      // Logic A: Filter by Name
      const itemName = sale.item ? sale.item.name.toLowerCase() : '';
      if (searchName && !itemName.includes(searchName.toLowerCase())) {
        return false; // Skip this sale if the name doesn't match roughly what we typed
      }

      // Logic B: Filter by Date
      const saleDate = new Date(sale.saleDate);
      if(dateFilter === "Daily"){
        return saleDate.getFullYear() === now.getFullYear() &&
               saleDate.getMonth() === now.getMonth() &&
               saleDate.getDate() === now.getDate();
      }
      if(dateFilter === "Weekly"){
         const oneWeekAgo = new Date();
         oneWeekAgo.setDate(now.getDate() - 7); 
         return saleDate >= oneWeekAgo && saleDate <= now;
      }
      if(dateFilter === "Monthly"){
         return saleDate.getFullYear() === now.getFullYear() &&
                saleDate.getMonth() === now.getMonth();
      }
      if(dateFilter === "Custom"){
         if(!customStart || !customEnd) return true;
         const start = new Date(customStart);
         start.setHours(0, 0, 0, 0); 
         const end = new Date(customEnd);
         end.setHours(23, 59, 59, 999); 
         return saleDate >= start && saleDate <= end;
      }
      return true;
    });
  };

  const filteredSales = getFilteredSales();
  const filteredTotalAmount = filteredSales.reduce((acc, curr) => acc + curr.totalSalesAmount, 0);

  return (
    <div>
      <div className="page-title">
        Sales Management
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Record New Sale
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          {errorMsg && <div style={{color: 'var(--danger)', marginBottom: '16px', fontWeight: 600}}>{errorMsg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Select Item</label>
                <select required value={formData.itemId} onChange={e => setFormData({...formData, itemId: parseInt(e.target.value)})}>
                  <option value="">-- Select an Item --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.remainingQuantity} in stock)</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Quantity Sold (Suits)</label>
                <input required type="number" min="1" value={formData.quantitySold} onChange={e => setFormData({...formData, quantitySold: parseInt(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>Sold Rate (Per Suit)</label>
                <input required type="number" step="0.01" value={formData.soldRate} onChange={e => setFormData({...formData, soldRate: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            {/* The Submit button you accidentally deleted returns! */}
            <button type="submit" className="btn btn-primary" disabled={items.length === 0}>Record Sale</button>
          </form>
        </div>
      )}

      {/* 3. OUR NEW FILTER UI (Side-by-Side Flexbox) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>🔍 Search by Cloth Name:</label>
            <input 
               type="text" 
               placeholder="e.g. Premium Cotton, Wash & Wear..." 
               value={searchName} 
               onChange={(e) => setSearchName(e.target.value)} 
               style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
          
          <div style={{ flex: '2', minWidth: '350px' }}>
            <DashboardFilter 
              dateFilter={dateFilter} 
              setDateFilter={setDateFilter} 
              customStart={customStart} 
              setCustomStart={setCustomStart} 
              customEnd={customEnd} 
              setCustomEnd={setCustomEnd} 
            />
          </div>

        </div>
        
        <div style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          Filtered Total Sales: <span style={{ color: 'var(--success)' }}>Rs {filteredTotalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Qty Sold</th>
              <th>Sold Rate</th>
              <th>Total Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id}>
                <td>#{sale.id}</td>
                <td style={{fontWeight: 500}}>{sale.item ? sale.item.name : 'Unknown Item'}</td>
                <td>{sale.quantitySold}</td>
                <td>Rs {sale.soldRate.toLocaleString()}</td>
                <td style={{color: 'var(--success)', fontWeight: 600}}>Rs {sale.totalSalesAmount.toLocaleString()}</td>
                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No sales match your search or date filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
