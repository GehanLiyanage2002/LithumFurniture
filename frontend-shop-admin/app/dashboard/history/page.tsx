"use client";

import { useEffect, useState, useMemo } from "react";
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

  // Search, Filter, and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
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

  // Filter and Paginate Data
  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      const matchesSearch = 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile1.includes(searchTerm) ||
        (c.mobile2 && c.mobile2.includes(searchTerm));
      
      const matchesStatus = filterStatus === "ALL" ? true : (c.status || "ACTIVE") === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [credits, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredCredits.length / itemsPerPage);
  const paginatedCredits = filteredCredits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel" style={{ padding: '20px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push("/dashboard")} className="logout-btn" style={{ padding: '8px 16px' }}>&larr; Back</button>
          <h2 style={{ margin: 0 }}>Lithum Furniture <span style={{ color: 'var(--primary-color)' }}>Admin</span></h2>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>Credit History</h3>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search Name, NIC, or Mobile..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', outline: 'none', minWidth: '250px' }}
            />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', outline: 'none', background: '#fff' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Customer Name</th>
                    <th style={{ padding: '12px 16px' }}>Contact</th>
                    <th style={{ padding: '12px 16px' }}>Product</th>
                    <th style={{ padding: '12px 16px' }}>Balance (LKR)</th>
                    <th style={{ padding: '12px 16px' }}>Duration & Int.</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCredits.map((credit) => {
                    const remaining = Number(credit.totalPayment) - Number(credit.paidAmount || 0);
                    return (
                    <tr key={credit.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(credit.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 'bold' }}>{credit.firstName} {credit.lastName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NIC: {credit.nic}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.9rem' }}>{credit.mobile1}</div>
                        {credit.mobile2 && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{credit.mobile2}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{credit.productName}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total: {Number(credit.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--error-color)' }}>Left: {remaining.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>Next: {Number(credit.monthlyInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})} / mo</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{credit.months} months</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{credit.interestRate}% Interest</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--success-color)' }}>{credit.paymentsMade || 0} payments made</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: credit.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: credit.status === 'COMPLETED' ? 'var(--success-color)' : 'var(--primary-color)' }}>
                          {credit.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(credit.status === 'ACTIVE' || !credit.status) && (
                          <>
                            <button 
                              onClick={() => openPayModal(credit)}
                              style={{ padding: '6px 12px', background: 'var(--primary-color)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                              Make Payment
                            </button>
                            <button 
                              onClick={() => { setSettleTargetId(credit.id); setActualMonths(credit.months.toString()); setSettleModalOpen(true); }}
                              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '6px', cursor: 'pointer' }}>
                              Settle Early
                            </button>
                          </>
                        )}
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
        <>
          <div className="slide-panel-overlay open" onClick={() => setSettleModalOpen(false)} />
          <div className="modal-panel open" style={{ maxWidth: '400px' }}>
            <div className="modal-panel-header">
              <h3>Early Settlement</h3>
              <button className="close-btn" onClick={() => setSettleModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-panel-content">
              <p className="text-secondary mb-4">Enter the actual number of months it took to complete the payment. The interest will be recalculated based on this duration.</p>
              <form onSubmit={handleSettle}>
                <div className="input-group">
                  <label>Actual Months Completed</label>
                  <input required type="number" min="1" max="10" className="input-field" value={actualMonths} onChange={e => setActualMonths(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setSettleModalOpen(false)} className="logout-btn" style={{ marginRight: '10px' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={settleLoading}>
                    {settleLoading ? "Processing..." : "Recalculate & Settle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {payModalOpen && payTargetCredit && (
        <>
          <div className="slide-panel-overlay open" onClick={() => setPayModalOpen(false)} />
          <div className="modal-panel open" style={{ maxWidth: '500px' }}>
            <div className="modal-panel-header">
              <h3>Monthly Installment Payment</h3>
              <button className="close-btn" onClick={() => setPayModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-panel-content">
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Total Payable:</span> 
                  <strong>LKR {Number(payTargetCredit.totalPayment).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </p>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Total Paid:</span> 
                  <strong style={{ color: 'var(--success-color)' }}>LKR {Number(payTargetCredit.paidAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </p>
                <p style={{ margin: '0', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Remaining Balance:</span> 
                  <strong style={{ color: 'var(--error-color)' }}>LKR {(Number(payTargetCredit.totalPayment) - Number(payTargetCredit.paidAmount || 0)).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>
                </p>
              </div>

              {paymentsHistory.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Payment History</h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <tbody>
                        {paymentsHistory.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '8px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: 'var(--success-color)', fontWeight: 'bold' }}>+ LKR {Number(p.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <form onSubmit={handlePay}>
                <div className="input-group">
                  <label>Months Covered by this Payment</label>
                  <input required type="number" min="1" max="10" className="input-field" value={payMonthsCovered} onChange={e => handleMonthsCoveredChange(e.target.value)} />
                  <small className="text-secondary" style={{ marginTop: '4px', display: 'block' }}>If they skipped a month, set this to 2 to record that this payment covers 2 months.</small>
                </div>
                <div className="input-group">
                  <label>Amount Paying Now (LKR)</label>
                  <input required type="number" step="0.01" max={(Number(payTargetCredit.totalPayment) - Number(payTargetCredit.paidAmount || 0)).toString()} className="input-field" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                  <small className="text-secondary" style={{ marginTop: '4px', display: 'block' }}>If customer pays extra, future monthly amounts will automatically recalculate.</small>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setPayModalOpen(false)} className="logout-btn" style={{ marginRight: '10px' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={payLoading}>
                    {payLoading ? "Processing..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
