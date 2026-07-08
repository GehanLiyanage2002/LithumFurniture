"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Package, PlusCircle, Trash2 } from "lucide-react";
import Swal from 'sweetalert2';

interface Product {
  id: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  category: string;
}

export default function ManageStockPage() {
  const router = useRouter();
  const t = useTranslations('ManageStock');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [addLoading, setAddLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState("1");
  const [restockLoading, setRestockLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:4000/products", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch stock");
      const data = await res.json();
      setProducts(data.filter((p: Product) => p.category === 'RAW' || !p.category));
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
    fetchProducts();
  }, [router]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setMessage("");

    const token = localStorage.getItem("admin_token");
    
    try {
      const res = await fetch("http://localhost:4000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productName,
          unitPrice: parseFloat(unitPrice) || 0,
          costPrice: parseFloat(costPrice) || 0,
          quantity: parseInt(quantity, 10) || 0,
          category: 'RAW'
        }),
      });

      if (!res.ok) throw new Error("Failed to add product");

      setMessage("Product added successfully!");
      setProductName("");
      setUnitPrice("");
      setCostPrice("");
      setQuantity("1");
      
      fetchProducts(); // Refresh list
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setAddLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
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
      const res = await fetch(`http://localhost:4000/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete product");
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTargetProduct) return;
    setRestockLoading(true);

    const token = localStorage.getItem("admin_token");
    const amountToAdd = parseInt(restockAmount, 10);
    const newQuantity = restockTargetProduct.quantity + amountToAdd;

    try {
      const res = await fetch(`http://localhost:4000/products/${restockTargetProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      if (!res.ok) throw new Error("Failed to restock product");
      
      setRestockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestockLoading(false);
    }
  };

  // Calculate Summary Metrics
  const totalProductTypes = products.length;
  const totalItemsInStock = products.reduce((acc, p) => acc + Number(p.quantity), 0);
  const totalStockValue = products.reduce((acc, p) => acc + (Number(p.unitPrice) * Number(p.quantity)), 0);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('title')}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('total_unique_products')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{totalProductTypes}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('total_items_in_stock')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{totalItemsInStock}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <h4 className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('total_stock_value')}</h4>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>LKR {totalStockValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Add Product Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', color: 'var(--primary)' }}>
            <PlusCircle size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{t('add_raw_furniture')}</h3>
          </div>
          
          <form onSubmit={handleAddProduct}>
            <div className="input-group">
              <label>{t('product_name')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={productName} onChange={e => setProductName(e.target.value)} placeholder={t('product_name_placeholder')} />
            </div>
            <div className="input-group">
              <label>{t('cost_price')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="input-group">
              <label>{t('selling_price')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
            </div>
            <div className="input-group">
              <label>{t('initial_quantity')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>

            {message && <p className={message.includes("success") ? "text-success mb-4" : "text-error mb-4"} style={{ fontSize: '0.9rem', fontWeight: '500' }}>{message}</p>}

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={addLoading}>
              <PlusCircle size={16} /> {addLoading ? t('adding') : t('add_to_stock')}
            </button>
          </form>
        </div>

        {/* Product List */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', color: 'var(--primary)' }}>
            <Package size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{t('current_stock')}</h3>
          </div>

          {loading ? (
            <p>{t('loading_stock')}</p>
          ) : error ? (
            <p className="text-error">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-secondary">{t('no_raw_furniture')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>{t('table_product_name')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('table_price')}</th>
                    <th style={{ padding: '12px 16px' }}>{t('table_quantity')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', fontWeight: '600' }}>{product.productName}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('cost_label')} {Number(product.costPrice || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: '600' }}>{t('sell_label')} {Number(product.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${product.quantity > 5 ? 'badge-success' : 'badge-primary'}`} style={{ background: product.quantity <= 5 ? 'rgba(220, 38, 38, 0.1)' : undefined, color: product.quantity <= 5 ? 'var(--error)' : undefined }}>
                          {product.quantity} {t('in_stock')}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => { setRestockTargetProduct(product); setRestockAmount("1"); setRestockModalOpen(true); }}
                            className="btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--success)', borderColor: 'var(--success)' }}
                            title="Restock Product"
                          >
                            <PlusCircle size={14} style={{ marginRight: '6px' }} /> {t('restock_btn')}
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '6px 8px' }}
                            title="Delete Product"
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
          )}

          {/* Pagination Controls */}
          {products.length > 0 && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)', background: '#F9FAFB', marginTop: '16px', borderRadius: '0 0 12px 12px' }}>
              <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, products.length)} {t('of')} {products.length} {t('products')}
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
      </div>

      {/* Restock Modal */}
      {restockModalOpen && restockTargetProduct && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRestockModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{t('restock_modal_title')}</h3>
              <button className="close-btn" onClick={() => setRestockModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>{restockTargetProduct.productName}</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span className="text-secondary">{t('current_quantity')}</span>
                  <strong className={restockTargetProduct.quantity <= 5 ? 'text-error' : ''}>{restockTargetProduct.quantity}</strong>
                </div>
              </div>
              <form onSubmit={handleRestock}>
                <div className="input-group">
                  <label>{t('quantity_to_add')}</label>
                  <input required type="number" min="1" className="input-field" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                  <button type="button" onClick={() => setRestockModalOpen(false)} className="btn-outline">{t('cancel')}</button>
                  <button type="submit" className="btn-primary" disabled={restockLoading} style={{ background: 'var(--success)', border: 'none' }}>
                    {restockLoading ? t('restocking') : t('confirm_restock')}
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
