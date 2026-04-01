import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingCart, Receipt } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/expenses/Expenses';

function App() {
  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <h2>
            <Store size={28} />
            HajiGulCloth
          </h2>
          <nav className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/inventory" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Store size={20} />
              Inventory
            </NavLink>
            <NavLink to="/sales" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <ShoppingCart size={20} />
              Sales
            </NavLink>
            <NavLink to="/expenses" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Receipt size={20} />
              Expenses
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/expenses" element={<Expenses />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
