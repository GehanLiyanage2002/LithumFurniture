"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrendingUp, Calendar, DollarSign, Package, BarChart3, Printer } from "lucide-react";

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
  const t = useTranslations('Analytics');
  
  const [sales, setSales] = useState<CashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination for POS History
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // POS History Filters
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, THIS_MONTH, SPECIFIC
  const [specificDate, setSpecificDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem("admin_token");
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

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (dateFilter === "ALL") return true;
      const saleDate = new Date(sale.createdAt);
      if (dateFilter === "TODAY") {
        return isSameDay(saleDate, new Date());
      }
      if (dateFilter === "THIS_MONTH") {
        return isSameMonth(saleDate, new Date());
      }
      if (dateFilter === "SPECIFIC" && specificDate) {
        // compare YYYY-MM-DD
        const specific = new Date(specificDate);
        // JS Date parsing from YYYY-MM-DD sets time to midnight UTC, we need local day comparison
        return saleDate.getFullYear() === specific.getFullYear() && 
               saleDate.getMonth() === specific.getMonth() && 
               saleDate.getDate() === specific.getDate();
      }
      return true;
    });
  }, [sales, dateFilter, specificDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, specificDate]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const currentSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const printReceipt = (sale: CashSale) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    
    iframe.contentWindow?.document.write(`
      <html>
        <head>
          <title>Receipt - ${sale.id}</title>
          <style>
            @media print { 
              @page { margin: 15mm; size: A4 portrait; }
              body { margin: 0; padding: 0; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0 auto; padding: 40px; font-size: 14px; color: #333; max-width: 800px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 2.2rem; font-weight: 900; color: #059669; margin: 0 0 8px 0; letter-spacing: -0.5px; }
            .company-details { font-size: 0.9rem; color: #555; line-height: 1.5; }
            .receipt-title { text-align: right; }
            .receipt-title h1 { font-size: 2rem; color: #333; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 300; letter-spacing: 2px; }
            .meta-info { font-size: 0.95rem; color: #555; line-height: 1.6; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px 16px; border-bottom: 2px solid #d1d5db; }
            th.right, td.right { text-align: right; }
            th.center, td.center { text-align: center; }
            td { padding: 16px; border-bottom: 1px solid #e5e7eb; color: #111; }
            
            .summary { width: 45%; margin-left: auto; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 1rem; color: #333; }
            .summary-row.discount { color: #dc2626; }
            .summary-row.total { font-size: 1.4rem; font-weight: bold; color: #059669; border-top: 2px solid #059669; padding-top: 12px; margin-top: 4px; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 0.95rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .footer p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 class="company-name">LITHUM FURNITURES</h2>
              <div class="company-details">
                No.76, Badulla Road, Ettampitiya.<br>
                Tel: 077 183 0883<br>
                B.R. No. U/A 569 | V.A.T. No. T.D. 430/B
              </div>
            </div>
            <div class="receipt-title">
              <h1>CASH RECEIPT</h1>
              <div class="meta-info">
                <strong>Receipt #:</strong> ${sale.id.substring(0, 8).toUpperCase()}<br>
                <strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}<br>
                <strong>Time:</strong> ${new Date(sale.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="center">Qty</th>
                <th class="right">Unit Price (LKR)</th>
                <th class="right">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${sale.productName}</strong></td>
                <td class="center">${sale.quantity}</td>
                <td class="right">${Number(sale.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="right">${(Number(sale.unitPrice) * sale.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${(Number(sale.unitPrice) * sale.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            ${sale.discountValue > 0 ? `
            <div class="summary-row discount">
              <span>Discount</span>
              <span>- ${Number(sale.discountValue).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>` : ''}
            <div class="summary-row total">
              <span>TOTAL</span>
              <span>LKR ${Number(sale.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding: 0 40px;">
            <div style="width: 120px; height: 120px; border: 1px dashed #111;"></div>
            <div style="width: 200px; border-top: 1px solid #111; text-align: center; padding-top: 8px; font-weight: 600; color: #111;">Authorized Signature</div>
          </div>

          <div class="footer">
            <p><strong>THANK YOU FOR YOUR BUSINESS!</strong></p>
          </div>
        </body>
      </html>
    `);
    
    iframe.contentWindow?.document.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 250);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('title')}</h1>
      </div>

      {loading ? (
        <p>{t('loading_analytics')}</p>
      ) : (
        <>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-main)' }}>{t('overall_summary')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            
            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(to right, #ffffff, #f3f4f6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>{t('global_earnings')}</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--primary)' }}>LKR {totalOverallEarnings.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{t('pos_credit_collected')}</div>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--error)', background: 'linear-gradient(to right, #ffffff, #fef2f2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Calendar size={20} style={{ color: 'var(--error)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--error)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>{t('customer_payables')}</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--error)' }}>LKR {totalReceivables.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{t('pending_installments')}</div>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--success)', background: 'linear-gradient(to right, #ffffff, #f0fdf4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <DollarSign size={20} style={{ color: 'var(--success)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--success)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>{t('pos_net_profit')}</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--success)' }}>LKR {totalPosProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{t('from_cash_sales')}</div>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Package size={20} style={{ color: 'var(--warning)', marginRight: '8px' }} />
                <h4 style={{ color: 'var(--warning)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>{t('available_stock')}</h4>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)' }}>{totalStockItems}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{t('items_inventory')}</div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: '#F9FAFB' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('cash_sales_revenue')}</h4>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>LKR {totalPosSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <span className="badge badge-success">{t('fully_paid')}</span>
            </div>
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: '#F9FAFB' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('credit_sales_revenue')}</h4>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>LKR {totalCreditEarnings.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              <span className="badge badge-primary">{t('downpayments_installments')}</span>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--primary)' }}>{t('pos_transaction_history')}</h3>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select 
                  className="input-field" 
                  value={dateFilter} 
                  onChange={e => setDateFilter(e.target.value)}
                  style={{ padding: '8px 16px', marginBottom: 0, width: '180px' }}
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="SPECIFIC">Specific Date</option>
                </select>

                {dateFilter === "SPECIFIC" && (
                  <input 
                    type="date" 
                    className="input-field" 
                    value={specificDate}
                    onChange={e => setSpecificDate(e.target.value)}
                    style={{ padding: '8px 16px', marginBottom: 0 }}
                  />
                )}
              </div>
            </div>
            
            {/* Filtered Totals Summary */}
            {(() => {
              let fSales = 0;
              let fProfit = 0;
              filteredSales.forEach(s => {
                fSales += Number(s.totalPrice);
                fProfit += (Number(s.totalPrice) - Number(s.totalCost || 0));
              });
              return (
                <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', padding: '16px 24px', background: 'linear-gradient(to right, #F0FDF4, #ffffff)', border: '1px solid #BBF7D0', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Period Revenue</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803D' }}>LKR {fSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #BBF7D0', paddingLeft: '32px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Period Profit</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803D' }}>LKR {fProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #BBF7D0', paddingLeft: '32px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Transactions</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803D' }}>{filteredSales.length}</div>
                  </div>
                </div>
              );
            })()}

            {filteredSales.length === 0 ? (
              <p className="text-secondary">{t('no_cash_sales')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 16px' }}>{t('table_date')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_product')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_qty')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_unit_price')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_discount')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_total_paid')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('table_profit')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}></th>
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
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button className="btn-outline" onClick={() => printReceipt(sale)} style={{ padding: '6px 10px', fontSize: '0.85rem' }}>
                              <Printer size={16} />
                            </button>
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
                  {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, filteredSales.length)} {t('of')} {filteredSales.length} {t('transactions')}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="btn-outline" 
                    style={{ padding: '8px 16px' }}
                  >
                    {t('previous')}
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="btn-outline" 
                    style={{ padding: '8px 16px' }}
                  >
                    {t('next_btn')}
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
