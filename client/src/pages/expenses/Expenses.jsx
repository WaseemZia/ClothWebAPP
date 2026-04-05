import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus } from 'lucide-react';
import ExpensesFilter from './ExpensesFilters';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All'); // Keeps track of the dropdown  
  const [formData, setFormData] = useState({
    personName: '', expenseType: 'Food', amount: 0
  });
   // New States for the Custom Date Range!
   const [customStartDate,setCustomStartDate]=useState('');
    const [customEndDate,setCustomEndDate]=useState('');


  const fetchData = async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
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
    try {
      await api.post('/expenses', formData);
      setShowForm(false);
      setFormData({ personName: '', expenseType: 'Food', amount: 0 });
      fetchData();
    } catch (err) { console.error(err); }
  };
 const getFilteredExpenses =()=>{
  const now = new Date();
  return expenses.filter(exp=>{
    const expDate=new Date(exp.date);
    if(filter==="Daily"){
      return expDate.getFullYear()===now.getFullYear() &&
             expDate.getMonth()===now.getMonth() &&
             expDate.getDate()===now.getDate();
    }
   if(filter ==="Weekly"){
    const oneWeekAgo=new Date();
    oneWeekAgo.setDate(now.getDate()-7);
    return expDate >=oneWeekAgo && expDate<=now
   }
   if(filter==="Monthly"){
    return expDate.getFullYear()===now.getFullYear() &&
    expDate.getMonth()===now.getMonth();
   }
   if(filter==="Custom")
   {
    // Check if they actually picked both start and end dates.If not, just don’t filter anything yet → show all data.
    if(!customStartDate || !customEndDate) return true;
    const start= new Date(customStartDate);
    start.setHours(0,0,0,0);// Start at the beginning of the day
    const end = new Date(customEndDate);
    end.setHours(23,59,59,999)// Go until the very end of the day
    return expDate >= start && expDate <= end;
   }
   return true; // Used when "All" is selected
  })
 }
 const filterExpense=getFilteredExpenses();
 const totalAmount=filterExpense.reduce((sum,exp)=>sum+exp.amount,0);
  return (
    <div>
      <div className="page-title">
        Daily Expenses
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>Person Name</label>
                <input required type="text" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Expense Type</label>
                <select value={formData.expenseType} onChange={e => setFormData({...formData, expenseType: e.target.value})}>
                  <option>Food</option>
                  <option>Tea / Refreshments</option>
                  <option>Travel</option>
                  <option>Extra / Other</option>
                </select>
              </div>
              <div className="input-group">
                <label>Amount (Rs)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Log Expense</button>
          </form>
        </div>
      )}
 {/* Our New Filter Component UI! */}
      <ExpensesFilter
        filter={filter} 
        setFilter={setFilter} 
        totalAmount={totalAmount} 
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
      />
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Person Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filterExpense.map(exp => (
              <tr key={exp.id}>
                <td>#{exp.id}</td>
                <td style={{fontWeight: 500}}>{exp.personName}</td>
                <td><span className="badge badge-warning">{exp.expenseType}</span></td>
                <td style={{color: 'var(--danger)', fontWeight: 600}}>Rs {exp.amount.toLocaleString()}</td>
                <td>{new Date(exp.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {filterExpense.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>No expenses logged.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
