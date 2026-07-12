"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations('Cashier');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [outOfStock, setOutOfStock] = useState(false);

  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discountType, setDiscountType] = useState("NONE");
  const [discountValue, setDiscountValue] = useState("");

  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const token = sessionStorage.getItem("admin_token");
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
    setOutOfStock(false);
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
    
    const selectedProduct = products.find(p => p.productName === productName);
    if (selectedProduct) {
      const requestedQty = parseInt(quantity, 10) || 1;
      if (selectedProduct.quantity < requestedQty) {
        await Swal.fire({
          icon: 'error',
          title: 'Insufficient Stock',
          text: `Only ${selectedProduct.quantity} item(s) left in stock. You requested ${requestedQty}.`,
        });
        return;
      }
    }

    setLoading(true);
    setMessage("");

    const total = calculateTotal();
    const token = sessionStorage.getItem("admin_token");
    
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
    setOutOfStock(false);
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
                <strong>Receipt #:</strong> ${receiptData.receiptId.substring(0, 8).toUpperCase()}<br>
                <strong>Date:</strong> ${receiptData.date.split(',')[0]}<br>
                <strong>Time:</strong> ${receiptData.date.split(',')[1]}
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
                <td><strong>${receiptData.productName}</strong></td>
                <td class="center">${receiptData.quantity}</td>
                <td class="right">${Number(receiptData.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="right">${(Number(receiptData.unitPrice) * receiptData.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${(Number(receiptData.unitPrice) * receiptData.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            ${receiptData.discountValue > 0 ? `<div class="summary-row discount"><span>Discount</span><span>- ${Number(receiptData.discountValue).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>` : ''}
            <div class="summary-row total">
              <span>TOTAL</span>
              <span>LKR ${Number(receiptData.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
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
        <h1 className="page-title">{t('checkout')}</h1>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column - Form */}
        <div className="card" style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', color: 'var(--primary)' }}>
            <ShoppingCart size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{t('direct_sale')}</h3>
          </div>

        <form onSubmit={handleCheckout}>
          <div className="input-group">
            <label>{t('product_name')} <span style={{ color: 'var(--error)' }}>*</span></label>
            <input 
              required 
              type="text"
              list="stock-products"
              className="input-field" 
              value={productName} 
              style={{ borderColor: outOfStock ? 'var(--error)' : undefined, borderWidth: outOfStock ? '2px' : undefined }}
              onChange={e => {
                const val = e.target.value;
                setProductName(val);
                setOutOfStock(false);
                if (val.trim() === "") {
                  setUnitPrice("");
                } else {
                  const selected = products.find(p => p.productName === val);
                  if (selected) {
                    if (selected.quantity <= 0) {
                      setOutOfStock(true);
                      Swal.fire({
                        icon: 'warning',
                        title: 'Out of Stock',
                        text: 'This item is out of stock.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 4000
                      });
                    }
                    setUnitPrice(selected.unitPrice.toString());
                  }
                }
              }}
              placeholder={t('select_product')}
            />
            {outOfStock && <small style={{ color: 'var(--error)', marginTop: '4px', display: 'block', fontWeight: 600 }}>{t('out_of_stock_checkout')}</small>}
            <datalist id="stock-products">
              {products.map(p => (
                <option key={p.id} value={p.productName} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label>{t('unit_price')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
            </div>
            <div className="input-group">
              <label>{t('quantity')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '24px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('discount_type')}</label>
              <select className="input-field" value={discountType} onChange={e => { setDiscountType(e.target.value); setDiscountValue(""); }}>
                <option value="NONE">{t('no_discount')}</option>
                <option value="FIXED">{t('fixed_amount')}</option>
                <option value="PERCENTAGE">{t('percentage')}</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('discount_value')} {discountType === 'NONE' ? '' : (discountType === 'FIXED' ? '(LKR)' : '(%)')}</label>
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
              <RefreshCcw size={18} style={{ marginRight: '8px' }} /> {t('reset')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '16px 40px' }}>
              <CheckCircle size={18} style={{ marginRight: '8px' }} /> {loading ? t('processing') : t('checkout_btn')}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column - Summary */}
      <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
        
        {/* Transaction Summary moved here */}
        <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '24px' }}>
            <h4 style={{ marginBottom: '20px', color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <ShoppingCart size={20} /> {t('summary')}
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="text-secondary">{t('subtotal')} ({(quantity || "1")}x):</span>
              <strong>LKR {((parseFloat(unitPrice) || 0) * (parseInt(quantity, 10) || 1)).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            {discountType !== 'NONE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--success)' }}>
                <span>{t('discount_applied')}:</span>
                <strong>- LKR {calculateDiscountAmount().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <span className="text-secondary" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t('total_payable')}:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>LKR {calculateTotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
        </div>

        {/* Quick Help / Cashier Info */}
        <div className="card" style={{ padding: '24px' }}>
           <h4 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '1.1rem' }}>{t('guidelines')}</h4>
           <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_1')}</li>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_2')}</li>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_3')}</li>
             <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_4')}</li>
           </ul>
        </div>
        
      </div>
    </div>

      {/* Receipt Modal */}
      {receiptData && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeReceipt(); }}>
          <div className="modal-content" style={{ maxWidth: '400px', background: '#fff' }}>
            
            <div id="receipt-content" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto', fontFamily: 'monospace', color: '#000' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>LITHUM FURNITURES</h2>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>No.76, Badulla Road, Ettampitiya.</p>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Tel: 077 183 0883</p>
              </div>
              <div style={{ marginBottom: '15px', fontSize: '0.9rem', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
                <p style={{ margin: '2px 0' }}><strong>Receipt #:</strong> {receiptData.receiptId}</p>
                <p style={{ margin: '2px 0' }}><strong>Date:</strong> {receiptData.date}</p>
              </div>
              <table style={{ width: '100%', fontSize: '0.9rem', marginBottom: '15px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #ccc' }}>
                    <th style={{ textAlign: 'left', padding: '5px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '5px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '5px 0' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0' }}>{receiptData.productName}</td>
                    <td style={{ textAlign: 'center', padding: '8px 0' }}>{receiptData.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>{(Number(receiptData.unitPrice) * receiptData.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: '0.9rem', borderTop: '1px dashed #ccc', paddingTop: '10px', textAlign: 'right' }}>
                <p style={{ margin: '2px 0' }}>Subtotal: {(Number(receiptData.unitPrice) * receiptData.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                {receiptData.discountValue > 0 && (
                  <p style={{ margin: '2px 0', color: '#dc2626' }}>Discount: - {Number(receiptData.discountValue).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                )}
                <p style={{ margin: '5px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Total: LKR {Number(receiptData.totalPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#666' }}>
                <p>THANK YOU FOR YOUR BUSINESS!</p>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F9FAFB', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: '16px', borderRadius: '0 0 12px 12px' }}>
              <button className="btn-outline" onClick={closeReceipt}>{t('close')}</button>
              <button className="btn-primary" onClick={printReceipt} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Printer size={18} style={{ marginRight: '8px' }} /> {t('print')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
