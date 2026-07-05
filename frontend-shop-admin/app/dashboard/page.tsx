"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists, otherwise redirect to login
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/");
  };

  const openCreditPage = () => {
    router.push("/dashboard/add-credit");
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel" style={{ padding: '20px 30px' }}>
        <h2>Lithum Furniture <span style={{ color: 'var(--primary-color)' }}>Admin</span></h2>
        <div>
          <button onClick={() => router.push("/dashboard/history")} className="logout-btn" style={{ marginRight: '16px', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}>
            Credit History
          </button>
          <button onClick={openCreditPage} className="btn-primary" style={{ padding: '8px 16px', width: 'auto', marginRight: '16px' }}>
            + Add Credit
          </button>
          <button onClick={handleLogout} className="logout-btn">Log out</button>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px' }}>
        <h3 className="mb-4" style={{ fontSize: '1.5rem' }}>Providing Goods on Credit - Management</h3>
        <p className="text-secondary mb-4">
          Welcome to the dashboard. Here you can manage the shop's credit operations, view customer balances, and track payments.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--surface-border)', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ marginBottom: '10px' }}>Active Credits</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>12</p>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--surface-border)', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ marginBottom: '10px' }}>Total Outstanding</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error-color)' }}>LKR 45,200</p>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--surface-border)', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ marginBottom: '10px' }}>Recent Payments</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>LKR 8,500</p>
          </div>
        </div>
      </div>
    </div>
  );
}

