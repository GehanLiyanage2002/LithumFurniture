"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Camera, X, Printer, CheckCircle, Search, History } from "lucide-react";
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

  const [discountType, setDiscountType] = useState("NONE");
  const [discountValue, setDiscountValue] = useState("");

  const [nicFront, setNicFront] = useState<string | null>(null);
  const [nicRear, setNicRear] = useState<string | null>(null);
  const [customerFaceImage, setCustomerFaceImage] = useState<string | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [isSearchingNic, setIsSearchingNic] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  
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

  const validateNic = (nicNumber: string) => {
    const oldNicRegex = /^[0-9]{9}[vVxX]$/;
    const newNicRegex = /^[0-9]{12}$/;
    return oldNicRegex.test(nicNumber) || newNicRegex.test(nicNumber);
  };

  const handleNicSearch = async () => {
    if (!nic) return;
    
    if (!validateNic(nic)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid NIC',
        text: 'Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).',
      });
      return;
    }

    setIsSearchingNic(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://localhost:4000/credits/customer/search/${nic}`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        
        if (data && data.firstName) {
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setMobile1(data.mobile1 || "");
          setMobile2(data.mobile2 || "");
          if (data.nicFrontImage) setNicFront(data.nicFrontImage);
          if (data.nicRearImage) setNicRear(data.nicRearImage);
          if (data.customerFaceImage) setCustomerFaceImage(data.customerFaceImage);
          
          Swal.fire({
            icon: 'success',
            title: 'Customer Found!',
            text: 'Customer details auto-filled successfully.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });

          // Fetch History
          const historyRes = await fetch(`http://localhost:4000/credits/customer/history/${nic}`, { 
            headers: { "Authorization": `Bearer ${token}` } 
          });
          if (historyRes.ok) {
            const hText = await historyRes.text();
            setCustomerHistory(hText ? JSON.parse(hText) : []);
          }
        } else {
          Swal.fire({
            icon: 'info',
            title: 'New Customer',
            text: 'No existing customer found with this NIC. Please fill in the details.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
          setCustomerHistory([]);
        }
      }
    } catch (err) {
      console.error("Failed to search NIC", err);
    } finally {
      setIsSearchingNic(false);
    }
  };

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

  const calculateDiscountAmount = () => {
    const price = parseFloat(productPrice) || 0;
    const dVal = parseFloat(discountValue) || 0;
    if (discountType === "FIXED") {
      return dVal;
    } else if (discountType === "PERCENTAGE") {
      return price * (dVal / 100);
    }
    return 0;
  };

  const calculateTotal = () => {
    const price = parseFloat(productPrice) || 0;
    const discount = calculateDiscountAmount();
    const finalPrice = Math.max(0, price - discount);
    
    const down = parseFloat(downPayment) || 0;
    const payable = finalPrice - down;
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
    setShowCameraModal(true);
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
      setShowCameraModal(false);
    }
  };

  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
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
      context?.drawImage(videoRef.current, 0, 0, 640, 480);
      setCustomerFaceImage(canvasRef.current.toDataURL("image/jpeg"));
      stopCamera();
      setShowCameraModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateNic(nic)) {
      await Swal.fire({
        icon: 'error',
        title: 'Invalid NIC',
        text: 'Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits) before submitting.',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Submission',
      text: "Are you sure you want to submit this credit record?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit it!',
      customClass: {
        confirmButton: 'btn-primary',
        cancelButton: 'btn-outline'
      },
      buttonsStyling: false
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
          discount: calculateDiscountAmount(),
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
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Credit record created and SMS sent successfully!',
        confirmButtonColor: '#059669'
      });

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
          <title>Credit Agreement - ${receiptData.id}</title>
          <style>
            @media print { 
              @page { margin: 15mm; size: A4 portrait; }
              body { margin: 0; padding: 0; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0 auto; padding: 40px; font-size: 14px; color: #333; max-width: 800px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 2.2rem; font-weight: 900; color: #2563eb; margin: 0 0 8px 0; letter-spacing: -0.5px; }
            .company-details { font-size: 0.9rem; color: #555; line-height: 1.5; }
            .receipt-title { text-align: right; }
            .receipt-title h1 { font-size: 1.8rem; color: #333; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 300; letter-spacing: 1px; }
            .meta-info { font-size: 0.95rem; color: #555; line-height: 1.6; }
            
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background-color: #f9fafb; }
            .box-title { font-size: 1.1rem; font-weight: bold; color: #111; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 12px; margin-top: 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }
            .info-row span:first-child { color: #4b5563; }
            .info-row span:last-child { font-weight: 600; color: #111; }
            
            .financials { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 40px; }
            .fin-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 1rem; color: #333; border-bottom: 1px dashed #e5e7eb; }
            .fin-row:last-child { border-bottom: none; }
            .fin-row.highlight { font-size: 1.2rem; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 8px; border-bottom: none; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 0.95rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 40px; }
            .sig-line { width: 220px; border-top: 1px solid #111; text-align: center; padding-top: 8px; font-weight: 600; color: #111; }
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
              <h1>CREDIT AGREEMENT</h1>
              <div class="meta-info">
                <strong>Agreement ID:</strong> ${receiptData.id.substring(0, 8).toUpperCase()}<br>
                <strong>Date:</strong> ${receiptData.date.split(',')[0]}<br>
                <strong>Time:</strong> ${receiptData.date.split(',')[1]}
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="box">
              <h3 class="box-title">Customer Details</h3>
              <div class="info-row"><span>Name:</span> <span>${receiptData.firstName} ${receiptData.lastName}</span></div>
              <div class="info-row"><span>NIC:</span> <span>${receiptData.nic}</span></div>
              <div class="info-row"><span>Contact 1:</span> <span>${receiptData.mobile1}</span></div>
              ${receiptData.mobile2 ? `<div class="info-row"><span>Contact 2:</span> <span>${receiptData.mobile2}</span></div>` : ''}
              ${receiptData.billNo ? `<div class="info-row"><span>Bill No:</span> <span>${receiptData.billNo}</span></div>` : ''}
            </div>
            <div class="box">
              <h3 class="box-title">Product Details</h3>
              <div class="info-row"><span>Item:</span> <span>${receiptData.productName}</span></div>
              <div class="info-row"><span>Product Price:</span> <span>LKR ${Number(receiptData.productPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
              ${receiptData.discount > 0 ? `<div class="info-row" style="color: #059669;"><span>Discount:</span> <span>- LKR ${Number(receiptData.discount).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>` : ''}
              <div class="info-row" style="color: #059669;"><span>Down Payment Paid:</span> <span>LKR ${Number(receiptData.downPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            </div>
          </div>

          <div class="financials">
            <h3 class="box-title">Credit Plan Summary</h3>
            <div class="fin-row"><span>Total Loan Amount (Payable)</span> <span>LKR ${Number(receiptData.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div class="fin-row"><span>Duration</span> <span>${receiptData.months} Months</span></div>
            <div class="fin-row highlight">
              <span>Monthly Installment</span>
              <span>LKR ${Number(receiptData.monthlyInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">Customer Signature</div>
            <div class="sig-line">Authorized Signatory</div>
          </div>

          <div class="footer">
            <p><strong>THANK YOU FOR YOUR BUSINESS!</strong></p>
            <p>Please retain this agreement for your records. Installments must be paid before the due date each month.</p>
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
      confirmButtonText: 'Yes, clear it!',
      customClass: {
        confirmButton: 'btn-danger',
        cancelButton: 'btn-outline'
      },
      buttonsStyling: false
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
    setDiscountType("NONE");
    setDiscountValue("");
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
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('nic')} <span style={{ color: 'var(--error)' }}>*</span></span>
                {customerHistory.length > 0 && (
                  <button type="button" onClick={() => setShowHistoryModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <History size={14} /> View History ({customerHistory.length})
                  </button>
                )}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input required type="text" className="input-field" style={{ flex: 1 }} value={nic} onChange={e => setNic(e.target.value)} placeholder="Enter NIC" />
                <button type="button" onClick={handleNicSearch} disabled={isSearchingNic || !nic} className="btn-primary" style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={18} /> {isSearchingNic ? '...' : 'Search'}
                </button>
              </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', marginTop: '8px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('discount_type') || 'Discount Type'}</label>
              <select className="input-field" value={discountType} onChange={e => { setDiscountType(e.target.value); setDiscountValue(""); }}>
                <option value="NONE">{t('no_discount') || 'No Discount'}</option>
                <option value="FIXED">{t('fixed_amount') || 'Fixed Amount'}</option>
                <option value="PERCENTAGE">{t('percentage') || 'Percentage'}</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>{t('discount_value') || 'Discount Value'} {discountType === 'NONE' ? '' : (discountType === 'FIXED' ? '(LKR)' : '(%)')}</label>
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
                ) : (
                  <button type="button" onClick={startCamera} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}>
                    <Camera size={28} style={{ marginBottom: '12px', color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('live_camera')}</span>
                  </button>
                )}
                <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }}></canvas>
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
            {discountType !== 'NONE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--success)' }}>
                <span>{t('discount_applied') || 'Discount'}:</span>
                <strong>- LKR {calculateDiscountAmount().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
              </div>
            )}
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
            
            <div id="credit-receipt-content" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #2563eb', paddingBottom: '16px' }}>
                <h2 style={{ margin: '0 0 8px 0', color: '#2563eb', fontSize: '1.5rem', fontWeight: 800 }}>LITHUM FURNITURES</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>CREDIT AGREEMENT</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.95rem' }}>
                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Customer:</strong> {receiptData.firstName} {receiptData.lastName}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>NIC:</strong> {receiptData.nic}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Product:</strong> {receiptData.productName}</p>
                  <p style={{ margin: '0' }}><strong>Contact:</strong> {receiptData.mobile1}</p>
                </div>
                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#4b5563' }}>Product Price:</span>
                    <span style={{ fontWeight: 600 }}>LKR {Number(receiptData.productPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#4b5563' }}>Down Payment:</span>
                    <span style={{ fontWeight: 600, color: '#059669' }}>LKR {Number(receiptData.downPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px dashed #d1d5db', paddingTop: '8px' }}>
                    <span style={{ color: '#4b5563' }}>Total Payable:</span>
                    <span style={{ fontWeight: 600 }}>LKR {Number(receiptData.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#4b5563' }}>Duration:</span>
                    <span style={{ fontWeight: 600 }}>{receiptData.months} Months</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontWeight: 600, color: '#1e3a8a' }}>Monthly Installment:</span>
                    <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '1.1rem' }}>LKR {Number(receiptData.monthlyInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
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

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) closeCameraModal(); }}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '100%', background: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Capture Customer Image</h3>
              <button type="button" onClick={closeCameraModal} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}><X size={18} /></button>
            </div>
            
            <div style={{ width: '100%', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', position: 'relative' }}>
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '400px', objectFit: 'cover' }}></video>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>Initializing camera...</span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
              <button type="button" className="btn-outline" onClick={closeCameraModal} style={{ padding: '10px 24px' }}>Cancel</button>
              <button type="button" className="btn-primary" onClick={captureFace} disabled={!cameraActive} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
                <Camera size={18} /> {t('capture')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '100%', background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="var(--primary)" /> Customer Credit History
              </h3>
              <button type="button" onClick={() => setShowHistoryModal(false)} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}><X size={18} /></button>
            </div>
            
            <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px', fontWeight: 600, color: '#374151' }}>Date</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: '#374151' }}>Product</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: '#374151' }}>Total Loan</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: '#374151' }}>Paid Amount</th>
                    <th style={{ padding: '12px', fontWeight: 600, color: '#374151' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerHistory.map((historyItem: any) => (
                    <tr key={historyItem.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', color: '#4b5563' }}>{new Date(historyItem.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', color: '#111827', fontWeight: 500 }}>{historyItem.productName}</td>
                      <td style={{ padding: '12px', color: '#4b5563' }}>LKR {Number(historyItem.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                      <td style={{ padding: '12px', color: '#059669', fontWeight: 500 }}>LKR {Number(historyItem.paidAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          background: historyItem.status === 'COMPLETED' ? '#d1fae5' : '#fee2e2',
                          color: historyItem.status === 'COMPLETED' ? '#065f46' : '#991b1b'
                        }}>
                          {historyItem.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-outline" onClick={() => setShowHistoryModal(false)} style={{ padding: '10px 24px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
