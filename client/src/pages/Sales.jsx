import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DashboardFilter from '../pages/DashboardFilters'; // Importing our reusable filter!

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedGender, setSelectedGender] = useState('');
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({ itemId: '', quantitySold: 1, soldRate: 0 });
  
  // Customer and payment states
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [amountPaid, setAmountPaid] = useState('');
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', address: '' });

  // 1. BRAND NEW STATES FOR OUR FILTERS
  const [searchName, setSearchName] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchData = async (gender = '') => {
    try {
      const itemsUrl = gender ? `/items/by-gender/${gender}` : '/items';
      const [salesRes, itemsRes, customersRes] = await Promise.all([
        api.get('/sales'),
        api.get(itemsUrl),
        api.get('/customers')
      ]);
      setSales(salesRes.data);
      setItems(itemsRes.data.filter(i => i.remainingQuantity > 0));
      setCustomers(customersRes.data);
      if(itemsRes.data.length > 0 && formData.itemId === '') {
          setFormData(prev => ({...prev, itemId: itemsRes.data[0].id}));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const load = async () => {
      await fetchData(selectedGender);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      let customerId = selectedCustomerId ? parseInt(selectedCustomerId) : null;

      // If creating new customer
      if (showCustomerForm && newCustomerData.name && newCustomerData.phone) {
        const customerRes = await api.post('/customers', newCustomerData);
        customerId = customerRes.data.id;
      }

      // Calculate payment details
      const totalAmount = formData.quantitySold * formData.soldRate;
      let amountPaidValue = totalAmount;
      
      if (paymentType === 'partial' && amountPaid) {
        amountPaidValue = parseFloat(amountPaid);
      }

      const saleData = {
        ...formData,
        customerId: customerId,
        amountPaid: amountPaidValue
      };

      if (editingSale) {
        await api.put(`/sales/${editingSale.id}`, saleData);
        setEditingSale(null);
      } else {
        await api.post('/sales', saleData);
      }
      
      setShowForm(false);
      setShowCustomerForm(false);
      setPaymentType('full');
      setAmountPaid('');
      setSelectedCustomerId('');
      setNewCustomerData({ name: '', phone: '', address: '' });
      setFormData({ itemId: items.length > 0 ? items[0].id : '', quantitySold: 1, soldRate: 0 });
      fetchData(selectedGender);
    } catch (err) { 
      setErrorMsg(typeof err.response?.data === 'string' ? err.response.data : "An error occurred while adding the sale.");
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      itemId: sale.itemId,
      quantitySold: sale.quantitySold,
      soldRate: sale.soldRate
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale? This action cannot be undone!')) {
      try {
        await api.delete(`/sales/${id}`);
        fetchData(selectedGender);
      } catch (err) { 
        console.error(err);
        alert('Failed to delete sale.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
    setShowForm(false);
    setShowCustomerForm(false);
    setPaymentType('full');
    setAmountPaid('');
    setSelectedCustomerId('');
    setNewCustomerData({ name: '', phone: '', address: '' });
    setFormData({ itemId: items.length > 0 ? items[0].id : '', quantitySold: 1, soldRate: 0 });
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
        <button className="btn btn-primary" onClick={() => {
          setEditingSale(null);
          setShowForm(!showForm);
        }}>
          <Plus size={18} /> {showForm && editingSale ? 'Cancel' : 'Record New Sale'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', border: editingSale ? '2px solid var(--warning)' : 'none' }}>
          <h3 style={{ marginBottom: '16px', color: editingSale ? 'var(--warning)' : 'inherit' }}>
            {editingSale ? '✏️ Edit Sale' : '➕ Record New Sale'}
          </h3>
          {errorMsg && <div style={{color: 'var(--danger)', marginBottom: '16px', fontWeight: 600}}>{errorMsg}</div>}
          <form onSubmit={handleSubmit}>
            {/* Customer Selection */}
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '12px' }}>👤 Customer Information</h4>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className={`btn ${!showCustomerForm ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowCustomerForm(false)}
                >
                  Select Existing Customer
                </button>
                <button
                  type="button"
                  className={`btn ${showCustomerForm ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowCustomerForm(true)}
                >
                  Add New Customer
                </button>
              </div>

              {showCustomerForm ? (
                <div className="form-grid">
                  <div className="input-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      value={newCustomerData.name}
                      onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      value={newCustomerData.phone}
                      onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                      placeholder="0300-1234567"
                    />
                  </div>
                  <div className="input-group">
                    <label>Address (Optional)</label>
                    <input
                      type="text"
                      value={newCustomerData.address}
                      onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label>Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">-- Walk-in Customer (No Customer) --</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-grid">
              {/* Gender Filter */}
              <div className="input-group">
                <label>Filter by Gender</label>
                <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)}>
                  <option value="">All Genders</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>

              <div className="input-group">
                <label>Select Item</label>
                <select required value={formData.itemId} onChange={e => setFormData({...formData, itemId: parseInt(e.target.value)})}>
                  <option value="">-- Select an Item --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} 
                      {item.genderCategory === 'Women' && item.suitType === 'Stitched'
                        ? ` (${item.remainingQuantity} pcs)`
                        : ` (${item.remainingQuantity}m)`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>
                  {items.find(i => i.id === formData.itemId)?.suitType === 'Stitched'
                    ? 'Quantity Sold (Pieces)'
                    : 'Quantity Sold (Suits)'}
                </label>
                <input required type="number" min="1" value={formData.quantitySold} onChange={e => setFormData({...formData, quantitySold: parseInt(e.target.value) || 0})} />
              </div>
              <div className="input-group">
                <label>Sold Rate (Per Suit)</label>
                <input required type="number" step="0.01" value={formData.soldRate} onChange={e => setFormData({...formData, soldRate: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            {/* Payment Section */}
            {formData.quantitySold > 0 && formData.soldRate > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '12px' }}>💰 Payment Details</h4>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>
                  Total Amount: Rs {(formData.quantitySold * formData.soldRate).toLocaleString()}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    className={`btn ${paymentType === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setPaymentType('full'); setAmountPaid(''); }}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentType === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentType('partial')}
                  >
                    Partial Payment (Loan)
                  </button>
                </div>

                {paymentType === 'partial' && (
                  <div className="input-group">
                    <label>Amount Paid (Rs)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.quantitySold * formData.soldRate}
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder="Enter amount received"
                    />
                    {amountPaid && (
                      <div style={{ marginTop: '8px', color: 'var(--danger)', fontWeight: 600 }}>
                        Loan Amount: Rs {((formData.quantitySold * formData.soldRate) - parseFloat(amountPaid || 0)).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" disabled={items.length === 0}>
                {editingSale ? '💾 Update Sale' : '💾 Record Sale'}
              </button>
              {editingSale && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
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
              <th>Customer</th>
              <th>Item Name</th>
              <th>Gender</th>
              <th>Type</th>
              <th>Qty Sold</th>
              <th>Sold Rate</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id}>
                <td>#{sale.id}</td>
                <td>
                  {sale.customer ? (
                    <span style={{ fontWeight: 500 }}>{sale.customer.name}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>
                  )}
                </td>
                <td style={{fontWeight: 500}}>{sale.item ? sale.item.name : 'Unknown Item'}</td>
                <td>{sale.item ? (sale.item.genderCategory === 'Men' ? 'Men' : 'Women') : '-'}</td>
                <td>
                  {sale.item ? 
                    (sale.item.genderCategory === 'Women' 
                      ? (sale.item.suitType === 'Stitched' ? 'Stitched' : 'Unstitched')
                      : 'Unstitched') 
                    : '-'}
                </td>
                <td>{sale.quantitySold}</td>
                <td>Rs {sale.soldRate.toLocaleString()}</td>
                <td style={{color: 'var(--success)', fontWeight: 600}}>Rs {sale.totalSalesAmount.toLocaleString()}</td>
                <td>
                  {sale.isLoan ? (
                    <span className="badge badge-danger">
                      Loan: Rs {sale.loanAmount?.toLocaleString()}
                    </span>
                  ) : (
                    <span className="badge badge-success">Paid</span>
                  )}
                </td>
                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => handleEdit(sale)}
                      title="Edit Sale"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--danger)', color: 'white' }}
                      onClick={() => handleDelete(sale.id)}
                      title="Delete Sale"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr><td colSpan="11" style={{textAlign: 'center'}}>No sales match your search or date filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
