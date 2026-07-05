"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, RefreshCcw, CheckCircle, Printer } from "lucide-react";
import Swal from 'sweetalert2';

interface Product {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export default function CashierPage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discountType, setDiscountType] = useState("NONE");
  const [discountValue, setDiscountValue] = useState("");

  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("admin_token");
      try {
        const res = await fetch("http://localhost:4000/products", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  const calculateDiscountAmount = () => {
    const price = parseFloat(unitPrice) || 0;
    const qty = parseInt(quantity, 10) || 1;
    const subtotal = price * qty;
    
    const dVal = parseFloat(discountValue) || 0;
    if (discountType === "FIXED") {
      return dVal;
    } else if (discountType === "PERCENTAGE") {
      return subtotal * (dVal / 100);
    }
    return 0;
  };

  const calculateTotal = () => {
    const price = parseFloat(unitPrice) || 0;
    const qty = parseInt(quantity, 10) || 1;
    const subtotal = price * qty;
    const discount = calculateDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Reset Transaction?',
      text: "Are you sure you want to reset this transaction?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, reset it!'
    });
    
    if (!result.isConfirmed) return;
    setProductName("");
    setUnitPrice("");
    setQuantity("1");
    setDiscountType("NONE");
    setDiscountValue("");
    setMessage("");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'Confirm Checkout',
      text: "Are you sure you want to checkout this cash sale?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, checkout!'
    });
    
    if (!result.isConfirmed) return;
    
    setLoading(true);
    setMessage("");

    const total = calculateTotal();
    const token = localStorage.getItem("admin_token");
    
    const saleData = {
      productName,
      quantity: parseInt(quantity, 10) || 1,
      unitPrice: parseFloat(unitPrice) || 0,
      discountType,
      discountValue: calculateDiscountAmount(),
      totalPrice: total,
    };

    try {
      const res = await fetch("http://localhost:4000/cash-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(saleData),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const savedSale = await res.json();
      setMessage("Checkout successful!");
      
      // Open receipt modal
      setReceiptData({
        ...saleData,
        date: new Date().toLocaleString(),
        receiptId: savedSale.id || Math.floor(Math.random() * 1000000).toString(),
      });
      
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeReceipt = () => {
    setReceiptData(null);
    setProductName("");
    setUnitPrice("");
    setQuantity("1");
    setDiscountType("NONE");
    setDiscountValue("");
    setMessage("");
  };

  const printReceipt = () => {
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;
    
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    
    iframe.contentWindow?.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData.receiptId}</title>
          <style>
            body { font-family: 'Inter', sans-serif, Arial; margin: 0; padding: 20px; font-size: 14px; color: #000; }
            .text-center { text-align: center; }
            .fw-bold { font-weight: bold; }
            .d-flex { display: flex; justify-content: space-between; }
            .col-2 { flex: 2; }
            .col-1 { flex: 1; text-align: center; }
            .col-right { flex: 1; text-align: right; }
            .border-bottom { border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 16px; }
            .border-top { border-top: 2px solid #ccc; padding-top: 16px; margin-top: 8px; }
            h2 { margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 800; }
            p { margin: 0 0 4px 0; font-size: 0.85rem; color: #555; }
            .small-text { font-size: 0.85rem; color: #333; }
            .muted { color: #666; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
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
        <h1 className="page-title">Cashier Checkout</h1>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column - Form */}
        <div className="card" style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', color: 'var(--primary)' }}>
            <ShoppingCart size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Direct Cash Sale</h3>
          </div>

        <form onSubmit={handleCheckout}>
          <div className="input-group">
            <label>Product Name <span style={{ color: 'var(--error)' }}>*</span></label>
            <input 
              required 
              type="text"
              list="stock-products"
              className="input-field" 
              value={productName} 
              onChange={e => {
                const val = e.target.value;
                setProductName(val);
                if (val.trim() === "") {
                  setUnitPrice("");
                } else {
                  const selected = products.find(p => p.productName === val);
                  if (selected) {
                    setUnitPrice(selected.unitPrice.toString());
                  }
                }
              }}
              placeholder="Select from stock or type manually"
            />
            <datalist id="stock-products">
              {products.map(p => (
                <option key={p.id} value={p.productName} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label>Unit Price (LKR) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Quantity <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '24px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Discount Type</label>
              <select className="input-field" value={discountType} onChange={e => { setDiscountType(e.target.value); setDiscountValue(""); }}>
                <option value="NONE">No Discount</option>
                <option value="FIXED">Fixed Amount (LKR)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Discount Value {discountType === 'NONE' ? '' : (discountType === 'FIXED' ? '(LKR)' : '(%)')}</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                className="input-field" 
                value={discountValue} 
                onChange={e => setDiscountValue(e.target.value)} 
                disabled={discountType === 'NONE'} 
                placeholder={discountType === 'NONE' ? "N/A" : "0"}
              />
            </div>
          </div>

          {/* Transaction Summary moved to sidebar */}

          {message && <p className={message.includes("success") ? "text-success text-center mb-4" : "text-error text-center mb-4"}>{message}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button type="button" className="btn-outline" onClick={handleReset} disabled={loading} style={{ padding: '16px 32px' }}>
              <RefreshCcw size={18} style={{ marginRight: '8px' }} /> Reset
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '16px 40px' }}>
              <CheckCircle size={18} style={{ marginRight: '8px' }} /> {loading ? "Processing..." : "Checkout"}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column - Summary */}
      <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
        
        {/* Transaction Summary moved here */}
        <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '24px' }}>
            <h4 style={{ marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <ShoppingCart size={20} /> Transaction Summary
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="text-secondary">Subtotal ({(quantity || "1")}x):</span>
              <strong>LKR {((parseFloat(unitPrice) || 0) * (parseInt(quantity, 10) || 1)).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            {discountType !== 'NONE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--success)' }}>
                <span>Discount Applied:</span>
                <strong>- LKR {calculateDiscountAmount().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <span className="text-secondary" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Payable:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>LKR {calculateTotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
        </div>

        {/* Quick Help / Cashier Info */}
        <div className="card" style={{ padding: '24px' }}>
           <h4 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '1.1rem' }}>Cashier Guidelines</h4>
           <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> Verify product condition before checkout.</li>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> Provide the printed receipt to the customer.</li>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> Items can be exchanged within 7 days.</li>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> For discounts above 15%, manager approval is needed.</li>
           </ul>
        </div>
        
      </div>
    </div>

      {/* Receipt Modal */}
      {receiptData && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeReceipt(); }}>
          <div className="modal-content" style={{ maxWidth: '400px', background: '#fff' }}>
            
            <div id="receipt-content">
              <div style={{ padding: '32px', textAlign: 'center', borderBottom: '2px dashed #ccc' }}>
                <h2 style={{ margin: '0 0 8px 0', color: '#000', fontSize: '1.5rem', fontWeight: '800' }}>LITHUM FURNITURE</h2>
                <p style={{ margin: '0 0 4px 0', color: '#555', fontSize: '0.85rem' }}>123 Main Street, Colombo</p>
                <p style={{ margin: '0 0 16px 0', color: '#555', fontSize: '0.85rem' }}>Tel: 011-2345678</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#333' }}>
                  <span>Date: {receiptData.date.split(',')[0]}</span>
                  <span>Time: {receiptData.date.split(',')[1]}</span>
                </div>
                <div style={{ textAlign: 'left', marginTop: '8px', fontSize: '0.85rem', color: '#333' }}>
                  <span>Receipt #: {receiptData.receiptId.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '16px' }}>
                  <span style={{ flex: 2, color: '#000' }}>Item</span>
                  <span style={{ flex: 1, textAlign: 'center', color: '#000' }}>Qty</span>
                  <span style={{ flex: 1, textAlign: 'right', color: '#000' }}>Amount</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem', color: '#333' }}>
                  <span style={{ flex: 2 }}>{receiptData.productName} <br/><small style={{color: '#666'}}>@ {receiptData.unitPrice.toLocaleString()}</small></span>
                  <span style={{ flex: 1, textAlign: 'center' }}>{receiptData.quantity}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{(receiptData.unitPrice * receiptData.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>

                <div style={{ borderTop: '2px solid #ccc', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                    <span>Subtotal</span>
                    <span>{(receiptData.unitPrice * receiptData.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  {receiptData.discountValue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                      <span>Discount</span>
                      <span>- {receiptData.discountValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '1.2rem', fontWeight: 'bold', color: '#000' }}>
                    <span>TOTAL</span>
                    <span>LKR {receiptData.totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 32px 32px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', color: '#000', fontWeight: 'bold' }}>THANK YOU FOR SHOPPING!</p>
                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Items can be exchanged within 7 days.</p>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F9FAFB', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: '16px', borderRadius: '0 0 12px 12px' }}>
              <button className="btn-outline" onClick={closeReceipt}>Close</button>
              <button className="btn-primary" onClick={printReceipt} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Printer size={18} style={{ marginRight: '8px' }} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
