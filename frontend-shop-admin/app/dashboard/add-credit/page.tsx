"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddCreditPage() {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  // Calculate interest based on months
  useEffect(() => {
    const m = parseInt(months, 10);
    if (isNaN(m) || m <= 2) {
      setInterestRate(0);
    } else if (m === 3) {
      setInterestRate(10);
    } else if (m === 4) {
      setInterestRate(15);
    } else if (m === 5) {
      setInterestRate(20);
    } else if (m === 6) {
      setInterestRate(25);
    } else if (m >= 7) {
      setInterestRate(35);
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFileState: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const token = localStorage.getItem("admin_token");
    
    try {
      const res = await fetch("http://localhost:4000/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          nic,
          mobile1,
          mobile2,
          productName,
          downPayment: parseFloat(downPayment) || 0,
          interestRate,
          months: parseInt(months, 10),
          totalPayment: calculateTotal(),
          monthlyInstallment: calculateMonthly(),
          nicFrontImageHash: nicFront, // Send base64, backend will hash it
          nicRearImageHash: nicRear
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create credit record.");
      }

      setMessage("Credit record created successfully!");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel" style={{ padding: '20px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push("/dashboard")} className="logout-btn" style={{ padding: '8px 16px' }}>&larr; Back</button>
          <h2 style={{ margin: 0 }}>Lithum Furniture <span style={{ color: 'var(--primary-color)' }}>Admin</span></h2>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h3 className="mb-4" style={{ fontSize: '1.8rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>Provide Goods on Credit</h3>
        <p className="text-secondary" style={{ marginBottom: '24px' }}>Please fill out all required fields marked with <span style={{ color: 'var(--error-color)' }}>*</span></p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>First Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="text" className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Last Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="text" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>National ID (NIC) <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="text" className="input-field" value={nic} onChange={e => setNic(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Product Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="text" className="input-field" value={productName} onChange={e => setProductName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Mobile Number 1 <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="text" className="input-field" placeholder="e.g. 0712345678" value={mobile1} onChange={e => setMobile1(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Mobile Number 2 <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="text" className="input-field" placeholder="e.g. 0777654321" value={mobile2} onChange={e => setMobile2(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Product Price (LKR) <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Down Payment (LKR) <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="number" min="0" step="0.01" className="input-field" value={downPayment} onChange={e => setDownPayment(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Months (1-10) <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <input required type="number" min="1" max="10" className="input-field" value={months} onChange={e => setMonths(e.target.value)} />
            </div>
          </div>

          <div style={{ padding: '24px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Payment Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-secondary">Interest Rate:</span>
              <strong style={{ color: 'var(--primary-color)' }}>{interestRate}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-secondary">Total Payable:</span>
              <strong style={{ color: 'var(--primary-color)' }}>LKR {calculateTotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-secondary">Monthly Installment:</span>
              <strong style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>LKR {calculateMonthly().toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>NIC Front Photo (Optional)</label>
              <input type="file" accept="image/*" className="input-field" onChange={e => handleFileChange(e, setNicFront)} style={{ padding: '8px' }} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>NIC Rear Photo (Optional)</label>
              <input type="file" accept="image/*" className="input-field" onChange={e => handleFileChange(e, setNicRear)} style={{ padding: '8px' }} />
            </div>
          </div>

          {message && <p className={message.includes("success") ? "text-success text-center" : "text-error text-center"}>{message}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '16px 40px' }}>
              {loading ? "Processing..." : "Submit Credit Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
