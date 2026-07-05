"use client";

import { useRouter } from "next/navigation";
import { PlusCircle, History } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome to Lithum Dashboard</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Quick Actions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
            <PlusCircle size={28} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Provide Goods on Credit</h3>
          </div>
          <p className="text-secondary mb-4">Create a new credit record for a customer, calculate installments, and log their details.</p>
          <button className="btn-primary" onClick={() => router.push("/dashboard/add-credit")}>
            <PlusCircle size={18} /> Add New Credit Record
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
            <History size={28} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Credit History</h3>
          </div>
          <p className="text-secondary mb-4">View past credit transactions, manage monthly payments, and calculate early settlements.</p>
          <button className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => router.push("/dashboard/history")}>
            <History size={18} /> View History
          </button>
        </div>

      </div>
    </div>
  );
}
