import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  // const [formData, setFormData] = useState({
  //   name: '', quantity: 0, purchaseRate: 0, dealerName: '', genderCategory: 'Men'
  // });
const [formData, setFormData] = useState({
  name: '', quantity: 0, purchaseRate: 0, dealerName: '', genderCategory: 'Men', clothType: 'Wash & Wear'
});

  const fetchData = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/items', formData);
      setShowForm(false);
      setFormData({ name: '', quantity: 0, purchaseRate: 0, dealerName: '', genderCategory: 'Men' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-title">
        Inventory Management
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Item Name (Cloth / Suit type)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Quantity Purchased In Meter</label>
                <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>Purchase Rate (Per Meter)</label>
                <input required type="number" step="0.01" value={formData.purchaseRate} onChange={e => setFormData({...formData, purchaseRate: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>Dealer / Supplier Name</label>
                <input required type="text" value={formData.dealerName} onChange={e => setFormData({...formData, dealerName: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Gender Category</label>
                <select value={formData.genderCategory} onChange={e => setFormData({...formData, genderCategory: e.target.value})}>
                  <option>Men</option>
                  <option>Women</option>
                  <option>Kids</option>
                </select>
              </div>
              <div className="input-group">
  <label>Cloth Type</label>
  <select value={formData.clothType} onChange={e => setFormData({...formData, clothType: e.target.value})}>
    <option value="Wash & Wear">Wash & Wear (4.0m per suit)</option>
    <option value="Cotton">Cotton (4.5m per suit)</option>
  </select>
</div>

            </div>
            <button type="submit" className="btn btn-primary">Save Item</button>
          </form>
        </div>
      )}

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Original Qty(Meter)</th>
              <th>Remaining Qty(Meter)</th>
              <th>Rate</th>
              <th>Total Purchase Amount</th>
              <th>Dealer</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const totalPurchaseAmount=item.quantity*item.purchaseRate;
              return(
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td style={{fontWeight: 500}}>{item.name}</td>
                <td>{item.quantity}</td>
                <td>
                  <span className={`badge ${item.remainingQuantity > 5 ? 'badge-success' : 'badge-danger'}`}>
                    {item.remainingQuantity}
                  </span>
                </td>
                <td>Rs {item.purchaseRate.toLocaleString()}</td>
                <td>Rs{totalPurchaseAmount.toLocaleString()}</td>
                <td>{item.dealerName}</td>
                <td>{item.genderCategory}</td>
              </tr>
            );
})}
            {items.length === 0 && (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No inventory items found. Add one above!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
