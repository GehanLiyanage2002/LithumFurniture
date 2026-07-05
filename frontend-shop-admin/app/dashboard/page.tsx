"use client";

import { useRouter } from "next/navigation";
import { 
  PlusCircle, 
  History, 
  TrendingUp, 
  Users, 
  Package,
  CreditCard,
  ArrowRight,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px',
        color: 'white',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Welcome back to Lithum Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
            Here's what's happening with your store today. Manage credits, track inventory, and monitor your business growth all in one place.
          </p>
        </div>
        {/* Decorative background element */}
        <div style={{
          position: 'absolute',
          right: '-10%',
          top: '-30%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[
          { title: "Total Revenue", value: "Rs. 1,250,000", icon: TrendingUp, trend: "+12.5%", trendUp: true },
          { title: "Active Credits", value: "45", icon: CreditCard, trend: "3 due this week", trendUp: false },
          { title: "Total Products", value: "320", icon: Package, trend: "+12 new", trendUp: true },
          { title: "Total Suppliers", value: "24", icon: Users, trend: "Active", trendUp: true }
        ].map((stat, index) => (
          <div key={index} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.title}
                </p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                  {stat.value}
                </h3>
              </div>
              <div style={{ padding: '12px', background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
                <stat.icon size={24} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: stat.trendUp ? 'var(--success)' : 'var(--warning)' }}>
              <TrendingUp size={16} style={{ transform: stat.trendUp ? 'none' : 'rotate(180deg)' }}/>
              <span style={{ fontWeight: 600 }}>{stat.trend}</span>
              <span className="text-secondary">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* Quick Actions (Primary Focus) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Core Operations
          </h2>
          
          <div className="card" style={{ position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
                <PlusCircle size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', fontWeight: 700 }}>Provide Goods on Credit</h3>
                <p className="text-secondary" style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Create a new credit record for a customer, calculate installments, and log their details.
                </p>
                <button className="btn-primary" onClick={() => router.push("/dashboard/add-credit")}>
                  <PlusCircle size={18} /> New Credit Record
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ position: 'relative', overflow: 'hidden', borderLeft: '4px solid #9CA3AF' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ background: '#F3F4F6', padding: '16px', borderRadius: 'var(--radius-lg)', color: '#4B5563' }}>
                <History size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', fontWeight: 700 }}>Credit History</h3>
                <p className="text-secondary" style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  View past credit transactions, manage monthly payments, and calculate early settlements.
                </p>
                <button className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => router.push("/dashboard/history")}>
                  <History size={18} /> View History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity / Secondary Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Recent Activity
            </h2>
            <button style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none' }}>
              View All <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { action: 'Payment Received', desc: 'Rs. 15,000 from Kamal Perera', time: '2 hours ago', icon: CreditCard, color: 'var(--success)', bg: 'rgba(5, 150, 105, 0.1)' },
                { action: 'New Credit Record', desc: 'Sofa Set - Rs. 120,000', time: '5 hours ago', icon: PlusCircle, color: 'var(--primary)', bg: 'var(--primary-light)' },
                { action: 'Stock Updated', desc: 'Added 5 Teak Dining Tables', time: '1 day ago', icon: Package, color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.1)' },
                { action: 'Payment Overdue', desc: 'Nimal Silva - Rs. 8,000', time: '2 days ago', icon: Clock, color: 'var(--error)', bg: 'rgba(220, 38, 38, 0.1)' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: i !== 3 ? '16px' : '0', borderBottom: i !== 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding: '12px', background: item.bg, color: item.color, borderRadius: '50%' }}>
                    <item.icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.action}</h4>
                    <p className="text-secondary" style={{ margin: 0, fontSize: '0.875rem' }}>{item.desc}</p>
                  </div>
                  <span className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
