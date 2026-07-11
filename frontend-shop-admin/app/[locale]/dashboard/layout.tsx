"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, History, LogOut, Package, ShoppingCart, BarChart3, Truck, Wrench } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const t = useTranslations('Sidebar');

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.push("/");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    router.push("/");
  };

  if (loading) return null;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Lithum <span>Furniture</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link href="/dashboard" className={`nav-item ${pathname === "/dashboard" ? "active" : ""}`}>
            <LayoutDashboard size={18} style={{ marginRight: '10px' }} />
            {t('dashboard')}
          </Link>
          <Link href="/dashboard/cashier" className={`nav-item ${pathname === "/dashboard/cashier" ? "active" : ""}`}>
            <ShoppingCart size={18} style={{ marginRight: '10px' }} />
            {t('cashier')}
          </Link>
          <Link href="/dashboard/manage-stock" className={`nav-item ${pathname === "/dashboard/manage-stock" ? "active" : ""}`}>
            <Package size={18} style={{ marginRight: '10px' }} />
            {t('shop_stock')}
          </Link>
          <Link href="/dashboard/workshop-stock" className={`nav-item ${pathname === "/dashboard/workshop-stock" ? "active" : ""}`}>
            <Wrench size={18} style={{ marginRight: '10px' }} />
            {t('workshop_stock')}
          </Link>
          <Link href="/dashboard/manage-suppliers" className={`nav-item ${pathname === "/dashboard/manage-suppliers" ? "active" : ""}`}>
            <Truck size={18} style={{ marginRight: '10px' }} />
            {t('suppliers')}
          </Link>
          <Link href="/dashboard/analytics" className={`nav-item ${pathname === "/dashboard/analytics" ? "active" : ""}`}>
            <BarChart3 size={18} style={{ marginRight: '10px' }} />
            {t('analytics')}
          </Link>
          <Link href="/dashboard/add-credit" className={`nav-item ${pathname === "/dashboard/add-credit" ? "active" : ""}`}>
            <PlusCircle size={18} style={{ marginRight: '10px' }} />
            {t('add_credit')}
          </Link>
          <Link href="/dashboard/history" className={`nav-item ${pathname === "/dashboard/history" ? "active" : ""}`}>
            <History size={18} style={{ marginRight: '10px' }} />
            {t('credit_history')}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LogOut size={18} style={{ marginRight: '10px', color: '#EF4444' }} />
            <span style={{ color: '#EF4444' }}>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 50 }}>
          <LanguageSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}
