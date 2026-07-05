"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Calendar, DollarSign, Package, BarChart3 } from "lucide-react";

interface CashSale {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountType: string;
  discountValue: number;
  totalPrice: number;
  totalCost: number;
  createdAt: string;
}

interface Product {
  id: string;
  productName: string;
  quantity: number;
}

interface Credit {
  id: string;
  downPayment: number;
  totalPayment: number;
  paidAmount: number;
  status: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  
  const [sales, setSales] = useState<CashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination for POS History
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }
      try {
        const [salesRes, productsRes, creditsRes] = await Promise.all([
          fetch("http://localhost:4000/cash-sales", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("http://localhost:4000/products", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("http://localhost:4000/credits", { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        
        if (salesRes.ok) setSales(await salesRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());
        if (creditsRes.ok) setCredits(await creditsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Calculate Metrics
  const now = new Date();
  
  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  const isSameYear = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear();

  let totalPosSales = 0;
  let totalPosProfit = 0; 
  let dailySales = 0;

  sales.forEach(sale => {
    const saleDate = new Date(sale.createdAt);
    const saleTotal = Number(sale.totalPrice);
    
    if (isSameDay(saleDate, now)) dailySales += saleTotal;
    
    totalPosSales += saleTotal;
    const saleCost = Number(sale.totalCost || 0);
    totalPosProfit += (saleTotal - saleCost);
  });

  let totalCreditEarnings = 0;
  let totalReceivables = 0;

  credits.forEach(credit => {
    const down = Number(credit.downPayment || 0);
    const paid = Number(credit.paidAmount || 0);
    const totalLoan = Number(credit.totalPayment || 0);
    
    totalCreditEarnings += (down + paid);
    
    if (credit.status !== 'COMPLETED') {
      const due = totalLoan - paid;
      if (due > 0) totalReceivables += due;
    }
  });

  const totalOverallEarnings = totalPosSales + totalCreditEarnings;
  const totalStockItems = products.reduce((acc, p) => acc + Number(p.quantity), 0);

  // Pagination logic
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const currentSales = sales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Financial Dashboard & Analytics</h1>
      </div>

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-main)' }}>Overall Financial Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            
            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(to right, #ffffff, #f3f4f6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>Total Global Earnings</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--primary)' }}>LKR {totalOverallEarnings.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>POS + Credit Collected</div>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--error)', background: 'linear-gradient(to right, #ffffff, #fef2f2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Calendar size={20} style={{ color: 'var(--error)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--error)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>Customer Payables</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--error)' }}>LKR {totalReceivables.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Pending Credit Installments</div>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--success)', background: 'linear-gradient(to right, #ffffff, #f0fdf4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <DollarSign size={20} style={{ color: 'var(--success)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--success)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>POS Net Profit</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--success)' }}>LKR {totalPosProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>From Cash Sales Only</div>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Package size={20} style={{ color: 'var(--warning)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--warning)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>Available Stock</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)' }}>{totalStockItems}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Total Items in Inventory</div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: '#F9FAFB' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Cash Sales (POS) Revenue</h4>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>LKR {totalPosSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <span className="badge badge-success">Fully Paid</span>
            </div>
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: '#F9FAFB' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Credit Sales Revenue (Collected)</h4>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>LKR {totalCreditEarnings.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <span className="badge badge-primary">Downpayments + Installments</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--primary)' }}>POS Transaction History</h3>
            
            {sales.length === 0 ? (
              <p className="text-secondary">No cash sales recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Product</th>
                      <th style={{ padding: '12px 16px' }}>Qty</th>
                      <th style={{ padding: '12px 16px' }}>Unit Price</th>
                      <th style={{ padding: '12px 16px' }}>Discount</th>
                      <th style={{ padding: '12px 16px' }}>Total Paid</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSales.map((sale) => {
                      const profit = Number(sale.totalPrice) - Number(sale.totalCost || 0);
                      return (
                        <tr key={sale.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                          <td style={{ padding: '16px' }}>{new Date(sale.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '16px', fontWeight: '600', color: 'var(--primary)' }}>{sale.productName}</td>
                          <td style={{ padding: '16px' }}>{sale.quantity}</td>
                          <td style={{ padding: '16px' }}>{Number(sale.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                          <td style={{ padding: '16px' }}>
                            {sale.discountValue > 0 ? (
                              <span style={{ color: 'var(--error)' }}>-{Number(sale.discountValue).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '16px', fontWeight: 'bold' }}>
                            {Number(sale.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                            {profit >= 0 ? '+' : ''}{profit.toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)', background: '#F9FAFB', marginTop: '16px', borderRadius: '0 0 12px 12px' }}>
                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sales.length)} of {sales.length} transactions
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="btn-outline" 
                    style={{ padding: '8px 16px' }}
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="btn-outline" 
                    style={{ padding: '8px 16px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
