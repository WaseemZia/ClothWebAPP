import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, Download, FileText, UserPlus, User, ShoppingBag, CreditCard, RotateCcw, X, Filter } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';
import { generateSalesReport } from '../utils/generateSalesReport';

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

  const [searchName, setSearchName] = useState('');

  const fetchData = async (gender = '') => {
    try {
      const itemsUrl = gender ? `/items/by-gender/${gender}` : '/items';
      const [salesRes, itemsRes, customersRes] = await Promise.all([
        api.get('/sales'),
        api.get(itemsUrl),
        api.get('/customers')
      ]);
      setSales(salesRes.data || []);
      setItems((itemsRes.data || []).filter(i => i.remainingQuantity > 0));
      setCustomers(customersRes.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData(selectedGender);
  }, [selectedGender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      let customerId = selectedCustomerId ? parseInt(selectedCustomerId) : null;

      if (showCustomerForm && newCustomerData.name && newCustomerData.phone) {
        const customerRes = await api.post('/customers', newCustomerData);
        customerId = customerRes.data.id;
      }

      const totalAmount = formData.quantitySold * formData.soldRate;
      let amountPaidValue = totalAmount;
      
      if (paymentType === 'partial' && amountPaid) {
        amountPaidValue = parseFloat(amountPaid) || 0;
      }

      const saleData = {
        ...formData,
        customerId: customerId,
        amountPaid: amountPaidValue
      };

      if (editingSale) {
        await api.put(`/sales/${editingSale.id}`, saleData);
      } else {
        await api.post('/sales', saleData);
      }
      
      setEditingSale(null);
      setShowForm(false);
      setShowCustomerForm(false);
      setPaymentType('full');
      setAmountPaid('');
      setSelectedCustomerId('');
      setNewCustomerData({ name: '', phone: '', address: '' });
      setFormData({ itemId: '', quantitySold: 1, soldRate: 0 });
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
    // Set Customer/Payment state to match if editing (simplified for now to just show form)
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale? This action cannot be undone!')) {
      try {
        await api.delete(`/sales/${id}`);
        fetchData(selectedGender);
      } catch (err) { 
        alert('Failed to delete sale.');
      }
    }
  };

  const getFilteredSales = () => {
    return sales.filter(sale => {
      const itemName = sale.item ? sale.item.name.toLowerCase() : '';
      if (searchName && !itemName.includes(searchName.toLowerCase())) return false;
      return true;
    });
  };

  const filteredSales = getFilteredSales();
  const filteredTotalAmount = filteredSales.reduce((acc, curr) => acc + curr.totalSalesAmount, 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Modern Premium Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(31, 41, 55, 0.5) 100%)',
        padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Point of Sale
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0', fontSize: '1rem' }}>Manage your daily transactions and customers seamlessly.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClick={() => generateSalesReport(filteredSales, filteredTotalAmount)}>
            <FileText size={18} /> Export Report
          </button>
          <button className="btn btn-primary" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)' }} onClick={() => {
            setEditingSale(null);
            setShowForm(!showForm);
          }}>
            {showForm ? <><X size={18} /> Close Panel</> : <><Plus size={18} /> New Checkout</>}
          </button>
        </div>
      </div>

      {/* Floating Action Panel for New/Edit Sale */}
      {showForm && (
        <div style={{
          background: 'var(--surface-color)', borderRadius: '16px', padding: '32px', marginBottom: '32px',
          border: editingSale ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: editingSale ? '#f59e0b' : 'white' }}>
            {editingSale ? <Edit size={24} /> : <ShoppingBag size={24} color="#818cf8" />} 
            {editingSale ? 'Modifier Menu - Edit Sale' : 'Transaction Menu - New Checkout'}
          </h2>
          
          {errorMsg && <div style={{background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px'}}>{errorMsg}</div>}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Box 1: Customer Profile */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '20px', color: '#9ca3af' }}>
                  <User size={18} /> Customer Details
                </h3>
                
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px', marginBottom: '16px' }}>
                  <button type="button" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: !showCustomerForm ? '#4f46e5' : 'transparent', color: !showCustomerForm ? 'white' : '#9ca3af', transition: 'all 0.2s' }} onClick={() => setShowCustomerForm(false)}>
                    Existing / Walk-in
                  </button>
                  <button type="button" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: showCustomerForm ? '#4f46e5' : 'transparent', color: showCustomerForm ? 'white' : '#9ca3af', transition: 'all 0.2s' }} onClick={() => setShowCustomerForm(true)}>
                    <UserPlus size={14} style={{display:'inline', marginRight:'4px'}}/> New Customer
                  </button>
                </div>

                {showCustomerForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Full Name *</label>
                      <input type="text" style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} placeholder="John Doe" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} required/>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Phone Number *</label>
                      <input type="text" style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} placeholder="0300-1234567" value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} required/>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Address</label>
                      <input type="text" style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} placeholder="City, Area" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})}/>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Search & Select</label>
                    <select style={{width:'100%', padding:'12px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                      <option value="">-- Walk-in Customer --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Box 2: Product Entry */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '20px', color: '#9ca3af' }}>
                  <Package size={18} /> Cart Items
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                     <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Quick Filter</label>
                     <select style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white'}} value={selectedGender} onChange={e => setSelectedGender(e.target.value)}>
                       <option value="">All Genders</option>
                       <option value="Men">Men</option>
                       <option value="Women">Women</option>
                     </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Select Product *</label>
                    <select style={{width:'100%', padding:'12px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.05rem'}} required value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value ? parseInt(e.target.value) : ''})}>
                      <option value="">-- Choose Item from Inventory --</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.genderCategory === 'Women' && item.suitType === 'Stitched' ? `(${item.remainingQuantity} pcs)` : `(${item.remainingQuantity}m available)`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Quantity (Suits/Pcs) *</label>
                      <input type="number" min="1" style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.1rem'}} value={formData.quantitySold} onChange={e => setFormData({...formData, quantitySold: parseInt(e.target.value) || 0})} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Rate per Unit *</label>
                      <div style={{position:'relative'}}>
                        <span style={{position:'absolute', left:'12px', top:'10px', color:'#9ca3af'}}>Rs.</span>
                        <input type="number" step="0.01" style={{width:'100%', padding:'10px 10px 10px 35px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.1rem'}} value={formData.soldRate} onChange={e => setFormData({...formData, soldRate: parseFloat(e.target.value) || 0})} required />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Payment Gateway Simulation */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '20px', color: '#9ca3af' }}>
                  <CreditCard size={18} /> Checkout
                </h3>

                <div style={{ background:'rgba(16, 185, 129, 0.1)', border:'1px solid rgba(16, 185, 129, 0.2)', padding:'24px', borderRadius:'12px', textAlign:'center', marginBottom:'20px' }}>
                  <p style={{fontSize:'0.9rem', color:'#10b981', margin:0, textTransform:'uppercase', letterSpacing:'1px', fontWeight:600}}>Total Payable</p>
                  <h2 style={{fontSize:'2.5rem', margin:'8px 0 0 0', color:'white', fontWeight:700}}>Rs {(formData.quantitySold * formData.soldRate).toLocaleString()}</h2>
                </div>

                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px', marginBottom: '16px' }}>
                  <button type="button" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: paymentType === 'full' ? '#10b981' : 'transparent', color: paymentType === 'full' ? 'white' : '#9ca3af', fontWeight:paymentType==='full'?600:400, transition: 'all 0.2s' }} onClick={() => { setPaymentType('full'); setAmountPaid(''); }}>
                    Cash Paid
                  </button>
                  <button type="button" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: paymentType === 'partial' ? '#f59e0b' : 'transparent', color: paymentType === 'partial' ? 'white' : '#9ca3af', fontWeight:paymentType==='partial'?600:400, transition: 'all 0.2s' }} onClick={() => setPaymentType('partial')}>
                    Khata / Loan
                  </button>
                </div>

                {paymentType === 'partial' && (
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Amount Received Now</label>
                    <div style={{position:'relative', marginBottom:'12px'}}>
                      <span style={{position:'absolute', left:'12px', top:'10px', color:'#9ca3af'}}>Rs.</span>
                      <input type="number" step="0.01" min="0" max={formData.quantitySold * formData.soldRate} style={{width:'100%', padding:'10px 10px 10px 35px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.1rem'}} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required placeholder="0.00" />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', color:'#fca5a5', padding:'12px', background:'rgba(239, 68, 68, 0.1)', borderRadius:'8px', fontSize:'0.9rem' }}>
                      <span>Remaining Balance:</span>
                      <span style={{fontWeight:'bold'}}>Rs {((formData.quantitySold * formData.soldRate) - parseFloat(amountPaid || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '32px', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button type="button" className="btn" style={{ background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => {setShowForm(false); setEditingSale(null);}}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(90deg, #10b981, #059669)', border:'none', fontSize:'1.1rem', padding:'12px 32px', fontWeight:600 }} disabled={items.length === 0}>
                {editingSale ? 'Save Changes' : 'Confirm & Process Sale'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modern Search & Data View */}
      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding:'24px' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'16px', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
          <div style={{ position:'relative', minWidth:'300px', flex:1 }}>
            <Search size={20} color="#9ca3af" style={{position:'absolute', left:'16px', top:'14px'}}/>
            <input 
              type="text" 
              placeholder="Search receipts by product name..." 
              value={searchName} 
              onChange={e => setSearchName(e.target.value)}
              style={{ width:'100%', padding:'14px 20px 14px 48px', borderRadius:'30px', background:'rgba(0,0,0,0.2)', border:'1px solid var(--border-color)', color:'white', fontSize:'1rem' }}
            />
          </div>
          <div style={{ padding:'12px 24px', background:'rgba(16, 185, 129, 0.1)', borderRadius:'30px', border:'1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ color:'#9ca3af', fontSize:'0.9rem', marginRight:'8px' }}>Filtered Total:</span>
            <span style={{ color:'#10b981', fontSize:'1.2rem', fontWeight:'bold' }}>Rs {filteredTotalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Ticket</th>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Customer</th>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Product</th>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Details</th>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Amount</th>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'transform 0.2s, background 0.2s', cursor:'default' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
                  <td style={{ padding: '16px', borderRadius: '12px 0 0 12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>#{sale.id}</div>
                    <div style={{ fontSize: '0.8rem' }}>{new Date(sale.saleDate).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {sale.customer ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {sale.customer.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{sale.customer.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', display:'flex', alignItems:'center', gap:'6px' }}><User size={14}/> Walk-in</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500, color: '#e5e7eb' }}>
                    {sale.item ? sale.item.name : 'Unknown Item'}
                  </td>
                  <td style={{ padding: '16px' }}>
                     <div style={{fontSize:'0.85rem', color:'#9ca3af'}}>Qty: <span style={{color:'white'}}>{sale.quantitySold}</span></div>
                     <div style={{fontSize:'0.85rem', color:'#9ca3af'}}>Rate: <span style={{color:'white'}}>Rs {sale.soldRate.toLocaleString()}</span></div>
                  </td>
                  <td style={{ padding: '16px', color: '#10b981', fontWeight: 600, fontSize: '1.1rem' }}>
                    Rs {sale.totalSalesAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {sale.isLoan ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#f59e0b'}}></div>
                        Khata: Rs {sale.loanAmount?.toLocaleString()}
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#10b981'}}></div>
                        Paid
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                      <button className="btn" style={{ padding: '8px', background: 'transparent', color: '#818cf8', border: 'none' }} onClick={() => generateInvoice(sale)} title="Download Receipt">
                        <Download size={18} />
                      </button>
                      <button className="btn" style={{ padding: '8px', background: 'transparent', color: '#9ca3af', border: 'none' }} onClick={() => handleEdit(sale)} title="Edit Configuration">
                        <Edit size={18} />
                      </button>
                      <button className="btn" style={{ padding: '8px', background: 'transparent', color: '#ef4444', border: 'none' }} onClick={() => handleDelete(sale.id)} title="Void Transaction">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '64px', color: '#9ca3af' }}>
                    <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto' }} />
                    <p style={{ fontSize: '1.1rem' }}>No sales records found.</p>
                    <p style={{ fontSize: '0.9rem', marginTop:'8px' }}>Try searching for a different product or record a new checkout.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Sales;
