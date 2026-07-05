"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, PlusCircle, Trash2, Package } from "lucide-react";
import Swal from 'sweetalert2';

interface Supplier {
  id: string;
  companyName: string;
}

interface Product {
  id: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  category: string;
  supplierName: string;
}

export default function ManageSuppliersPage() {
  const router = useRouter();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [addSupplierLoading, setAddSupplierLoading] = useState(false);

  const [supplierName, setSupplierName] = useState("");
  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [addProductLoading, setAddProductLoading] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/");
        return;
      }
      
      const [suppRes, prodRes] = await Promise.all([
        fetch("http://localhost:4000/suppliers", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/products", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (suppRes.ok) setSuppliers(await suppRes.json());
      if (prodRes.ok) {
        const allProds: Product[] = await prodRes.json();
        setProducts(allProds.filter(p => p.category === 'SUPPLIER'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSupplierLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("http://localhost:4000/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ companyName }),
      });
      if (!res.ok) throw new Error("Failed to add supplier");
      setCompanyName("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddSupplierLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Supplier?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem("admin_token");
    await fetch(`http://localhost:4000/suppliers/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchData();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName) {
      alert("Please select a supplier");
      return;
    }
    setAddProductLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("http://localhost:4000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          productName,
          unitPrice: parseFloat(unitPrice) || 0,
          costPrice: parseFloat(costPrice) || 0,
          quantity: parseInt(quantity, 10) || 0,
          category: 'SUPPLIER',
          supplierName
        }),
      });
      if (!res.ok) throw new Error("Failed to add product");
      setProductName("");
      setUnitPrice("");
      setCostPrice("");
      setQuantity("1");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddProductLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem("admin_token");
    await fetch(`http://localhost:4000/products/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Suppliers & Stocks</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Suppliers Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
            <Truck size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Supplier Companies</h3>
          </div>
          
          <form onSubmit={handleAddSupplier} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input required type="text" className="input-field" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name (e.g. Damro)" style={{ marginBottom: 0, flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={addSupplierLoading}>
              <PlusCircle size={16} /> Add
            </button>
          </form>

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td style={{ padding: '16px', color: 'var(--text-secondary)' }}>No suppliers added yet.</td></tr>
                ) : suppliers.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{s.companyName}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteSupplier(s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Supplier Product Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
            <Package size={24} style={{ marginRight: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Add Supplier Stock</h3>
          </div>
          <form onSubmit={handleAddProduct}>
            <div className="input-group">
              <label>Select Supplier <span style={{ color: 'var(--error)' }}>*</span></label>
              <select required className="input-field" value={supplierName} onChange={e => setSupplierName(e.target.value)}>
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.companyName}>{s.companyName}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Product Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="text" className="input-field" value={productName} onChange={e => setProductName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Cost Price <span style={{ color: 'var(--error)' }}>*</span></label>
                <input required type="number" min="0" step="0.01" className="input-field" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Selling Price <span style={{ color: 'var(--error)' }}>*</span></label>
                <input required type="number" min="0" step="0.01" className="input-field" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label>Initial Quantity <span style={{ color: 'var(--error)' }}>*</span></label>
              <input required type="number" min="1" className="input-field" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={addProductLoading}>
              {addProductLoading ? "Adding..." : "Add to Stock"}
            </button>
          </form>
        </div>
      </div>

      {/* Supplier Stock List */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--primary)' }}>Supplier Inventory</h3>
        {products.length === 0 ? (
          <p className="text-secondary">No supplier products in stock.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px' }}>Supplier</th>
                  <th style={{ padding: '12px 16px' }}>Product Name</th>
                  <th style={{ padding: '12px 16px' }}>Cost / Selling Price</th>
                  <th style={{ padding: '12px 16px' }}>Quantity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px', fontWeight: '500' }}>
                      <span style={{ background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{p.supplierName}</span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{p.productName}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cost: {Number(p.costPrice).toLocaleString()}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: '600' }}>Sell: {Number(p.unitPrice).toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${p.quantity > 5 ? 'badge-success' : 'badge-primary'}`} style={{ background: p.quantity <= 5 ? 'rgba(220, 38, 38, 0.1)' : undefined, color: p.quantity <= 5 ? 'var(--error)' : undefined }}>
                        {p.quantity} in stock
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </td>
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
