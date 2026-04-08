import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedGender, setSelectedGender] = useState('All');
  
const [formData, setFormData] = useState({ 
  name: '',
  quantity: 0, 
  purchaseRate: 0, 
  dealerName: '', 
  genderCategory: 'Men', 
  clothType: 'Wash & Wear',
  suitType: 'Unstitched',
  metersPerSuit: 0
});

  // Calculate stock summaries
  const menStock = items.filter(i => i.genderCategory === 'Men')
    .reduce((acc, item) => acc + item.remainingQuantity, 0);
    
  const womenUnstitchedStock = items.filter(i => i.genderCategory === 'Women' && i.suitType === 'Unstitched')
    .reduce((acc, item) => acc + item.remainingQuantity, 0);
    
  const womenStitchedStock = items.filter(i => i.genderCategory === 'Women' && i.suitType === 'Stitched')
    .reduce((acc, item) => acc + item.remainingQuantity, 0);

  // Filter items based on selected gender
  const filteredItems = selectedGender === 'All' 
    ? items 
    : items.filter(item => item.genderCategory === selectedGender);

  // Function to fetch items from API
  const fetchData = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  // Load items when component mounts
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        await api.put(`/items/${editingItem.id}`, { ...formData, id: editingItem.id });
        setEditingItem(null);
      } else {
        // Create new item
        await api.post('/items', formData);
      }
      setShowForm(false);
      setFormData({ 
        name: '', 
        quantity: 0, 
        purchaseRate: 0, 
        dealerName: '', 
        genderCategory: 'Men',
        clothType: 'Wash & Wear',
        suitType: 'Unstitched',
        metersPerSuit: 0
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      purchaseRate: item.purchaseRate,
      dealerName: item.dealerName,
      genderCategory: item.genderCategory,
      clothType: item.clothType,
      suitType: item.suitType || 'Unstitched',
      metersPerSuit: item.metersPerSuit || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone!')) {
      try {
        await api.delete(`/Items/${id}`);
        fetchData();
      } catch (err) { 
        console.error(err);
        alert('Failed to delete item. It may have associated sales.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ 
      name: '', 
      quantity: 0, 
      purchaseRate: 0, 
      dealerName: '', 
      genderCategory: 'Men',
      clothType: 'Wash & Wear',
      suitType: 'Unstitched',
      metersPerSuit: 0
    });
  };

  return (
    <div>
      <div className="page-title">
        Inventory Management
        <button className="btn btn-primary" onClick={() => {
          setEditingItem(null);
          setShowForm(!showForm);
        }}>
          <Plus size={18} /> {showForm && editingItem ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {/* Gender Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {['All', 'Men', 'Women'].map(gender => (
          <button
            key={gender}
            className={`btn ${selectedGender === gender ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedGender(gender)}
            style={{
              backgroundColor: selectedGender === gender ? 
                (gender === 'Men' ? '#3B82F6' : gender === 'Women' ? '#EC4899' : 'var(--primary-color)') 
                : 'var(--bg-color)',
              color: selectedGender === gender ? 'white' : 'var(--text-color)'
            }}
          >
            {gender === 'All' ? '📦 All Items' : gender === 'Men' ? '👔 Men' : '👗 Women'}
            {gender !== 'All' && (
              <span style={{ marginLeft: '8px', backgroundColor: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85em' }}>
                {gender === 'Men' 
                  ? items.filter(i => i.genderCategory === 'Men').length 
                  : items.filter(i => i.genderCategory === 'Women').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stock Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <h3>👔 Men's Stock</h3>
          <div className="value">{menStock.toFixed(1)}m</div>
          <small style={{ color: 'var(--text-muted)' }}>~{Math.floor(menStock / 4.25)} suits approx</small>
        </div>
        <div className="stat-card">
          <h3>👗 Women's Unstitched</h3>
          <div className="value">{womenUnstitchedStock.toFixed(1)}m</div>
        </div>
        <div className="stat-card">
          <h3>👚 Women's Stitched</h3>
          <div className="value">{womenStitchedStock} pcs</div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', border: editingItem ? '2px solid var(--warning)' : 'none' }}>
          <h3 style={{ marginBottom: '16px', color: editingItem ? 'var(--warning)' : 'inherit' }}>
            {editingItem ? '✏️ Edit Item' : '➕ Add New Item'}
          </h3>
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
                <select 
                  value={formData.genderCategory} 
                  onChange={e => {
                    const gender = e.target.value;
                    if (gender === 'Men') {
                      // Auto-set for Men based on current cloth type
                      const meters = formData.clothType === 'Cotton' ? 4.5 : 4.0;
                      setFormData({...formData, genderCategory: gender, suitType: 'Unstitched', metersPerSuit: meters});
                    } else {
                      setFormData({...formData, genderCategory: gender, suitType: 'Unstitched', metersPerSuit: 0});
                    }
                  }}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>

              {/* Show Cloth Type ONLY for Men */}
              {formData.genderCategory === 'Men' && (
                <div className="input-group">
                  <label>Cloth Type</label>
                  <select 
                    value={formData.clothType} 
                    onChange={e => {
                      const clothType = e.target.value;
                      const meters = clothType === 'Cotton' ? 4.5 : 4.0;
                      setFormData({...formData, clothType, metersPerSuit: meters});
                    }}
                  >
                    <option value="Wash & Wear">Wash & Wear (4.0m per suit)</option>
                    <option value="Cotton">Cotton (4.5m per suit)</option>
                  </select>
                </div>
              )}

              {/* Show Suit Type ONLY for Women */}
              {formData.genderCategory === 'Women' && (
                <>
                  <div className="input-group">
                    <label>Suit Type</label>
                    <select value={formData.suitType} onChange={e => setFormData({...formData, suitType: e.target.value})}>
                      <option value="Unstitched">Unstitched (Custom meters)</option>
                      <option value="Stitched">Stitched (Ready-to-wear)</option>
                    </select>
                  </div>
                  
                  {/* Show Meters Per Suit ONLY for Women Unstitched */}
                  {formData.suitType === 'Unstitched' && (
                    <div className="input-group">
                      <label>Meters Per Suit</label>
                      <input 
                        required 
                        type="number" 
                        step="0.1" 
                        min="0.1"
                        value={formData.metersPerSuit} 
                        onChange={e => setFormData({...formData, metersPerSuit: parseFloat(e.target.value) || 0})} 
                        placeholder="e.g., 3.5"
                      />
                    </div>
                  )}
                </>
              )}

            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">
                {editingItem ? '💾 Update Item' : '💾 Save Item'}
              </button>
              {editingItem && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Type</th>
              <th>Meters/Suit</th>
              <th>Original Qty</th>
              <th>Remaining Qty</th>
              <th>Rate</th>
              <th>Total Purchase Amount</th>
              <th>Dealer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const totalPurchaseAmount=item.quantity*item.purchaseRate;
              return(
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td style={{fontWeight: 500}}>{item.name}</td>
                <td>{item.genderCategory === 'Men' ? 'Men' : ' Women'}</td>
                <td>
                  {item.genderCategory === 'Women' 
                    ? (item.suitType === 'Stitched' ? 'Stitched' : 'Unstitched')
                    : 'Unstitched'}
                </td>
                <td>
                  {item.genderCategory === 'Men' 
                    ? `${item.metersPerSuit}m`
                    : (item.suitType === 'Unstitched' ? `${item.metersPerSuit}m` : 'N/A')}
                </td>
                <td>
                  {item.genderCategory === 'Women' && item.suitType === 'Stitched'
                    ? `${item.quantity} pcs`
                    : `${item.quantity}m`}
                </td>
                <td>
                  <span className={`badge ${item.remainingQuantity > 5 ? 'badge-success' : 'badge-danger'}`}>
                    {item.genderCategory === 'Women' && item.suitType === 'Stitched'
                      ? `${item.remainingQuantity} pcs`
                      : `${item.remainingQuantity}m`}
                  </span>
                </td>
                <td>Rs {item.purchaseRate.toLocaleString()}</td>
                <td>Rs {totalPurchaseAmount.toLocaleString()}</td>
                <td>{item.dealerName}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => handleEdit(item)}
                      title="Edit Item"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--danger)', color: 'white' }}
                      onClick={() => handleDelete(item.id)}
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
})}
            {filteredItems.length === 0 && (
              <tr><td colSpan="11" style={{textAlign: 'center'}}>
                {selectedGender === 'All' 
                  ? 'No inventory items found. Add one above!' 
                  : `No ${selectedGender}'s items found. Add one above!`}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
