"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, History, LogOut, Package, ShoppingCart, BarChart3, Truck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            Dashboard Home
          </Link>
          <Link href="/dashboard/cashier" className={`nav-item ${pathname === "/dashboard/cashier" ? "active" : ""}`}>
            <ShoppingCart size={18} style={{ marginRight: '10px' }} />
            Cashier (Direct Sale)
          </Link>
          <Link href="/dashboard/manage-stock" className={`nav-item ${pathname === "/dashboard/manage-stock" ? "active" : ""}`}>
            <Package size={18} style={{ marginRight: '10px' }} />
            Manage Stock
          </Link>
          <Link href="/dashboard/manage-suppliers" className={`nav-item ${pathname === "/dashboard/manage-suppliers" ? "active" : ""}`}>
            <Truck size={18} style={{ marginRight: '10px' }} />
            Suppliers
          </Link>
          <Link href="/dashboard/analytics" className={`nav-item ${pathname === "/dashboard/analytics" ? "active" : ""}`}>
            <BarChart3 size={18} style={{ marginRight: '10px' }} />
            Sales & Analytics
          </Link>
          <Link href="/dashboard/add-credit" className={`nav-item ${pathname === "/dashboard/add-credit" ? "active" : ""}`}>
            <PlusCircle size={18} style={{ marginRight: '10px' }} />
            Add Credit Record
          </Link>
          <Link href="/dashboard/history" className={`nav-item ${pathname === "/dashboard/history" ? "active" : ""}`}>
            <History size={18} style={{ marginRight: '10px' }} />
            Credit History
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LogOut size={18} style={{ marginRight: '10px', color: '#EF4444' }} />
            <span style={{ color: '#EF4444' }}>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
