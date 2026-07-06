"use client";

import { useEffect, useState } from "react";
import { useRouter } from "../../../i18n/routing";
import { useTranslations } from "next-intl";
import { 
  PlusCircle, 
  History, 
  TrendingUp, 
  Users, 
  Package,
  CreditCard,
  ArrowRight,
  Clock,
  Banknote
} from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('Dashboard');

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeCredits, setActiveCredits] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      try {
        const [salesRes, creditsRes, productsRes, suppliersRes] = await Promise.all([
          fetch("http://localhost:4000/cash-sales", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("http://localhost:4000/credits", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("http://localhost:4000/products", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("http://localhost:4000/suppliers", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        const sales = salesRes.ok ? await salesRes.json() : [];
        const credits = creditsRes.ok ? await creditsRes.json() : [];
        const products = productsRes.ok ? await productsRes.json() : [];
        const suppliers = suppliersRes.ok ? await suppliersRes.json() : [];

        // Compute Total Revenue
        let revenue = 0;
        sales.forEach((s: any) => revenue += Number(s.totalPrice || 0));
        credits.forEach((c: any) => revenue += (Number(c.downPayment || 0) + Number(c.paidAmount || 0)));
        setTotalRevenue(revenue);

        // Compute Active Credits
        const active = credits.filter((c: any) => c.status !== 'COMPLETED').length;
        setActiveCredits(active);

        // Compute Totals
        setTotalProducts(products.length);
        setTotalSuppliers(suppliers.length);

        // Assemble Recent Activity
        const activities = [];
        sales.forEach((s: any) => activities.push({
          action: 'Cash Sale',
          desc: `${s.productName} - LKR ${Number(s.totalPrice).toLocaleString()}`,
          time: new Date(s.createdAt),
          icon: Banknote,
          color: 'var(--success)',
          bg: 'rgba(5, 150, 105, 0.1)'
        }));
        
        credits.forEach((c: any) => activities.push({
          action: 'New Credit Record',
          desc: `${c.firstName} ${c.lastName} - ${c.productName}`,
          time: new Date(c.createdAt),
          icon: PlusCircle,
          color: 'var(--primary)',
          bg: 'var(--primary-light)'
        }));

        activities.sort((a, b) => b.time.getTime() - a.time.getTime());
        setRecentActivities(activities.slice(0, 4));

      } catch (err) {
        console.error("Dashboard fetch error", err);
      }
    };
    fetchData();
  }, []);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

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
            {t('welcome_title')}
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
            {t('welcome_subtitle')}
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
          { title: t('total_revenue') || 'Total Revenue', value: `LKR ${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: TrendingUp, trend: t('active') || 'Updated', trendUp: true },
          { title: t('active_credits') || 'Active Credits', value: activeCredits.toString(), icon: CreditCard, trend: t('active') || 'Active', trendUp: true },
          { title: t('total_products') || 'Total Products', value: totalProducts.toString(), icon: Package, trend: t('active') || 'Active', trendUp: true },
          { title: t('total_suppliers') || 'Total Suppliers', value: totalSuppliers.toString(), icon: Users, trend: t('active') || 'Active', trendUp: true }
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
              <span className="text-secondary">{t('recently')}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* Quick Actions (Primary Focus) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t('core_operations')}
          </h2>
          
          <div className="card" style={{ position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
                <PlusCircle size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', fontWeight: 700 }}>{t('provide_goods_credit')}</h3>
                <p className="text-secondary" style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {t('provide_goods_credit_desc')}
                </p>
                <button className="btn-primary" onClick={() => router.push("/dashboard/add-credit")}>
                  <PlusCircle size={18} /> {t('new_credit_record')}
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
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', fontWeight: 700 }}>{t('credit_history')}</h3>
                <p className="text-secondary" style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {t('credit_history_desc')}
                </p>
                <button className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => router.push("/dashboard/history")}>
                  <History size={18} /> {t('view_history')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity / Secondary Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t('recent_activity')}
            </h2>
            <button style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none' }}>
              {t('view_all')} <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recentActivities.length > 0 ? (
                recentActivities.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: i !== recentActivities.length - 1 ? '16px' : '0', borderBottom: i !== recentActivities.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ padding: '12px', background: item.bg, color: item.color, borderRadius: '50%' }}>
                      <item.icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.action}</h4>
                      <p className="text-secondary" style={{ margin: 0, fontSize: '0.875rem' }}>{item.desc}</p>
                    </div>
                    <span className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{timeAgo(item.time)}</span>
                  </div>
                ))
              ) : (
                <p className="text-secondary">{t('no_recent_activity') || 'No recent activity found.'}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
