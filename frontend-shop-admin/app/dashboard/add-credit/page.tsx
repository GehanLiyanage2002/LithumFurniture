"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Camera, X } from "lucide-react";

export default function AddCreditPage() {
  const router = useRouter();
  
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
    if (!confirm("Are you sure you want to submit this credit record?")) return;
    
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
          nicFrontImageHash: nicFront,
          nicRearImageHash: nicRear,
          customerFaceImage
        }),
      });
      if (!res.ok) throw new Error("Failed to create credit record.");
      setMessage("Credit record created successfully!");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) { 
      setMessage(err.message); 
      setLoading(false); 
    }
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to clear all form fields?")) return;
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
        <h1 className="page-title">Provide Goods on Credit</h1>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <p className="text-secondary" style={{ marginBottom: '24px' }}>Please fill out all required fields marked with <span style={{ color: 'var(--error)' }}>*</span></p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>First Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Last Name</label>
              <input type="text" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>National ID (NIC) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={nic} onChange={e => setNic(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Bill / Invoice No.</label>
              <input type="text" className="input-field" value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. INV-10024" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Mobile Number 1 <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="tel" className="input-field" placeholder="e.g. 0712345678" value={mobile1} onChange={e => setMobile1(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Mobile Number 2</label>
              <input type="tel" className="input-field" placeholder="e.g. 0777654321" value={mobile2} onChange={e => setMobile2(e.target.value)} />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Product Name <span style={{ color: 'var(--error)' }}>*</span></label>
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
              placeholder="Select or type manually"
            />
            <datalist id="product-list">
              {products.map(p => (
                <option key={p.id} value={p.productName} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Product Price (LKR) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Down Payment (LKR) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={downPayment} onChange={e => setDownPayment(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Months (1-10) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" max="10" className="input-field" value={months} onChange={e => setMonths(e.target.value)} />
            </div>
          </div>

          <div style={{ padding: '24px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Payment Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-secondary">Interest Rate:</span>
              <strong style={{ color: 'var(--primary)' }}>{interestRate}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-secondary">Total Payable:</span>
              <strong style={{ color: 'var(--primary)' }}>LKR {calculateTotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Monthly Installment:</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>LKR {calculateMonthly().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Verification Images (Security Hashed)</label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* NIC Front */}
              <div 
                style={{ border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', cursor: 'pointer', transition: '0.2s', minHeight: '140px' }} 
                onClick={() => document.getElementById('nicFront')?.click()}
              >
                <input type="file" id="nicFront" accept="image/*" onChange={(e) => handleImageUpload(e, setNicFront)} style={{ display: 'none' }} />
                <FileText size={28} style={{ marginBottom: '12px', color: nicFront ? 'var(--success)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>NIC Front</span>
                {nicFront && <span className="text-success" style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Uploaded ✔</span>}
              </div>
              
              {/* NIC Rear */}
              <div 
                style={{ border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', cursor: 'pointer', transition: '0.2s', minHeight: '140px' }} 
                onClick={() => document.getElementById('nicRear')?.click()}
              >
                <input type="file" id="nicRear" accept="image/*" onChange={(e) => handleImageUpload(e, setNicRear)} style={{ display: 'none' }} />
                <FileText size={28} style={{ marginBottom: '12px', color: nicRear ? 'var(--success)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>NIC Rear</span>
                {nicRear && <span className="text-success" style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Uploaded ✔</span>}
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
                    <button type="button" onClick={captureFace} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%' }}>Capture</button>
                  </div>
                ) : (
                  <button type="button" onClick={startCamera} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}>
                    <Camera size={28} style={{ marginBottom: '12px', color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Live Camera</span>
                  </button>
                )}
                <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
              </div>
            </div>
          </div>

          {message && <p className={message.includes("success") ? "text-success text-center" : "text-error text-center"}>{message}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '16px' }}>
            <button type="button" className="btn-outline" onClick={handleReset} disabled={loading} style={{ padding: '16px 32px' }}>
              Reset Form
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '16px 40px' }}>
              {loading ? "Processing..." : "Submit Credit Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
