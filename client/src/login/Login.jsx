import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext";
import { Store } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const Login =()=>
{
    const[userName,setUserName]=useState("");
    const[password,setPassword]=useState("");
    const[error,setError]=useState(null);
    const {login}=useContext(AuthContext);
    const navigate=useNavigate();
    const handleLogin =async(e)=>{
        e.preventDefault();
        try {
            const response = await api.post('/auth/login',{userName,password});
             // Save info in context & localStorage
            login(response.data.token,response.data.role);
               // Brief delay to ensure React state caught up, then redirect
      setTimeout(() => {
         navigate(response.data.role === 'Admin' ? '/' : '/sales');
      }, 100);

        } catch (err) {
            console.error(err);
            setError('Invalid username or password');
        }
    };
      return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', width: '100vw' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Store size={48} color="#2563eb" />
          <h2 style={{ marginTop: '1rem', color: '#1f2937' }}>HajiGulCloth POS</h2>
          <p style={{ color: '#6b7280' }}>Sign in to continue</p>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color:"black" }}>Username</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color:"black" }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ marginTop: '1rem', background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            Sign In
          </button>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem' }}>Don't have an account? Sign Up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
