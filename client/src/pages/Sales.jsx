import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus } from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({ itemId: '', quantitySold: 1, soldRate: 0 });

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

  useEffect(() => { fetchData(); }, []);

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
                <label>Quantity Sold</label>
                <input required type="number" min="1" value={formData.quantitySold} onChange={e => setFormData({...formData, quantitySold: parseInt(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>Sold Rate (Per Suit)</label>
                <input required type="number" step="0.01" value={formData.soldRate} onChange={e => setFormData({...formData, soldRate: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={items.length === 0}>Record Sale</button>
          </form>
        </div>
      )}

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
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>#{sale.id}</td>
                <td style={{fontWeight: 500}}>{sale.item ? sale.item.name : 'Unknown Item'}</td>
                <td>{sale.quantitySold}</td>
                <td>Rs {sale.soldRate.toLocaleString()}</td>
                <td style={{color: 'var(--success)', fontWeight: 600}}>Rs {sale.totalSalesAmount.toLocaleString()}</td>
                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No sales recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
