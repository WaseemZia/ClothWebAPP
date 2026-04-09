import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, { ...formData, id: editingCustomer.id });
        setEditingCustomer(null);
      } else {
        await api.post('/customers', formData);
      }
      setShowForm(false);
      setFormData({ name: '', phone: '', address: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Cannot delete customer with active loans or sales');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setShowForm(false);
    setFormData({ name: '', phone: '', address: '' });
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchData();
      return;
    }
    try {
      const res = await api.get(`/customers/search?phone=${searchTerm}&name=${searchTerm}`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-title">
        Customer Management
        <button className="btn btn-primary" onClick={() => {
          setEditingCustomer(null);
          setShowForm(!showForm);
        }}>
          <Plus size={18} /> {showForm && !editingCustomer ? 'Cancel' : 'Add New Customer'}
        </button>
      </div>

      {showForm && !editingCustomer && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>➕ Add New Customer</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Customer Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="input-group">
                <label>Phone Number *</label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0300-1234567"
                />
              </div>
              <div className="input-group">
                <label>Address (Optional)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">💾 Save Customer</button>
          </form>
        </div>
      )}

      {showForm && editingCustomer && (
        <div className="card" style={{ marginBottom: '24px', border: '2px solid var(--warning)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--warning)' }}>✏️ Edit Customer</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Customer Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Phone Number *</label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Address (Optional)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">💾 Update Customer</button>
              <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Search by name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>
            <Search size={18} /> Search
          </button>
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); fetchData(); }}>
            Clear
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Total Purchases</th>
              <th>Loan Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>#{customer.id}</td>
                <td style={{ fontWeight: 500 }}>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.address || '-'}</td>
                <td>Rs {customer.totalPurchases?.toLocaleString() || 0}</td>
                <td>
                  <span className={`badge ${customer.totalLoanBalance > 0 ? 'badge-danger' : 'badge-success'}`}>
                    Rs {customer.totalLoanBalance?.toLocaleString() || 0}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => handleEdit(customer)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--danger)', color: 'white' }}
                      onClick={() => handleDelete(customer.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No customers found. Add one above!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
