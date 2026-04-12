import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingCart, Receipt, LogOut, Users, DollarSign, RotateCcw } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/expenses/Expenses';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Loans from './pages/Loans';
import SaleReturns from './pages/SaleReturns';
import Login from './login/Login';
import Register from './login/Register';
import ProtectedRoute from './components/ProtectedRoute';
import SignalRNotifier from './components/SignalRNotifier';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, role, logout } = useContext(AuthContext);

  // If we are on the login or register page, hide the sidebar layout completely
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>
          <Store size={28} />
          HajiGulCloth
        </h2>
        {isAuthenticated && (
          <nav className="nav-links">
            {role === 'Admin' && (
              <>
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                  <LayoutDashboard size={20} />
                  Dashboard
                </NavLink>
                <NavLink to="/inventory" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                  <Store size={20} />
                  Inventory
                </NavLink>
              </>
            )}
            <NavLink to="/sales" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <ShoppingCart size={20} />
              Sales
            </NavLink>
            {role === 'Admin' && (
              <NavLink to="/expenses" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <Receipt size={20} />
                Expenses
              </NavLink>
            )}
            {role === 'Admin' && (
              <NavLink to="/customers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <Users size={20} />
                Customers
              </NavLink>
            )}
            {role === 'Admin' && (
              <NavLink to="/loans" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <DollarSign size={20} />
                Loans
              </NavLink>
            )}
            <NavLink to="/SaleReturns" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
             <RotateCcw size={20} />
              Returns
            </NavLink>

            <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', marginTop: 'auto', color: '#ef4444' }}>
              <LogOut size={20} style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '16px', fontWeight: '500' }}>Logout</span>
            </button>
          </nav>
        )}
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRoles={['Admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Admin']}><Inventory /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute allowedRoles={['Admin']}><Expenses /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute allowedRoles={['Admin', 'Cashier']}><Sales /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['Admin']}><Customers /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute allowedRoles={['Admin']}><CustomerDetail /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute allowedRoles={['Admin']}><Loans /></ProtectedRoute>} />
          <Route path="/SaleReturns" element={<ProtectedRoute allowedRoles={['Admin', 'Cashier']}><SaleReturns /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <SignalRNotifier />
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
