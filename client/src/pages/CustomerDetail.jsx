import React, { useState, useEffect } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { generateCustomerReport } from '../utils/generateCustomerReport';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerRes, loansRes] = await Promise.all([
          api.get(`/customers/${id}`),
          api.get(`/loans/customer/${id}`)
        ]);
        setCustomer(customerRes.data);
        setLoans(loansRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div>
      <div className="page-title" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/customers')} style={{ marginRight: '12px' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <span>Customer Details: {customer.name}</span>
        
        <button 
          className="btn btn-success" 
          style={{ marginLeft: 'auto', backgroundColor: 'var(--success)', color: 'white' }} 
          onClick={() => generateCustomerReport(customer, loans)}
        >
          <Download size={18} /> Download Ledger
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>👤 Customer Information</h3>
        <div className="form-grid">
          <div>
            <strong>Name:</strong> {customer.name}
          </div>
          <div>
            <strong>Phone:</strong> {customer.phone}
          </div>
          <div>
            <strong>Address:</strong> {customer.address || 'N/A'}
          </div>
          <div>
            <strong>Customer Since:</strong> {new Date(customer.createdDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>🛒 Purchase History</h3>
        {customer.sales && customer.sales.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {customer.sales.map(sale => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{sale.item?.name || 'Unknown'}</td>
                  <td>{sale.quantitySold}</td>
                  <td>Rs {sale.totalSalesAmount.toLocaleString()}</td>
                  <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td>
                    {sale.isLoan ? (
                      <span className="badge badge-danger">Loan</span>
                    ) : (
                      <span className="badge badge-success">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No purchases yet</p>
        )}
      </div>

      {/* Loan History */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>💰 Loan History</h3>
        {loans.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Date</th>
                <th>Payments</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td>#{loan.id}</td>
                  <td>Rs {loan.totalAmount.toLocaleString()}</td>
                  <td>Rs {loan.amountPaid.toLocaleString()}</td>
                  <td>Rs {loan.remainingBalance.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${loan.status === 'Cleared' ? 'badge-success' : 'badge-danger'}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>{new Date(loan.loanDate).toLocaleDateString()}</td>
                  <td>{loan.payments?.length || 0} payment(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No loans</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
