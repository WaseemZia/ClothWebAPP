import React, { useState, useEffect } from 'react';
import api from '../api';
import { DollarSign, History, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateLoanHistoryReport } from '../utils/generateLoanHistoryReport';

const Loans = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [filter, setFilter] = useState('Active');
  
  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoan, setHistoryLoan] = useState(null);

  const fetchData = async () => {
    try {
      const [loansRes, summaryRes] = await Promise.all([
        api.get(`/loans?status=${filter}`),
        api.get('/loans/summary')
      ]);
      setLoans(loansRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchData();
  }, [filter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/loans/${selectedLoan.id}/payment`, {
        amount: parseFloat(paymentAmount),
        notes: paymentNotes
      });
      setShowPaymentForm(false);
      setSelectedLoan(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchData();
      alert('Payment recorded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data || 'Failed to record payment');
    }
  };

  const openPaymentForm = (loan) => {
    setSelectedLoan(loan);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentForm(true);
  };

  const openHistoryModal = (loan) => {
    setHistoryLoan(loan);
    setShowHistoryModal(true);
  };

  return (
    <div>
      <div className="page-title">
        Loan Management (Udhaar)
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <h3>Active Loans</h3>
            <div className="value">{summary.activeLoansCount}</div>
          </div>
          <div className="stat-card">
            <h3>Total Outstanding</h3>
            <div className="value" style={{ color: 'var(--danger)' }}>
              Rs {summary.totalActiveAmount?.toLocaleString() || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>Total Cleared</h3>
            <div className="value" style={{ color: 'var(--success)' }}>
              Rs {summary.totalClearedAmount?.toLocaleString() || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>Overdue</h3>
            <div className="value" style={{ color: 'var(--warning)' }}>{summary.overdueCount || 0}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {['Active', 'Cleared', 'All'].map(status => (
          <button
            key={status}
            className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(status)}
          >
            {status} Loans
          </button>
        ))}
      </div>

      {/* Payment Form */}
      {showPaymentForm && selectedLoan && (
        <div className="card" style={{ marginBottom: '24px', border: '2px solid var(--success)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--success)' }}>
            💰 Record Payment for {selectedLoan.customer?.name}
          </h3>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '6px' }}>
            <p><strong>Loan Amount:</strong> Rs {selectedLoan.totalAmount.toLocaleString()}</p>
            <p><strong>Already Paid:</strong> Rs {selectedLoan.amountPaid.toLocaleString()}</p>
            <p><strong>Remaining:</strong> <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Rs {selectedLoan.remainingBalance.toLocaleString()}</span></p>
          </div>
          <form onSubmit={handleRecordPayment}>
            <div className="form-grid">
              <div className="input-group">
                <label>Payment Amount *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedLoan.remainingBalance}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${selectedLoan.remainingBalance}`}
                />
              </div>
              <div className="input-group">
                <label>Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Cash payment"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-success">
                <DollarSign size={18} /> Record Payment
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowPaymentForm(false); setSelectedLoan(null); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && historyLoan && (
        <div className="card" style={{ marginBottom: '24px', border: '2px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>
              📜 Payment History for {historyLoan.customer?.name}
            </h3>
            <button 
              className="btn btn-success" 
              style={{ backgroundColor: 'var(--success)', color: 'white', padding: '6px 12px', fontSize: '0.85rem' }} 
              onClick={() => generateLoanHistoryReport(historyLoan)}
            >
              <Download size={16} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Download Statement
            </button>
          </div>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '6px' }}>
            <p><strong>Total Loan:</strong> Rs {historyLoan.totalAmount.toLocaleString()}</p>
            <p><strong>Remaining Balance:</strong> <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Rs {historyLoan.remainingBalance.toLocaleString()}</span></p>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {historyLoan.payments && historyLoan.payments.length > 0 ? (
                  historyLoan.payments.map((payment, index) => (
                    <tr key={payment.id || index}>
                      <td>{new Date(payment.paymentDate).toLocaleString()}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>Rs {payment.amount.toLocaleString()}</td>
                      <td>{payment.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center' }}>No historical payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button className="btn btn-secondary" onClick={() => { setShowHistoryModal(false); setHistoryLoan(null); }}>
              Close History
            </button>
          </div>
        </div>
      )}

      {/* Loans Table */}
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.id}>
                <td>#{loan.id}</td>
                <td style={{ fontWeight: 500 }}>
                  <span
                    style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
                    onClick={() => navigate(`/customers/${loan.customerId}`)}
                  >
                    {loan.customer?.name || 'Unknown'}
                  </span>
                </td>
                <td>{loan.customer?.phone || '-'}</td>
                <td>Rs {loan.totalAmount.toLocaleString()}</td>
                <td style={{ color: 'var(--success)' }}>Rs {loan.amountPaid.toLocaleString()}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  Rs {loan.remainingBalance.toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${loan.status === 'Cleared' ? 'badge-success' : 'badge-danger'}`}>
                    {loan.status}
                  </span>
                </td>
                <td>{new Date(loan.loanDate).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {loan.status === 'Active' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => openPaymentForm(loan)}
                      >
                        <DollarSign size={16} /> Pay
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => openHistoryModal(loan)}
                      title="View Payment History"
                    >
                      <History size={16} /> History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign: 'center' }}>No {filter.toLowerCase()} loans found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Loans;
