import React, { useState, useEffect } from 'react';
import { Package, DollarSign, TrendingUp, Receipt } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalSales: 0,
    totalExpenses: 0,
    profit: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, salesRes, expensesRes] = await Promise.all([
          api.get('/items'),
          api.get('/sales'),
          api.get('/expenses')
        ]);

        const items = itemsRes.data;
        const sales = salesRes.data;
        const expenses = expensesRes.data;

        const totalItems = items.reduce((acc, item) => acc + item.remainingQuantity, 0);
        const totalSales = sales.reduce((acc, sale) => acc + sale.totalSalesAmount, 0);
        const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        
        const profit = sales.reduce((acc, sale) => {
          if(!sale.item) return acc;
          return acc + (sale.quantitySold * (sale.soldRate - sale.item.purchaseRate));
        }, 0);

        setStats({ totalItems, totalSales, totalExpenses, profit });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-title">Dashboard Summary</div>
      <div className="stats-grid">
        <div className="stat-card">
          {/* <div className="icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
            <Package size={24} />
          </div> */}
          {/* <h3>Available Stock</h3>
          <div className="value">{stats.totalItems}</div> */}
        </div>
        <div className="stat-card">
          <div className="icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <h3>Total Sales</h3>
          <div className="value">Rs {stats.totalSales.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <Receipt size={24} />
          </div>
          <h3>Total Expenses</h3>
          <div className="value">Rs {stats.totalExpenses.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <TrendingUp size={24} />
          </div>
          <h3>Net Profit</h3>
          <div className="value">Rs {stats.profit.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="card">
        <h3>Welcome to the HajiGulCloth Management System</h3>
        <p style={{marginTop: '16px', color: 'var(--text-muted)'}}>
          Use the sidebar to navigate through Inventory, Sales, and Expenses. This dashboard provides a real-time overview of your business performance.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
