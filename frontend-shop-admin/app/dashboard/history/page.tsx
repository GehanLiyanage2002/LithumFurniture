"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle, Search, Filter, History, User, Phone, CreditCard as IdCard } from "lucide-react";

interface Credit {
  id: string;
  firstName: string;
  lastName: string;
  nic: string;
  nicFrontImage?: string;
  nicRearImage?: string;
  customerFaceImage?: string;
  mobile1: string;
  mobile2: string;
  productName: string;
  downPayment: number;
  interestRate: number;
  months: number;
  totalPayment: number;
  monthlyInstallment: number;
  paidAmount: number;
  paymentsMade: number;
  createdAt: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  createdAt: string;
}

export default function CreditHistoryPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleTargetId, setSettleTargetId] = useState("");
  const [actualMonths, setActualMonths] = useState("1");
  const [settleLoading, setSettleLoading] = useState(false);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTargetCredit, setPayTargetCredit] = useState<Credit | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMonthsCovered, setPayMonthsCovered] = useState("1");
  const [payLoading, setPayLoading] = useState(false);
  const [paymentsHistory, setPaymentsHistory] = useState<Payment[]>([]);

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTargetCredit, setProfileTargetCredit] = useState<Credit | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Search, Filter, and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:4000/credits", {
        headers: { "Authorization": `Bearer ${token}` }
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

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchHistory();
  }, [router]);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettleLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`http://localhost:4000/credits/${settleTargetId}/recalculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ actualMonths: parseInt(actualMonths, 10) })
      });
      if (!res.ok) throw new Error("Failed to recalculate and settle");
      
      setSettleModalOpen(false);
      fetchHistory(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSettleLoading(false);
    }
  };

  const openPayModal = async (credit: Credit) => {
    setPayTargetCredit(credit);
    setPayAmount(credit.monthlyInstallment.toString());
    setPayMonthsCovered("1");
    setPayModalOpen(true);
    
    // Fetch payment history
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://localhost:4000/credits/${credit.id}/payments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPaymentsHistory(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMonthsCoveredChange = (val: string) => {
    setPayMonthsCovered(val);
    if (payTargetCredit) {
      const m = parseInt(val, 10) || 1;
      setPayAmount((payTargetCredit.monthlyInstallment * m).toString());
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTargetCredit) return;
    setPayLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`http://localhost:4000/credits/${payTargetCredit.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: parseFloat(payAmount),
          monthsCovered: parseInt(payMonthsCovered, 10) || 1
        })
      });
      if (!res.ok) throw new Error("Failed to record payment");
      
      setPayModalOpen(false);
      fetchHistory(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const openProfileModal = (credit: Credit) => {
    setProfileTargetCredit(credit);
    setProfileModalOpen(true);
  };

  // Filter and Paginate Data
  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      const matchesSearch = c.nic.toLowerCase().includes(searchTerm.toLowerCase()) || c.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || (c.status || "ACTIVE") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [credits, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCredits.length / itemsPerPage);
  const currentCredits = filteredCredits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Credit History</h1>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search by NIC or Product..." 
                className="input-field" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', marginBottom: 0 }}
              />
            </div>
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <select 
                className="input-field" 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ paddingLeft: '40px', marginBottom: 0 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <p>Loading history...</p>
        ) : error ? (
          <p className="text-error">{error}</p>
        ) : filteredCredits.length === 0 ? (
          <p className="text-secondary">No credit records match your search criteria.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '16px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Customer & Contact</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Product</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Financials (LKR)</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCredits.map((credit) => {
                    return (
                    <tr key={credit.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{credit.firstName} {credit.lastName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>NIC: {credit.nic}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mob: {credit.mobile1} {credit.mobile2 ? `/ ${credit.mobile2}` : ''}</div>
                        {credit.customerFaceImage && (
                          <div style={{ display: 'inline-block', marginTop: '6px', background: '#ECFDF5', color: '#065F46', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #A7F3D0' }}>
                            👤 Face Captured
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{credit.productName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Months: {credit.months}</div>
                        {credit.billNo && (
                          <div style={{ fontSize: '0.85rem', marginTop: '4px', background: '#F3F4F6', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>
                            Bill: {credit.billNo}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.85rem' }}>Total: {Number(credit.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Paid: {Number(credit.paidAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <div style={{ fontWeight: '700', color: 'var(--error)' }}>
                          Due: {Math.max(0, Number(credit.totalPayment) - Number(credit.paidAmount || 0)).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </div>
                        {credit.status === 'ACTIVE' && (
                          <div style={{ fontSize: '0.85rem', marginTop: '4px', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', color: '#92400E' }}>
                            Next Installment: {Number(credit.monthlyInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <span className={(credit.status || 'ACTIVE') === 'COMPLETED' ? 'badge badge-success' : 'badge badge-primary'}>
                          {credit.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top', textAlign: 'right' }}>
                        {(credit.status === 'ACTIVE' || !credit.status || credit.status === 'PENDING') && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button 
                              onClick={() => openPayModal(credit)}
                              className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                              <CreditCard size={14} style={{ marginRight: '6px' }} /> Pay
                            </button>
                            <button 
                              onClick={() => { setSettleTargetId(credit.id); setActualMonths(credit.months.toString()); setSettleModalOpen(true); }}
                              className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.85rem', color: 'var(--success)', borderColor: 'var(--success)' }}>
                              <CheckCircle size={14} /> Settle
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => openProfileModal(credit)} className="btn-outline" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                            <User size={14} style={{ marginRight: '6px' }} /> Info
                          </button>
                          <button onClick={() => openPayModal(credit)} className="btn-outline" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                            <History size={14} style={{ marginRight: '6px' }} /> History
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--surface-border)' }}>
                <span className="text-secondary">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCredits.length)} of {filteredCredits.length} entries
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '8px 16px', background: currentPage === 1 ? 'rgba(0,0,0,0.05)' : '#fff', border: '1px solid var(--surface-border)', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '8px 16px', background: currentPage === totalPages ? 'rgba(0,0,0,0.05)' : '#fff', border: '1px solid var(--surface-border)', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {settleModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSettleModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Early Settlement</h3>
              <button className="close-btn" onClick={() => setSettleModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-secondary mb-4">Enter the actual number of months it took to complete the payment. The interest will be recalculated based on this duration.</p>
              <form onSubmit={handleSettle}>
                <div className="input-group">
                  <label>Actual Months Completed</label>
                  <input required type="number" min="1" max="10" className="input-field" value={actualMonths} onChange={e => setActualMonths(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                  <button type="button" onClick={() => setSettleModalOpen(false)} className="btn-outline">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={settleLoading}>
                    {settleLoading ? "Processing..." : "Recalculate & Settle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {payModalOpen && payTargetCredit && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPayModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>Monthly Installment Payment</h3>
              <button className="close-btn" onClick={() => setPayModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 12px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Total Payable:</span> 
                  <strong style={{ fontSize: '1.1rem' }}>LKR {Number(payTargetCredit.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </p>
                <p style={{ margin: '0 0 12px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Total Paid:</span> 
                  <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>LKR {Number(payTargetCredit.paidAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </p>
                <p style={{ margin: '0', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Remaining Balance:</span> 
                  <strong style={{ color: 'var(--error)', fontSize: '1.2rem' }}>LKR {(Number(payTargetCredit.totalPayment) - Number(payTargetCredit.paidAmount || 0)).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </p>
              </div>

              {paymentsHistory.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)' }}>Payment History</h4>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <tbody>
                        {paymentsHistory.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--success)', fontWeight: '600' }}>+ LKR {Number(p.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(payTargetCredit.status || 'ACTIVE') !== 'COMPLETED' ? (
                <form onSubmit={handlePay}>
                  <div className="input-group">
                    <label>Months Covered by this Payment</label>
                    <input required type="number" min="1" max="10" className="input-field" value={payMonthsCovered} onChange={e => handleMonthsCoveredChange(e.target.value)} />
                    <small className="text-secondary" style={{ marginTop: '6px', display: 'block', fontSize: '0.8rem' }}>If they skipped a month, set this to 2 to record that this payment covers 2 months.</small>
                  </div>
                  <div className="input-group">
                    <label>Amount Paying Now (LKR)</label>
                    <input required type="number" step="0.01" max={(Number(payTargetCredit.totalPayment) - Number(payTargetCredit.paidAmount || 0)).toString()} className="input-field" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                    <small className="text-secondary" style={{ marginTop: '6px', display: 'block', fontSize: '0.8rem' }}>If customer pays extra, future monthly amounts will automatically recalculate.</small>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '12px' }}>
                    <button type="button" onClick={() => setPayModalOpen(false)} className="btn-outline">Cancel</button>
                    <button type="submit" className="btn-primary" disabled={payLoading}>
                      {payLoading ? "Processing..." : "Confirm Payment"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', background: '#F0FDF4', borderRadius: '12px', color: '#166534', border: '1px solid #BBF7D0' }}>
                  <strong style={{ fontSize: '1.1rem' }}>🎉 This credit plan has been fully completed!</strong>
                  <p style={{ margin: '8px 0 0 0', color: '#15803D', fontSize: '0.9rem' }}>No further payments are required.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {profileModalOpen && profileTargetCredit && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setProfileModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Customer Information</h3>
              <button className="close-btn" onClick={() => setProfileModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name</span>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginTop: '4px' }}>{profileTargetCredit.firstName} {profileTargetCredit.lastName}</div>
                </div>
                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>National ID (NIC)</span>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                    <IdCard size={18} style={{ marginRight: '8px', color: 'var(--primary)' }} /> {profileTargetCredit.nic}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Contact Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Phone size={18} style={{ marginRight: '12px', color: 'var(--text-secondary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mobile 1</div>
                    <div style={{ fontWeight: '500' }}>{profileTargetCredit.mobile1}</div>
                  </div>
                </div>
                {profileTargetCredit.mobile2 && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Phone size={18} style={{ marginRight: '12px', color: 'var(--text-secondary)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mobile 2</div>
                      <div style={{ fontWeight: '500' }}>{profileTargetCredit.mobile2}</div>
                    </div>
                  </div>
                )}
              </div>

              <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Customer Images</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Customer Face</strong>
                  {profileTargetCredit.customerFaceImage ? (
                    <img src={profileTargetCredit.customerFaceImage} onClick={() => setZoomedImage(profileTargetCredit.customerFaceImage!)} style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} alt="Face" />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Not Provided</span>
                  )}
                </div>

                <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', marginBottom: '8px' }}>NIC Front</strong>
                  {profileTargetCredit.nicFrontImage ? (
                    <img src={profileTargetCredit.nicFrontImage} onClick={() => setZoomedImage(profileTargetCredit.nicFrontImage!)} style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} alt="NIC Front" />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Not Provided</span>
                  )}
                </div>

                <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', marginBottom: '8px' }}>NIC Rear</strong>
                  {profileTargetCredit.nicRearImage ? (
                    <img src={profileTargetCredit.nicRearImage} onClick={() => setZoomedImage(profileTargetCredit.nicRearImage!)} style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} alt="NIC Rear" />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Not Provided</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div 
          className="modal-overlay" 
          onClick={() => setZoomedImage(null)} 
          style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button 
              onClick={() => setZoomedImage(null)} 
              style={{ position: 'absolute', top: '-40px', right: '-10px', background: 'transparent', color: 'white', border: 'none', fontSize: '2rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            <img src={zoomedImage} alt="Zoomed" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
