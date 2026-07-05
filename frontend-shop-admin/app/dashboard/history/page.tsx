"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Credit {
  id: string;
  firstName: string;
  lastName: string;
  nic: string;
  mobile1: string;
  mobile2: string;
  productName: string;
  downPayment: number;
  interestRate: number;
  months: number;
  totalPayment: number;
  monthlyInstallment: number;
  createdAt: string;
}

export default function CreditHistoryPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:4000/credits", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setCredits(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel" style={{ padding: '20px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push("/dashboard")} className="logout-btn" style={{ padding: '8px 16px' }}>&larr; Back</button>
          <h2 style={{ margin: 0 }}>Lithum Furniture <span style={{ color: 'var(--primary-color)' }}>Admin</span></h2>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px' }}>
        <h3 className="mb-4" style={{ fontSize: '1.8rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>Credit History</h3>
        
        {loading ? (
          <p>Loading history...</p>
        ) : error ? (
          <p className="text-error">{error}</p>
        ) : credits.length === 0 ? (
          <p className="text-secondary">No credit records found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Customer Name</th>
                  <th style={{ padding: '12px 16px' }}>NIC</th>
                  <th style={{ padding: '12px 16px' }}>Contact</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Total (LKR)</th>
                  <th style={{ padding: '12px 16px' }}>Monthly (LKR)</th>
                  <th style={{ padding: '12px 16px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(credit.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>{credit.firstName} {credit.lastName}</td>
                    <td style={{ padding: '12px 16px' }}>{credit.nic}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.9rem' }}>{credit.mobile1}</div>
                      {credit.mobile2 && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{credit.mobile2}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{credit.productName}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {Number(credit.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {Number(credit.monthlyInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{credit.months} mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
