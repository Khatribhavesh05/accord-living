import React, { useEffect, useState } from 'react';
import { PageHeader, Card, StatusBadge, Button, StatCard } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { subscribeToAllBills, subscribeBillingStats, generateBill, deleteBill } from '../../firebase/billService';
import { subscribeToFlats } from '../../firebase/flatService';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Eye } from 'lucide-react';
import './BillManagement.css';

const BillManagement = () => {
    const toast = useToast();
    const { user } = useAuth();
    const societyId = user?.societyId;

    const [bills, setBills] = useState([]);
    const [flats, setFlats] = useState([]);
    const [stats, setStats] = useState({
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        billCount: 0,
        collectionPercentage: 0,
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModal, setViewModal] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [form, setForm] = useState({
        billMonth: new Date().toLocaleString('en-US', { month: '2-digit' }),
        billYear: new Date().getFullYear(),
        totalAmount: '',
        dueDate: '',
        description: '',
        targetFlat: 'all',
    });

    useEffect(() => {
        if (!societyId) return;

        const unsubBills = subscribeToAllBills(societyId, (data) => {
            setBills(data);
            setLoading(false);
        });
        const unsubStats = subscribeBillingStats(societyId, (statsData) => {
            setStats(statsData);
        });
        const unsubFlats = subscribeToFlats(societyId, (flatList) => {
            setFlats(flatList);
        });

        return () => {
            if (unsubBills) unsubBills();
            if (unsubStats) unsubStats();
            if (unsubFlats) unsubFlats();
        };
    }, [societyId]);

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!form.totalAmount || !form.dueDate) {
            toast.error('Please fill all required fields', 'Error');
            return;
        }

        setIsGenerating(true);
        try {
            await generateBill({
                billMonth: form.billMonth,
                billYear: form.billYear,
                totalAmount: parseInt(form.totalAmount, 10),
                dueDate: form.dueDate,
                description: form.description,
                flatNumber: form.targetFlat,
                payments: [],
                societyId,
            });
            const targetLabel = form.targetFlat === 'all' ? 'All Flats' : `Flat ${form.targetFlat}`;
            toast.success(`Bill for ${targetLabel} (${form.billMonth}/${form.billYear}) generated!`, 'Bill Created');
            setModalOpen(false);
            setForm({
                billMonth: new Date().toLocaleString('en-US', { month: '2-digit' }),
                billYear: new Date().getFullYear(),
                totalAmount: '',
                dueDate: '',
                description: '',
                targetFlat: 'all',
            });
        } catch (err) {
            toast.error('Failed to generate bill', 'Error');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (billId) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return;
        try {
            await deleteBill(billId);
            toast.success('Bill deleted successfully', 'Deleted');
        } catch (err) {
            toast.error('Failed to delete bill', 'Error');
        }
    };

    const getCollectionStats = (bill) => {
        const payments = bill.payments || [];
        const paidCount = payments.filter((p) => p.status === 'Paid').length;
        const totalTarget = bill.flatNumber && bill.flatNumber !== 'all'
            ? 1
            : Math.max(flats.length, paidCount);

        return {
            collected: paidCount,
            total: totalTarget,
            percentage: totalTarget > 0 ? Math.round((paidCount / totalTarget) * 100) : 0,
        };
    };

    return (
        <>
            <PageHeader
                title="Maintenance & Bills"
                subtitle="Manage billing cycles and track collections"
                action={<Button variant="primary" onClick={() => setModalOpen(true)}>+ Generate New Bill</Button>}
            />

            <div className="bill-stats-grid">
                <StatCard
                    label="Total Billed"
                    value={`₹ ${(stats.totalBilled / 100000).toFixed(1)}L`}
                    trend={stats.billCount}
                    trendLabel={`${stats.billCount} bills`}
                />
                <StatCard
                    label="Total Collected"
                    value={`₹ ${(stats.totalCollected / 100000).toFixed(1)}L`}
                    trend={stats.collectionPercentage}
                    trendLabel="collection %"
                />
                <StatCard
                    label="Pending Amount"
                    value={`₹ ${(stats.totalPending / 100000).toFixed(1)}L`}
                    trend={stats.totalBilled > 0 ? -Math.round((stats.totalPending / stats.totalBilled) * 100) : 0}
                    trendLabel="of total"
                />
            </div>

            <Card className="bill-card">
                <div className="bill-card-head">
                    <h3>Billing Cycles</h3>
                    <span className="bill-count">
                        {loading ? 'Loading...' : `${bills.length} bill${bills.length !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {loading ? (
                    <div className="bill-state">Loading bills...</div>
                ) : bills.length === 0 ? (
                    <div className="bill-state">No payments yet</div>
                ) : (
                    <div className="bill-table-container">
                        <table className="bill-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Flat</th>
                                    <th>Total Amount</th>
                                    <th>Collections</th>
                                    <th>Status</th>
                                    <th className="bill-actions-cell">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((bill) => {
                                    const collStats = getCollectionStats(bill);
                                    return (
                                        <tr key={bill.id} className="bill-table-row">
                                            <td className="bill-period-cell">{bill.billMonth}/{bill.billYear}</td>
                                            <td className="bill-flat-cell">{bill.flatNumber && bill.flatNumber !== 'all' ? `Flat ${bill.flatNumber}` : 'All Flats'}</td>
                                            <td className="bill-amount-cell">₹{bill.totalAmount.toLocaleString()}</td>
                                            <td>
                                                <div className="collection-cell">
                                                    <div className="collection-track">
                                                        <div className="collection-fill" style={{ width: `${collStats.percentage}%` }} />
                                                    </div>
                                                    <span className="collection-percentage">{collStats.percentage}%</span>
                                                </div>
                                            </td>
                                            <td><StatusBadge status={collStats.percentage === 100 ? 'Resolved' : 'Pending'} /></td>
                                            <td>
                                                <div className="bill-actions">
                                                    <button
                                                        onClick={() => setViewModal(bill)}
                                                        className="bill-icon-btn view"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(bill.id)}
                                                        className="bill-icon-btn delete"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={modalOpen} title="Generate New Bill" onClose={() => setModalOpen(false)}>
                <form className="modal-form" onSubmit={handleGenerate}>
                    <div className="form-group">
                        <label>Target Flat</label>
                        <select value={form.targetFlat} onChange={(e) => setForm({ ...form, targetFlat: e.target.value })}>
                            <option value="all">All Flats</option>
                            {flats.map((f) => (
                                <option key={f.id} value={f.flatNumber}>Flat {f.flatNumber}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Billing Month</label>
                        <select value={form.billMonth} onChange={(e) => setForm({ ...form, billMonth: e.target.value })} required>
                            <option value="01">January</option>
                            <option value="02">February</option>
                            <option value="03">March</option>
                            <option value="04">April</option>
                            <option value="05">May</option>
                            <option value="06">June</option>
                            <option value="07">July</option>
                            <option value="08">August</option>
                            <option value="09">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Billing Year</label>
                        <input type="number" value={form.billYear} onChange={(e) => setForm({ ...form, billYear: parseInt(e.target.value, 10) })} required />
                    </div>
                    <div className="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="e.g. 5000" required />
                    </div>
                    <div className="form-group">
                        <label>Due Date</label>
                        <input type="text" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} placeholder="e.g. 10 Mar 2026" required />
                    </div>
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Monthly maintenance + utilities" rows="3" />
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Generate Bill'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!viewModal} title={`Bill Details — ${viewModal?.billMonth}/${viewModal?.billYear}`} onClose={() => setViewModal(null)}>
                {viewModal && (() => {
                    const collStats = getCollectionStats(viewModal);
                    return (
                        <div className="bill-detail-stack">
                            <div className="bill-detail-grid">
                                <div className="bill-detail-item">
                                    <label>Period</label>
                                    <p>{viewModal.billMonth}/{viewModal.billYear}</p>
                                </div>
                                <div className="bill-detail-item">
                                    <label>Total Amount</label>
                                    <p className="strong">₹{viewModal.totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="bill-detail-item">
                                    <label>Due Date</label>
                                    <p>{viewModal.dueDate}</p>
                                </div>
                                <div className="bill-detail-item">
                                    <label>Target</label>
                                    <p>{viewModal.flatNumber && viewModal.flatNumber !== 'all' ? `Flat ${viewModal.flatNumber}` : 'All Flats'}</p>
                                </div>
                            </div>

                            {viewModal.description && (
                                <div className="bill-detail-item">
                                    <label>Description</label>
                                    <p className="muted">{viewModal.description}</p>
                                </div>
                            )}

                            <div className="bill-collection-note">
                                <p>
                                    <strong>{collStats.collected}</strong> out of <strong>{collStats.total}</strong> resident{collStats.total !== 1 ? 's' : ''} have paid - <strong>{collStats.percentage}%</strong> collected
                                </p>
                            </div>

                            {(viewModal.payments || []).length > 0 && (
                                <div>
                                    <label className="bill-sub-label">Payment Records</label>
                                    <div className="bill-payment-list">
                                        {viewModal.payments.map((p, i) => (
                                            <div key={i} className="bill-payment-row">
                                                <div>
                                                    <div className="bill-payment-name">{p.residentName || 'Resident'}</div>
                                                    <div className="bill-payment-flat">Flat {p.residentFlat || 'N/A'}</div>
                                                </div>
                                                <div className="bill-payment-right">
                                                    <div className="bill-payment-amount">₹{(p.amount || 0).toLocaleString()}</div>
                                                    <div className="bill-payment-date">{p.paidDate || '-'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>
        </>
    );
};

export default BillManagement;
