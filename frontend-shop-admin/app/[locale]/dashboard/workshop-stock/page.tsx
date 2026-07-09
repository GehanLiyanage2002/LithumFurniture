"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Wrench, PlusCircle, Trash2, ArrowRight, History as HistoryIcon, Download, Search } from "lucide-react";
import Swal from 'sweetalert2';

interface WorkshopStock {
  id: string;
  productName: string;
  quantity: number;
}

interface WorkshopStockHistory {
  id: string;
  action: string;
  productName: string;
  quantity: number;
  unitPrice: number | null;
  createdAt: string;
}

interface WorkshopStockSummary {
  totalAdded: number;
  totalTransferred: number;
}

export default function WorkshopStockPage() {
  const router = useRouter();
  const t = useTranslations('WorkshopStock');
  
  const [stocks, setStocks] = useState<WorkshopStock[]>([]);
  const [history, setHistory] = useState<WorkshopStockHistory[]>([]);
  const [summary, setSummary] = useState<WorkshopStockSummary>({ totalAdded: 0, totalTransferred: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  const [searchTerm, setSearchTerm] = useState("");

  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [addLoading, setAddLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTargetStock, setTransferTargetStock] = useState<WorkshopStock | null>(null);
  const [transferQuantity, setTransferQuantity] = useState("1");
  const [transferUnitPrice, setTransferUnitPrice] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStocks = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const [res, histRes, sumRes] = await Promise.all([
        fetch("http://localhost:4000/workshop-stock", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/workshop-stock/history", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/workshop-stock/history/summary", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (!res.ok) throw new Error("Failed to fetch workshop stock");
      
      const data = await res.json();
      const histData = await histRes.json();
      const sumData = await sumRes.json();
      
      setStocks(data);
      setHistory(histData);
      setSummary(sumData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchStocks();
  }, [router]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setMessage("");

    const token = localStorage.getItem("admin_token");
    
    try {
      const res = await fetch("http://localhost:4000/workshop-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productName,
          quantity: parseInt(quantity, 10) || 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to add workshop stock");

      setMessage("Workshop stock added successfully!");
      setProductName("");
      setQuantity("1");
      
      fetchStocks(); // Refresh list
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setAddLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Workshop Stock?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`http://localhost:4000/workshop-stock/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete stock");
      fetchStocks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetStock) return;
    setTransferLoading(true);

    const token = localStorage.getItem("admin_token");
    
    try {
      const res = await fetch(`http://localhost:4000/workshop-stock/${transferTargetStock.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          quantity: parseInt(transferQuantity, 10),
          unitPrice: parseFloat(transferUnitPrice) 
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to transfer product");
      }
      
      setTransferModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Transferred Successfully',
        text: 'Stock has been moved to Shop Stock.',
        timer: 2000,
        showConfirmButton: false
      });
      fetchStocks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ["Date", "Action", "Product Name", "Quantity", "Unit Price"];
    const rows = history.map(item => [
      `"${new Date(item.createdAt).toLocaleString()}"`,
      item.action,
      `"${item.productName}"`,
      item.quantity,
      item.unitPrice || '0'
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `workshop_stock_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProductTypes = stocks.length;
  const totalItemsInStock = stocks.reduce((acc, p) => acc + Number(p.quantity), 0);

  const filteredStocks = useMemo(() => {
    if (!searchTerm) return stocks;
    return stocks.filter(s => s.productName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [stocks, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const currentStocks = filteredStocks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalHistoryPages = Math.ceil(history.length / itemsPerPage);
  const currentHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('title')}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('workshop_unique_products')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{totalProductTypes}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('current_workshop_stock')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{totalItemsInStock}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('total_history_added')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>{summary.totalAdded}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('total_history_transferred')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#F59E0B' }}>{summary.totalTransferred}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Add Product Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', color: 'var(--primary)' }}>
            <PlusCircle size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{t('add_workshop_stock')}</h3>
          </div>
          
          <form onSubmit={handleAddStock}>
            <div className="input-group">
              <label>{t('product_name')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={productName} onChange={e => setProductName(e.target.value)} placeholder={t('product_name_placeholder')} />
            </div>
            <div className="input-group">
              <label>{t('quantity')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>

            {message && <p className={message.includes("success") ? "text-success mb-4" : "text-error mb-4"} style={{ fontSize: '0.9rem', fontWeight: '500' }}>{message}</p>}

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={addLoading}>
              <PlusCircle size={16} /> {addLoading ? t('adding') : t('add_to_workshop')}
            </button>
          </form>
        </div>

        {/* Tabs and Data Area */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => { setActiveTab("current"); setCurrentPage(1); }}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', color: activeTab === "current" ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Wrench size={20} /> {t('tab_current_stock')}
              </button>
              <button 
                onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', color: activeTab === "history" ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <HistoryIcon size={20} /> {t('tab_history_log')}
              </button>
            </div>
            
            {activeTab === "current" && (
              <div style={{ position: 'relative', width: '250px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search workshop stock..." 
                  className="input-field" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px', marginBottom: 0 }}
                />
              </div>
            )}
          </div>

          {loading ? (
            <p>{t('loading_data')}</p>
          ) : error ? (
            <p className="text-error">{error}</p>
          ) : activeTab === "current" ? (
            // CURRENT STOCK VIEW
            filteredStocks.length === 0 ? (
              <p className="text-secondary">{t('no_products_workshop')}</p>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>{t('table_product_name')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('table_quantity')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStocks.map((stock) => (
                    <tr key={stock.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', fontWeight: '600' }}>{stock.productName}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${stock.quantity > 5 ? 'badge-success' : 'badge-primary'}`} style={{ background: stock.quantity <= 5 ? 'rgba(220, 38, 38, 0.1)' : undefined, color: stock.quantity <= 5 ? 'var(--error)' : undefined }}>
                          {stock.quantity} {t('in_workshop')}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => { setTransferTargetStock(stock); setTransferQuantity("1"); setTransferUnitPrice(""); setTransferModalOpen(true); }}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                            title="Transfer to Shop Stock"
                            disabled={stock.quantity < 1}
                          >
                            <ArrowRight size={14} style={{ marginRight: '6px' }} /> {t('transfer_btn')}
                          </button>
                          <button 
                            onClick={() => handleDelete(stock.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '6px 8px' }}
                            title="Delete Stock"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )
          ) : null}

          {/* Pagination Controls for Current Stock */}
          {activeTab === "current" && filteredStocks.length > 0 && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)', background: '#F9FAFB', marginTop: '16px', borderRadius: '0 0 12px 12px' }}>
              <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, filteredStocks.length)} {t('of')} {filteredStocks.length} {t('products')}
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

          {/* HISTORY LOG VIEW */}
          {activeTab === "history" && (
            history.length === 0 ? (
              <p className="text-secondary">{t('no_history')}</p>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={exportToCSV} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                    <Download size={16} /> {t('export_csv')}
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 16px' }}>{t('table_date')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_action')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_product_name')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('table_quantity')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentHistory.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${item.action === 'ADD' ? 'badge-success' : 'badge-primary'}`} style={{ background: item.action === 'TRANSFER' ? 'rgba(245, 158, 11, 0.1)' : undefined, color: item.action === 'TRANSFER' ? '#F59E0B' : undefined }}>
                            {item.action}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{item.productName}</td>
                        <td style={{ padding: '16px' }}>
                          {item.quantity} {item.action === 'TRANSFER' && item.unitPrice && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>(@ LKR {Number(item.unitPrice).toLocaleString()})</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )
          )}

          {/* Pagination Controls for History Log */}
          {activeTab === "history" && history.length > 0 && totalHistoryPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)', background: '#F9FAFB', marginTop: '16px', borderRadius: '0 0 12px 12px' }}>
              <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, history.length)} {t('of')} {history.length} {t('records')}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalHistoryPages))} 
                  disabled={currentPage === totalHistoryPages}
                  className="btn-outline" 
                  style={{ padding: '8px 16px' }}
                >
                  {t('next_btn')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Transfer Modal */}
      {transferModalOpen && transferTargetStock && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTransferModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{t('transfer_modal_title')}</h3>
              <button className="close-btn" onClick={() => setTransferModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>{transferTargetStock.productName}</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span className="text-secondary">{t('available_workshop')}</span>
                  <strong className={transferTargetStock.quantity <= 5 ? 'text-error' : ''}>{transferTargetStock.quantity}</strong>
                </div>
              </div>
              <form onSubmit={handleTransfer}>
                <div className="input-group">
                  <label>{t('quantity_to_transfer')} <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required type="number" min="1" max={transferTargetStock.quantity} className="input-field" value={transferQuantity} onChange={e => setTransferQuantity(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>{t('unit_price_selling')} <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required type="number" min="0" step="0.01" className="input-field" value={transferUnitPrice} onChange={e => setTransferUnitPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                  <button type="button" onClick={() => setTransferModalOpen(false)} className="btn-outline">{t('cancel')}</button>
                  <button type="submit" className="btn-primary" disabled={transferLoading} style={{ background: 'var(--primary)', border: 'none' }}>
                    {transferLoading ? t('transferring') : t('confirm_transfer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
