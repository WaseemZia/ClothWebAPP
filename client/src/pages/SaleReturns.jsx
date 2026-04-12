import React, { useState, useEffect } from 'react';
import api from '../api';
import { RotateCcw, PlusCircle, Package, Receipt, AlertCircle, CheckCircle, ShoppingBag, X } from 'lucide-react';

const SaleReturns = () => {
    const [returns, setReturns] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    
    // Form Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState('');
    const [quantityReturn, setQuantityReturn] = useState(1);
    const [reason, setReason] = useState('');
    
    // Status
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const fetchData = async () => {
        try {
            const returnsRes = await api.get('/SaleReturns');
            // Sort to show newest first if not already
            setReturns(returnsRes.data || []);

            const salesRes = await api.get('/Sales');
            // Get recent sales, sort descending
            const sortedSales = (salesRes.data || []).sort((a,b) => new Date(b.saleDate) - new Date(a.saleDate));
            setRecentSales(sortedSales.slice(0, 100)); // limit to last 100 sales to prevent massive dropdown
        } catch (err) {
            console.error("Failed to load data", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const payload = {
                SaleId: parseInt(selectedSaleId),
                QuantityReturn: parseInt(quantityReturn),
                Reasons: reason
            };
            
            await api.post('/SaleReturns', payload);
            
            setSuccessMsg("Refund processed successfully!");
            setSelectedSaleId('');
            setQuantityReturn(1);
            setReason('');
            fetchData();
            
            setTimeout(() => {
                setIsReturnModalOpen(false);
                setSuccessMsg(null);
            }, 2000);
            
        } catch (err) {
            setError(typeof err.response?.data === 'string' ? err.response.data : "An error occurred while processing the return.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Modern Premium Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                marginBottom: '32px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(31, 41, 55, 0.5) 100%)',
                padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
            }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #fca5a5, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Sale Refunds
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0', fontSize: '1rem' }}>Manage defective returns, exchanges, and customer refunds securely.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="btn btn-primary" style={{ background: 'linear-gradient(90deg, #ef4444, #b91c1c)', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)', border: 'none', padding: '12px 24px', fontSize: '1rem' }} onClick={() => setIsReturnModalOpen(!isReturnModalOpen)}>
                        {isReturnModalOpen ? <><X size={18} /> Cancel Process</> : <><RotateCcw size={18} /> Process New Return</>}
                    </button>
                </div>
            </div>

            {/* Floating Action Panel for New Return */}
            {isReturnModalOpen && (
                <div style={{
                    background: 'var(--surface-color)', borderRadius: '16px', padding: '32px', marginBottom: '32px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'white' }}>
                        <Receipt size={24} color="#fca5a5" /> Execute Void / Refund
                    </h2>
                    
                    {error && <div style={{background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px', display:'flex', alignItems:'center', gap:'8px'}}><AlertCircle size={18}/> {error}</div>}
                    {successMsg && <div style={{background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid #10b981', color: '#6ee7b7', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px', display:'flex', alignItems:'center', gap:'8px'}}><CheckCircle size={18}/> {successMsg}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                            
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px', display: 'block', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600 }}>1. Search Valid Transaction</label>
                                <select 
                                    style={{width:'100%', padding:'12px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.05rem'}}
                                    value={selectedSaleId}
                                    onChange={(e) => setSelectedSaleId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Click to select matched Sale Ticket --</option>
                                    {recentSales.map(sale => (
                                        <option key={sale.id} value={sale.id}>
                                            Sale #{sale.id} | {sale.item?.name || 'Unknown Item'} | Sold: {sale.quantitySold} | Total: Rs.{sale.totalSalesAmount} | {new Date(sale.saleDate).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px', display: 'block', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600 }}>2. Return Configuration</label>
                                <div style={{ display:'flex', gap:'16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Return Qty</label>
                                        <input type="number" min="1" style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.1rem'}} value={quantityReturn} onChange={e => setQuantityReturn(e.target.value)} required />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px', display: 'block' }}>Reason for Voiding</label>
                                        <input type="text" placeholder="Defective cloth, exchanged..." style={{width:'100%', padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'1.1rem'}} value={reason} onChange={e => setReason(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '32px', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(90deg, #ef4444, #dc2626)', border:'none', fontSize:'1.1rem', padding:'12px 32px', fontWeight:600 }} disabled={loading}>
                                {loading ? 'Processing Reversal...' : 'Confirm System Refund'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modern Returns History Data View */}
            <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', padding:'24px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 600, color: 'white', display:'flex', alignItems:'center', gap:'8px' }}>
                    <Receipt size={18} color="#9ca3af" /> Historical Voided Receipts
                </h3>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Event ID</th>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Original Ticket</th>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Returned Product</th>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Restored Qty</th>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Refund Value</th>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none' }}>Explanation</th>
                                <th style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', textAlign:'right' }}>Process Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returns.map(r => (
                                <tr key={r.id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'transform 0.2s, background 0.2s', cursor:'default' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
                                    <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', color: '#ef4444', fontWeight: 600 }}>R-{r.id}</td>
                                    <td style={{ padding: '16px', color: '#9ca3af', fontSize:'0.9rem' }}>#{r.saleId}</td>
                                    <td style={{ padding: '16px', fontWeight: 500, color: '#e5e7eb' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Package size={16} color="#4f46e5" />
                                            {r.item?.name || 'Unknown Item'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#f59e0b', fontWeight: 600 }}>
                                        +{r.quantityReturn} Back to Stock
                                    </td>
                                    <td style={{ padding: '16px', color: '#ef4444', fontWeight: 600, fontSize: '1.05rem' }}>
                                        - Rs {r.refundAmount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px', color: '#9ca3af', fontStyle:'italic' }}>
                                        "{r.reasons}"
                                    </td>
                                    <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', textAlign: 'right', color: '#9ca3af', fontSize:'0.9rem' }}>
                                        {new Date(r.returnDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {returns.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '64px', color: '#9ca3af' }}>
                                        <RotateCcw size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto', color:'#ef4444' }} />
                                        <p style={{ fontSize: '1.1rem' }}>No returns or refunds logged yet.</p>
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

export default SaleReturns;
