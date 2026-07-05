"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Camera, X, Printer, CheckCircle } from "lucide-react";
import Swal from 'sweetalert2';

export default function AddCreditPage() {
  const router = useRouter();
  const t = useTranslations('AddCredit');
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [billNo, setBillNo] = useState("");
  const [nic, setNic] = useState("");
  const [mobile1, setMobile1] = useState("");
  const [mobile2, setMobile2] = useState("");

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [months, setMonths] = useState("1");
  const [interestRate, setInterestRate] = useState(0);

  const [nicFront, setNicFront] = useState<string | null>(null);
  const [nicRear, setNicRear] = useState<string | null>(null);
  const [customerFaceImage, setCustomerFaceImage] = useState<string | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("http://localhost:4000/products", { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) setProducts(await res.json());
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) router.push("/");
  }, [router]);

  // Calculate interest based on months
  useEffect(() => {
    const m = parseInt(months, 10);
    if (isNaN(m) || m <= 2) setInterestRate(0);
    else if (m === 3) setInterestRate(10);
    else if (m === 4) setInterestRate(15);
    else if (m === 5) setInterestRate(20);
    else if (m === 6) setInterestRate(25);
    else if (m >= 7) setInterestRate(35);
  }, [months]);

  const calculateTotal = () => {
    const price = parseFloat(productPrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const payable = price - down;
    if (payable <= 0) return 0;
    const interest = payable * (interestRate / 100);
    return payable + interest;
  };

  const calculateMonthly = () => {
    const total = calculateTotal();
    const m = parseInt(months, 10);
    if (!m || m <= 0) return 0;
    return total / m;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setFileState: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFileState(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraActive(true);
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      }, 100);
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context?.drawImage(videoRef.current, 0, 0, 320, 240);
      setCustomerFaceImage(canvasRef.current.toDataURL("image/jpeg"));
      stopCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await Swal.fire({
      title: 'Confirm Submission',
      text: "Are you sure you want to submit this credit record?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669', // success green
      cancelButtonColor: '#6B7280', // secondary gray
      confirmButtonText: 'Yes, submit it!'
    });
    
    if (!result.isConfirmed) return;
    
    setLoading(true);
    setMessage("");
    
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("http://localhost:4000/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          firstName, 
          lastName, 
          billNo, 
          nic, 
          mobile1, 
          mobile2, 
          productName,
          productPrice: parseFloat(productPrice) || 0,
          downPayment: parseFloat(downPayment) || 0,
          interestRate,
          months: parseInt(months, 10),
          totalPayment: calculateTotal(),
          monthlyInstallment: calculateMonthly(),
          nicFrontImage: nicFront,
          nicRearImage: nicRear,
          customerFaceImage
        }),
      });
      if (!res.ok) throw new Error("Failed to create credit record.");
      const savedCredit = await res.json();
      setMessage("Credit record created successfully!");
      setReceiptData({
        ...savedCredit,
        date: new Date().toLocaleString()
      });
    } catch (err: any) { 
      setMessage(err.message); 
    } finally {
      setLoading(false); 
    }
  };

  const printReceipt = () => {
    const printContent = document.getElementById("credit-receipt-content");
    if (!printContent) return;
    
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    
    iframe.contentWindow?.document.write(`
      <html>
        <head>
          <title>Credit Receipt - ${receiptData.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif, Arial; margin: 0; padding: 20px; font-size: 14px; color: #000; }
            h2 { margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 800; text-align: center; }
            p { margin: 0 0 4px 0; font-size: 0.85rem; text-align: center; color: #555; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; color: #333; }
            .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
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

  const closeReceipt = () => {
    setReceiptData(null);
    router.push("/dashboard/history");
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Clear Form?',
      text: "Are you sure you want to clear all form fields?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626', // error red
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, clear it!'
    });
    
    if (!result.isConfirmed) return;

    setFirstName(""); 
    setLastName(""); 
    setBillNo(""); 
    setNic(""); 
    setMobile1(""); 
    setMobile2("");
    setProductName(""); 
    setProductPrice(""); 
    setDownPayment(""); 
    setMonths("1");
    setNicFront(null); 
    setNicRear(null); 
    setCustomerFaceImage(null); 
    stopCamera();
    setMessage("");
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('title')}</h1>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column - Form */}
        <div className="card" style={{ flex: '1 1 600px' }}>
          <p className="text-secondary" style={{ marginBottom: '24px' }}>{t('required_fields')} <span style={{ color: 'var(--error)' }}>*</span></p>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('first_name')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('last_name')}</label>
              <input type="text" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('nic')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={nic} onChange={e => setNic(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('bill_no')}</label>
              <input type="text" className="input-field" value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. INV-10024" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('mobile_1')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="tel" className="input-field" placeholder="e.g. 0712345678" value={mobile1} onChange={e => setMobile1(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('mobile_2')}</label>
              <input type="tel" className="input-field" placeholder="e.g. 0777654321" value={mobile2} onChange={e => setMobile2(e.target.value)} />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>{t('product_name')} <span style={{ color: 'var(--error)' }}>*</span></label>
            <input 
              required 
              type="text"
              list="product-list"
              className="input-field" 
              value={productName} 
              onChange={e => {
                const val = e.target.value;
                setProductName(val);
                if (val.trim() === "") {
                  setProductPrice("");
                } else {
                  const selected = products.find(p => p.productName === val);
                  if (selected) {
                    setProductPrice(selected.unitPrice.toString());
                  }
                }
              }}
              placeholder={t('select_product')}
            />
            <datalist id="product-list">
              {products.map(p => (
                <option key={p.id} value={p.productName} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('product_price')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('down_payment')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={downPayment} onChange={e => setDownPayment(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('months')} <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" max="10" className="input-field" value={months} onChange={e => setMonths(e.target.value)} />
            </div>
          </div>

          {/* Payment Summary moved to right sidebar */}

          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t('verification_images')}</label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* NIC Front */}
              <div 
                style={{ border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', cursor: 'pointer', transition: '0.2s', minHeight: '140px' }} 
                onClick={() => document.getElementById('nicFront')?.click()}
              >
                <input type="file" id="nicFront" accept="image/*" onChange={(e) => handleImageUpload(e, setNicFront)} style={{ display: 'none' }} />
                <FileText size={28} style={{ marginBottom: '12px', color: nicFront ? 'var(--success)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('nic_front')}</span>
                {nicFront && <span className="text-success" style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>{t('uploaded')}</span>}
              </div>
              
              {/* NIC Rear */}
              <div 
                style={{ border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', cursor: 'pointer', transition: '0.2s', minHeight: '140px' }} 
                onClick={() => document.getElementById('nicRear')?.click()}
              >
                <input type="file" id="nicRear" accept="image/*" onChange={(e) => handleImageUpload(e, setNicRear)} style={{ display: 'none' }} />
                <FileText size={28} style={{ marginBottom: '12px', color: nicRear ? 'var(--success)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('nic_rear')}</span>
                {nicRear && <span className="text-success" style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>{t('uploaded')}</span>}
              </div>

              {/* Webcam */}
              <div style={{ border: '2px dashed var(--border)', padding: '12px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', minHeight: '140px' }}>
                {customerFaceImage ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={customerFaceImage} alt="Face" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button type="button" onClick={() => setCustomerFaceImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}><X size={14} /></button>
                  </div>
                ) : cameraActive ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', background: '#000', marginBottom: '8px' }}></video>
                    <button type="button" onClick={captureFace} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%' }}>{t('capture')}</button>
                  </div>
                ) : (
                  <button type="button" onClick={startCamera} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}>
                    <Camera size={28} style={{ marginBottom: '12px', color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('live_camera')}</span>
                  </button>
                )}
                <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
              </div>
            </div>
          </div>

          {message && <p className={message.includes("success") ? "text-success text-center" : "text-error text-center"}>{message}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '16px' }}>
            <button type="button" className="btn-outline" onClick={handleReset} disabled={loading} style={{ padding: '16px 32px' }}>
              {t('reset_form')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '16px 40px' }}>
              {loading ? t('processing') : t('submit_credit')}
            </button>
          </div>
        </form>
        </div>

        {/* Right Column - Summary & Info */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
          
          {/* Payment Summary */}
          <div className="card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
               {t('payment_summary')}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#444', fontWeight: 500 }}>{t('product_price')}:</span>
              <strong>LKR {(parseFloat(productPrice) || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#444', fontWeight: 500 }}>{t('down_payment')}:</span>
              <strong>- LKR {(parseFloat(downPayment) || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#444', fontWeight: 500 }}>{t('interest_rate')}:</span>
              <strong style={{ color: 'var(--warning)' }}>{interestRate}%</strong>
            </div>
            <div style={{ borderTop: '1px dashed rgba(139, 90, 43, 0.3)', margin: '16px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#444', fontWeight: 500 }}>{t('total_payable')}:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>LKR {calculateTotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '16px', borderRadius: '8px', marginTop: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{t('monthly_installment')}:</span>
              <strong style={{ color: 'var(--success)', fontSize: '1.25rem' }}>LKR {calculateMonthly().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
          </div>

          {/* Credit Guidelines */}
          <div className="card" style={{ padding: '24px' }}>
             <h4 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '1.1rem' }}>{t('credit_guidelines')}</h4>
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
               <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_1')}</li>
               <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_2')}</li>
               <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_3')}</li>
               <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }}/> {t('guide_4')}</li>
             </ul>
          </div>
        </div>
      </div>

      {/* Credit Receipt Modal */}
      {receiptData && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeReceipt(); }}>
          <div className="modal-content" style={{ maxWidth: '450px', background: '#fff' }}>
            
            <div id="credit-receipt-content">
              <div style={{ padding: '32px', textAlign: 'center', borderBottom: '2px dashed #ccc' }}>
                <h2 style={{ margin: '0 0 8px 0', color: '#000', fontSize: '1.5rem', fontWeight: '800' }}>LITHUM FURNITURE</h2>
                <p style={{ margin: '0 0 4px 0', color: '#555', fontSize: '0.85rem', textAlign: 'center' }}>123 Main Street, Colombo</p>
                <p style={{ margin: '0 0 16px 0', color: '#555', fontSize: '0.85rem', textAlign: 'center' }}>Tel: 011-2345678</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#333' }}>
                  <span>Date: {receiptData.date.split(',')[0]}</span>
                  <span>Time: {receiptData.date.split(',')[1]}</span>
                </div>
                <div style={{ textAlign: 'left', marginTop: '8px', fontSize: '0.85rem', color: '#333' }}>
                  <span>Credit ID: {receiptData.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div style={{ padding: '24px 32px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#000', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Customer Details</h4>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Name:</span>
                  <strong>{receiptData.firstName} {receiptData.lastName}</strong>
                </div>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>NIC:</span>
                  <span>{receiptData.nic}</span>
                </div>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Contact:</span>
                  <span>{receiptData.mobile1}</span>
                </div>
                {receiptData.billNo && (
                  <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                    <span>Bill No:</span>
                    <span>{receiptData.billNo}</span>
                  </div>
                )}

                <h4 style={{ margin: '24px 0 12px 0', color: '#000', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Credit Plan</h4>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Product:</span>
                  <strong>{receiptData.productName}</strong>
                </div>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Product Price:</span>
                  <span>LKR {Number(receiptData.productPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Down Payment (Paid):</span>
                  <strong style={{ color: '#059669' }}>LKR {Number(receiptData.downPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </div>
                
                <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '16px 0' }}></div>
                
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Loan Amount:</span>
                  <span>LKR {Number(receiptData.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#333' }}>
                  <span>Duration:</span>
                  <span>{receiptData.months} Months</span>
                </div>
                <div className="details-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '1.1rem', color: '#000', fontWeight: 'bold' }}>
                  <span>Monthly Installment:</span>
                  <span>LKR {Number(receiptData.monthlyInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div style={{ padding: '0 32px 32px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>THANK YOU!</p>
                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', textAlign: 'center' }}>Please retain this receipt for your records.</p>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F9FAFB', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: '16px', borderRadius: '0 0 12px 12px' }}>
              <button className="btn-outline" onClick={closeReceipt}>{t('close_view_history')}</button>
              <button className="btn-primary" onClick={printReceipt} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <Printer size={18} style={{ marginRight: '8px' }} /> {t('print_agreement')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
