import React, { useState, useEffect } from 'react';
import { Package, DollarSign, TrendingUp, Receipt, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import DashboardFilter from '../pages/DashboardFilters';

const Dashboard = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // States for the Global Dashboard Filter
  const [dateFilter, setDateFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, salesRes, expensesRes] = await Promise.all([
          api.get('/items'),
          api.get('/sales'),
          api.get('/expenses')
        ]);
        setItems(itemsRes.data);
        setSales(salesRes.data);
        setExpenses(expensesRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchData();
  }, []);

  // One Smart Filter function that works for BOTH Sales and Expenses dynamically
  const getFilteredData = (dataArray, dateFieldName) => {
    const now = new Date();
    return dataArray.filter(item => {
      const itemDate = new Date(item[dateFieldName]); 
      
      if(dateFilter === "Daily"){
        return itemDate.getFullYear() === now.getFullYear() &&
               itemDate.getMonth() === now.getMonth() &&
               itemDate.getDate() === now.getDate();
      }
      if(dateFilter === "Weekly"){
         const oneWeekAgo = new Date();
         oneWeekAgo.setDate(now.getDate() - 7); 
         return itemDate >= oneWeekAgo && itemDate <= now;
      }
      if(dateFilter === "Monthly"){
         return itemDate.getFullYear() === now.getFullYear() &&
                itemDate.getMonth() === now.getMonth();
      }
      if(dateFilter === "Custom"){
         if(!customStart || !customEnd) return true;
         const start = new Date(customStart);
         start.setHours(0, 0, 0, 0); 
         const end = new Date(customEnd);
         end.setHours(23, 59, 59, 999); 
         return itemDate >= start && itemDate <= end;
      }
      return true; // "All"
    });
  };

  // 1. FILTER THE RAW DATA
  const filteredSales = getFilteredData(sales, 'saleDate');
  const filteredExpenses = getFilteredData(expenses, 'date');

  // 2. CALCULATE MATH 
  const totalItems = items.reduce((acc, item) => acc + item.remainingQuantity, 0);
  const totalFilteredSales = filteredSales.reduce((acc, sale) => acc + sale.totalSalesAmount, 0);

  // A: Real Cost of Suits Sold (Quantity * Original Purchase Rate)
  const actualCostOfSoldSuits = filteredSales.reduce((acc, sale) => {
    if(!sale.item) return acc;
    return acc + (sale.quantitySold * sale.item.purchaseRate); 
  }, 0);

  // B: Daily Expenses (Tea, Food, Travel)
  const operationalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  // C: Grand Total Expenses
  const grandTotalExpenses = actualCostOfSoldSuits + operationalExpenses;

  // D: True Net Profit (Revenue minus absolutely ALL expenses)
  const trueNetProfit = totalFilteredSales - grandTotalExpenses;


  return (
    <div>
      <div className="page-title">Dashboard Summary</div>
      
      {/* 3. INJECT THE NEW GLOBAL FILTER AT THE TOP */}
      <DashboardFilter 
        dateFilter={dateFilter} 
        setDateFilter={setDateFilter} 
        customStart={customStart} 
        setCustomStart={setCustomStart} 
        customEnd={customEnd} 
        setCustomEnd={setCustomEnd} 
      />

      <div className="stats-grid">
        
        {/* INVENTORY CARD (Instant Jump) */}
        <div className="stat-card" onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <div className="icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
            <Package size={24} />
          </div>
          <h3>Available Stock (Meters)</h3>
          <div className="value">{totalItems}</div>
        </div>

        {/* REVENUE/SALES CARD */}
        <div className="stat-card">
          <div className="icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <h3>Revenue (Sales)</h3>
          <div className="value" style={{ color: 'var(--success)' }}>Rs {totalFilteredSales.toLocaleString()}</div>
        </div>

        {/* GRAND EXPENSE CARD (Splits the logic) */}
        <div className="stat-card">
          <div className="icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <Receipt size={24} />
          </div>
          <h3>Grand Total Expenses</h3>
          <div className="value" style={{ color: 'var(--danger)' }}>Rs {grandTotalExpenses.toLocaleString()}</div>
          
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Cost of Suits Sold:</span>
              <span style={{ fontWeight: 500 }}>Rs {actualCostOfSoldSuits.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Operations (Tea/Food):</span>
              <span style={{ fontWeight: 500 }}>Rs {operationalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* TRUE NET PROFIT CARD */}
        <div className="stat-card">
          <div className="icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <TrendingUp size={24} />
          </div>
          <h3>True Net Profit</h3>
          <div className="value">Rs {trueNetProfit.toLocaleString()}</div>
        </div>

      </div>
      
    </div>
  );
};

export default Dashboard;
