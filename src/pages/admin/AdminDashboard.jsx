import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2, Users, IndianRupee, CreditCard, AlertTriangle, TrendingUp, TrendingDown,
    Wrench, Zap, Volume2, CheckCircle2, Clock3, Plus, Download,
    UserPlus, BellRing, ReceiptText
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { subscribeToFlats } from '../../firebase/flatService';
import { subscribeToResidents } from '../../firebase/residentService';
import { subscribeBillingStats, subscribeToAllBills } from '../../firebase/billService';
import { subscribeToAllComplaints } from '../../firebase/complaintService';
import { subscribeToAnnouncements } from '../../firebase/announcementService';
import { subscribeToTodayAttendance } from '../../firebase/attendanceService';
import { subscribeToActiveEmergencies } from '../../firebase/emergencyService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import '../../styles/AdminDashboard.css';

const LAST_SIX_MONTHS = 6;

const quickActions = [
    { label: 'Add Resident', icon: UserPlus, path: '/admin/residents' },
    { label: 'Create Notice', icon: BellRing, path: '/admin/notices' },
    { label: 'Generate Bill', icon: ReceiptText, path: '/admin/maintenance' },
    { label: 'Track Complaints', icon: AlertTriangle, path: '/admin/complaints' },
];

const SkeletonCard = ({ className = '' }) => <div className={`admin-skeleton ${className}`} />;

const parsePaidDate = (value) => {
    if (!value) return null;
    if (value?.toDate) return value.toDate();
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;

        const match = value.match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{4})$/);
        if (match) {
            const day = Number(match[1]);
            const mon = match[2].toLowerCase();
            const year = Number(match[3]);
            const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(mon);
            if (monthIndex >= 0) {
                return new Date(year, monthIndex, day);
            }
        }
    }

    return null;
};

const formatRelativeTime = (value) => {
    const date = parsePaidDate(value);
    if (!date) return 'Just now';

    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const formatTimeOfDay = (value) => {
    const date = parsePaidDate(value);
    if (!date) return '--';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatBillCycleLabel = (billMonth, billYear) => {
    if (!billMonth) return 'Maintenance cycle';
    const monthNumber = Number(billMonth);
    if (!Number.isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        const d = new Date(Number(billYear) || new Date().getFullYear(), monthNumber - 1, 1);
        return `${d.toLocaleDateString('en-IN', { month: 'long' })} maintenance cycle`;
    }
    return `${billMonth} maintenance cycle`;
};

const csvEscape = (value) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
};

const AnimatedCount = ({ value, prefix = '', suffix = '', duration = 1200 }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let animationFrame;

        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(tick);
            }
        };

        animationFrame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span>
            {prefix}{display.toLocaleString('en-IN')}{suffix}
        </span>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const societyId = user?.societyId;

    const [flatCount, setFlatCount] = useState(0);
    const [residentCount, setResidentCount] = useState(0);
    const [collectionStats, setCollectionStats] = useState({ totalBilled: 0, totalCollected: 0, totalPending: 0, billCount: 0, collectionPercentage: 0 });
    const [openComplaints, setOpenComplaints] = useState(0);
    const [presentStaff, setPresentStaff] = useState(0);
    const [activeAlerts, setActiveAlerts] = useState(0);
    const [monthlyCollectionData, setMonthlyCollectionData] = useState([]);
    const [recentPayments, setRecentPayments] = useState([]);
    const [latestComplaints, setLatestComplaints] = useState([]);
    const [allBills, setAllBills] = useState([]);
    const [allComplaints, setAllComplaints] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    const currentDateLabel = useMemo(() => new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }), []);

    useEffect(() => {
        const timeoutId = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (!societyId) {
            console.log('[AdminDashboard] No societyId, skipping subscriptions');
            return;
        }

        console.log('[AdminDashboard] Subscribing to data for societyId:', societyId);

        const unsubFlats = subscribeToFlats(societyId, (items) => {
            console.log('[AdminDashboard] Received flats:', items.length);
            setFlatCount(items.length);
        });
        const unsubResidents = subscribeToResidents(societyId, (items) => {
            console.log('[AdminDashboard] Received residents:', items.length);
            setResidentCount(items.length);
        });
        const unsubBills = subscribeBillingStats(societyId, (stats) => {
            console.log('[AdminDashboard] Received billing stats:', stats);
            setCollectionStats(stats || { totalBilled: 0, totalCollected: 0, totalPending: 0, billCount: 0, collectionPercentage: 0 });
        });
        const unsubAllBills = subscribeToAllBills(societyId, (items) => {
            setAllBills(items);
            const now = new Date();
            const monthBuckets = [];
            const monthTotals = new Map();
            const paymentRows = [];

            // Build last 6 month buckets including current month.
            for (let i = LAST_SIX_MONTHS - 1; i >= 0; i -= 1) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                const label = d.toLocaleDateString('en-IN', { month: 'short' });
                monthBuckets.push({ key, label });
                monthTotals.set(key, 0);
            }

            items.forEach((bill) => {
                const payments = bill?.payments || [];
                const billTotalAmount = Number(bill?.totalAmount) || 0;
                let collectedForBill = 0;

                payments.forEach((payment) => {
                    if (payment?.status !== 'Paid') return;

                    const amount = Number(payment?.amount) || 0;
                    if (amount <= 0) return;
                    collectedForBill += amount;

                    const paidDate = parsePaidDate(payment?.paidDate)
                        || parsePaidDate(bill?.updatedAt)
                        || parsePaidDate(bill?.createdAt);

                    if (!paidDate) return;

                    const bucketKey = `${paidDate.getFullYear()}-${paidDate.getMonth()}`;
                    if (!monthTotals.has(bucketKey)) return;
                    monthTotals.set(bucketKey, (monthTotals.get(bucketKey) || 0) + amount);

                    const billMonthLabel = bill?.billMonth && bill?.billYear
                        ? `${bill.billMonth} ${bill.billYear}`
                        : paidDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

                    paymentRows.push({
                        flat: payment?.residentFlat || bill?.flatNumber || '-',
                        resident: payment?.residentName || 'Resident',
                        month: billMonthLabel,
                        amount,
                        status: 'Paid',
                        paidAtTs: paidDate.getTime(),
                    });
                });

                const pendingAmount = Math.max(0, billTotalAmount - collectedForBill);
                if (pendingAmount > 0) {
                    const billDate = parsePaidDate(bill?.updatedAt)
                        || parsePaidDate(bill?.createdAt)
                        || new Date();

                    const billMonthLabel = bill?.billMonth && bill?.billYear
                        ? `${bill.billMonth} ${bill.billYear}`
                        : billDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

                    paymentRows.push({
                        flat: bill?.flatNumber && bill.flatNumber !== 'all' ? bill.flatNumber : 'All Flats',
                        resident: bill?.flatNumber && bill.flatNumber !== 'all' ? 'Pending for flat' : 'Pending for society',
                        month: billMonthLabel,
                        amount: pendingAmount,
                        status: 'Pending',
                        paidAtTs: billDate.getTime(),
                    });
                }
            });

            const data = monthBuckets.map(({ key, label }) => ({
                month: label,
                collection: Math.round(monthTotals.get(key) || 0),
            }));

            setMonthlyCollectionData(data);
            paymentRows.sort((a, b) => b.paidAtTs - a.paidAtTs);
            // Keep a larger window and rely on table scroll for scalability.
            setRecentPayments(paymentRows.slice(0, 50));
        });
        const unsubComplaints = subscribeToAllComplaints(societyId, (items) => {
            console.log('[AdminDashboard] Received complaints:', items.length);
            setAllComplaints(items);
            setOpenComplaints(items.filter(c => (c.status || '').toLowerCase() !== 'resolved').length);

            const rows = items
                .slice(0, 5)
                .map((item) => ({
                    id: item?.id ? `#${String(item.id).slice(0, 6).toUpperCase()}` : '#NA',
                    status: item?.status || 'Pending',
                    category: item?.category || item?.description || 'General complaint',
                    time: formatRelativeTime(item?.createdAt || item?.updatedAt),
                    icon: AlertTriangle,
                }));
            setLatestComplaints(rows);
        });
        const unsubAnnouncements = subscribeToAnnouncements(societyId, (items) => {
            setAnnouncements(items || []);
        });
        const unsubAttendance = subscribeToTodayAttendance(societyId, (items) => {
            console.log('[AdminDashboard] Received attendance:', items.length);
            const presentCount = items.filter((item) => {
                const status = String(item?.status || '').toLowerCase();
                return status === 'present' || status === 'checked in' || status === 'completed';
            }).length;
            setPresentStaff(presentCount);
        });
        const unsubEmergencies = subscribeToActiveEmergencies(societyId, (items) => {
            console.log('[AdminDashboard] Received emergencies:', items.length);
            setActiveAlerts(items.length);
        });
        return () => {
            if (unsubFlats) unsubFlats();
            if (unsubResidents) unsubResidents();
            if (unsubBills) unsubBills();
            if (unsubAllBills) unsubAllBills();
            if (unsubComplaints) unsubComplaints();
            if (unsubAnnouncements) unsubAnnouncements();
            if (unsubAttendance) unsubAttendance();
            if (unsubEmergencies) unsubEmergencies();
        };
    }, [societyId]);

    const currentMonthCollection = useMemo(() => {
        if (monthlyCollectionData.length === 0) return 0;
        return monthlyCollectionData[monthlyCollectionData.length - 1]?.collection || 0;
    }, [monthlyCollectionData]);

    const chartSummary = useMemo(() => {
        if (monthlyCollectionData.length === 0) {
            return {
                total: 0,
                avg: 0,
                peakMonth: '--',
                peakValue: 0,
            };
        }

        const total = monthlyCollectionData.reduce((sum, x) => sum + (Number(x.collection) || 0), 0);
        const avg = Math.round(total / monthlyCollectionData.length);
        const peak = monthlyCollectionData.reduce((best, x) => ((x.collection || 0) > (best.collection || 0) ? x : best), monthlyCollectionData[0]);

        return {
            total,
            avg,
            peakMonth: peak?.month || '--',
            peakValue: peak?.collection || 0,
        };
    }, [monthlyCollectionData]);

    const timelineEvents = useMemo(() => {
        const events = [];

        allBills.slice(0, 6).forEach((bill) => {
            const ts = parsePaidDate(bill?.createdAt) || parsePaidDate(bill?.updatedAt);
            const targetLabel = bill?.flatNumber && bill.flatNumber !== 'all' ? `Flat ${bill.flatNumber} billed` : 'All flats billed';
            events.push({
                id: `bill-${bill.id}`,
                title: `${formatBillCycleLabel(bill?.billMonth, bill?.billYear)} generated`,
                meta: `${targetLabel}${bill?.totalAmount ? ` • ₹${Number(bill.totalAmount).toLocaleString('en-IN')}` : ''}`,
                time: formatTimeOfDay(ts),
                sortTs: ts?.getTime?.() || 0,
                color: 'indigo',
            });
        });

        allComplaints.slice(0, 6).forEach((complaint) => {
            const ts = parsePaidDate(complaint?.updatedAt) || parsePaidDate(complaint?.createdAt);
            const status = String(complaint?.status || 'Pending').toLowerCase();
            const verb = status === 'resolved' ? 'resolved' : status === 'in progress' ? 'assigned' : 'received';
            events.push({
                id: `complaint-${complaint.id}`,
                title: `Complaint #${String(complaint.id || 'NA').slice(0, 6).toUpperCase()} ${verb}`,
                meta: complaint?.category || complaint?.description || 'Resident service issue',
                time: formatTimeOfDay(ts),
                sortTs: ts?.getTime?.() || 0,
                color: 'amber',
            });
        });

        announcements.slice(0, 6).forEach((notice) => {
            const ts = parsePaidDate(notice?.createdAt);
            const titleBase = notice?.type || notice?.category || 'Notice';
            events.push({
                id: `notice-${notice.id}`,
                title: `${titleBase} sent`,
                meta: notice?.title || notice?.message || 'Community update posted',
                time: formatTimeOfDay(ts),
                sortTs: ts?.getTime?.() || 0,
                color: 'sky',
            });
        });

        if (collectionStats?.collectionPercentage > 0) {
            const latestPaid = recentPayments.find((p) => p.status === 'Paid');
            const ts = latestPaid?.paidAtTs || Date.now();
            events.push({
                id: 'collection-milestone',
                title: 'Payment milestone reached',
                meta: `${collectionStats.collectionPercentage}% collection achieved`,
                time: formatTimeOfDay(ts),
                sortTs: Number(ts),
                color: 'green',
            });
        }

        return events
            .sort((a, b) => b.sortTs - a.sortTs)
            .slice(0, 4)
            .map(({ sortTs, ...item }) => item);
    }, [allBills, allComplaints, announcements, collectionStats?.collectionPercentage, recentPayments]);

    const kpiCards = useMemo(() => ([
        {
            key: 'flats',
            label: 'Total Flats',
            value: flatCount || 0,
            prefix: '',
            suffix: '',
            description: flatCount > 0 ? 'Live flat count' : 'No data yet',
            trend: '0%',
            trendType: 'up',
            Icon: Building2,
            tint: 'indigo',
        },
        {
            key: 'residents',
            label: 'Total Residents',
            value: residentCount || 0,
            prefix: '',
            suffix: '',
            description: residentCount > 0 ? 'Live resident count' : 'No data yet',
            trend: '0%',
            trendType: 'up',
            Icon: Users,
            tint: 'sky',
        },
        {
            key: 'collection',
            label: 'Monthly Collection',
            value: collectionStats.totalCollected || 0,
            prefix: '₹',
            suffix: '',
            description: collectionStats.totalCollected > 0 ? 'Collected this month' : 'No data yet',
            trend: '0%',
            trendType: 'up',
            Icon: IndianRupee,
            tint: 'green',
        },
        {
            key: 'pending',
            label: 'Pending Payments',
            value: collectionStats.totalPending || 0,
            prefix: '₹',
            suffix: '',
            description: collectionStats.totalPending > 0 ? 'Pending collection' : 'No data yet',
            trend: '0%',
            trendType: 'down',
            Icon: CreditCard,
            tint: 'amber',
        },
        {
            key: 'complaints',
            label: 'Active Complaints',
            value: openComplaints || 0,
            prefix: '',
            suffix: '',
            description: openComplaints > 0 ? 'Need attention' : 'No data yet',
            trend: '0%',
            trendType: 'down',
            Icon: AlertTriangle,
            tint: 'rose',
        },
    ]), [flatCount, residentCount, collectionStats.totalCollected, collectionStats.totalPending, openComplaints]);

    const handleDownloadReport = () => {
        try {
            const generatedAt = new Date();
            const reportRows = [];

            const pushRow = (...cells) => {
                reportRows.push(cells.map(csvEscape).join(','));
            };

            pushRow('ACCORD LIVING - Admin Dashboard Report');
            pushRow('Generated At', generatedAt.toLocaleString('en-IN'));
            pushRow('Society', user?.societyName || 'ACCORD LIVING');
            pushRow('');

            pushRow('KPI Summary');
            pushRow('Metric', 'Value', 'Description');
            kpiCards.forEach((card) => {
                pushRow(card.label, `${card.prefix || ''}${Number(card.value || 0).toLocaleString('en-IN')}${card.suffix || ''}`, card.description);
            });
            pushRow('');

            pushRow('Monthly Maintenance Collection (Last 6 Months)');
            pushRow('Month', 'Collected Amount');
            monthlyCollectionData.forEach((point) => {
                pushRow(point.month, Number(point.collection || 0).toLocaleString('en-IN'));
            });
            pushRow('');

            pushRow('Collection Highlights');
            pushRow('Total (6M)', Number(chartSummary.total || 0).toLocaleString('en-IN'));
            pushRow('Average / Month', Number(chartSummary.avg || 0).toLocaleString('en-IN'));
            pushRow('Peak Month', chartSummary.peakMonth || '--');
            pushRow('Peak Value', Number(chartSummary.peakValue || 0).toLocaleString('en-IN'));
            pushRow('');

            pushRow('Recent Payments');
            pushRow('Flat', 'Resident', 'Month', 'Amount', 'Status');
            if (recentPayments.length === 0) {
                pushRow('No payments yet');
            } else {
                recentPayments.forEach((payment) => {
                    pushRow(
                        payment.flat,
                        payment.resident,
                        payment.month,
                        Number(payment.amount || 0).toLocaleString('en-IN'),
                        payment.status
                    );
                });
            }
            pushRow('');

            pushRow('Latest Complaints');
            pushRow('Ticket', 'Category', 'Status', 'Priority', 'Updated');
            if (latestComplaints.length === 0) {
                pushRow('No complaints yet');
            } else {
                latestComplaints.forEach((complaint) => {
                    const priority = complaint.status?.toLowerCase() === 'pending'
                        ? 'High'
                        : complaint.status?.toLowerCase() === 'in progress'
                            ? 'Medium'
                            : 'Low';
                    pushRow(complaint.id, complaint.category, complaint.status, priority, complaint.time);
                });
            }
            pushRow('');

            pushRow('Activity Timeline');
            pushRow('Title', 'Details', 'Time');
            if (timelineEvents.length === 0) {
                pushRow('No timeline events yet');
            } else {
                timelineEvents.forEach((event) => {
                    pushRow(event.title, event.meta, event.time);
                });
            }

            const csvData = reportRows.join('\r\n');
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const stamp = generatedAt.toISOString().slice(0, 10);
            link.href = downloadUrl;
            link.download = `accord-living-dashboard-report-${stamp}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            toast.success('Dashboard report downloaded successfully!', 'Download Complete');
        } catch (error) {
            toast.error(error?.message || 'Failed to download dashboard report', 'Error');
        }
    };

    const getResidentInitials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="admin-dashboard">
            <motion.div
                className="dashboard-topbar"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div>
                    <span className="welcome-kicker">Welcome back, Admin</span>
                    <h1>Operations Command Center</h1>
                    <p>Monitor collections, residents, and operations in one place.</p>
                </div>

                <div className="topbar-actions">
                    <span className="current-date-chip">{currentDateLabel}</span>
                    <Button className="btn-primary-action" onClick={handleDownloadReport}>
                        <Download size={16} /> Download Report
                    </Button>
                </div>
            </motion.div>

            <motion.div
                className="kpi-grid"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
            >
                {kpiCards.map(({ key, label, value, prefix, suffix, description, trend, trendType, Icon, tint }) => (
                    <div key={key} className={`surface-card kpi-card tint-${tint}`}>
                        <div className="kpi-head">
                            <span className="kpi-label">{label}</span>
                            <span className="kpi-icon"><Icon size={18} /></span>
                        </div>
                        <div className="kpi-value">
                            <AnimatedCount value={value} prefix={prefix} suffix={suffix} />
                        </div>
                        <div className="kpi-meta">
                            <span>{description}</span>
                            <span className={`kpi-trend ${trendType}`}>
                                {trendType === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {trend}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>

            <motion.section
                className="analytics-grid"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
            >
                <div className="surface-card chart-card">
                    <div className="surface-head">
                        <div>
                            <h3>Monthly Maintenance Collection</h3>
                            <p>Live collection trend (last 6 months) - Current month: ₹ {currentMonthCollection.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <SkeletonCard className="chart-skeleton" />
                    ) : monthlyCollectionData.length === 0 ? (
                        <div className="chart-empty">No data yet</div>
                    ) : (
                        <div className="chart-layout">
                            <div className="chart-area">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyCollectionData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.95} />
                                                <stop offset="100%" stopColor="#22C55E" stopOpacity={0.52} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--chart-label)', fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                                                if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                                                return `₹${value}`;
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`₹ ${Number(value).toLocaleString('en-IN')}`, 'Collected']}
                                            contentStyle={{ borderRadius: 12, border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="collection"
                                            stroke="url(#lineGradient)"
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                            activeDot={{ r: 6 }}
                                            isAnimationActive
                                            animationDuration={900}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="chart-summary">
                                <div className="summary-item">
                                    <span>Total (6M)</span>
                                    <strong>₹ {chartSummary.total.toLocaleString('en-IN')}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Average / month</span>
                                    <strong>₹ {chartSummary.avg.toLocaleString('en-IN')}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Peak month</span>
                                    <strong>{chartSummary.peakMonth}</strong>
                                    <small>₹ {chartSummary.peakValue.toLocaleString('en-IN')}</small>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="surface-card complaints-card">
                    <div className="surface-head">
                        <div>
                            <h3>Latest Complaints</h3>
                            <p>Track resident service issues</p>
                        </div>
                        <button className="link-btn" onClick={() => navigate('/admin/complaints')}>View All</button>
                    </div>

                    {isLoading ? (
                        <SkeletonCard className="complaints-skeleton" />
                    ) : latestComplaints.length === 0 ? (
                        <div className="list-empty">No complaints yet</div>
                    ) : (
                        <div className="complaint-list">
                            {latestComplaints.map((item) => (
                                <div
                                    key={item.id}
                                    className="complaint-card"
                                >
                                    <div className="complaint-icon"><item.icon size={16} /></div>
                                    <div className="complaint-main">
                                        <div className="complaint-top-line">
                                            <strong>{item.id}</strong>
                                            <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span>
                                        </div>
                                        <div className={`priority-chip ${item.status.toLowerCase() === 'pending' ? 'high' : item.status.toLowerCase() === 'in progress' ? 'medium' : 'low'}`}>
                                            {item.status.toLowerCase() === 'pending' ? 'High Priority' : item.status.toLowerCase() === 'in progress' ? 'Medium Priority' : 'Low Priority'}
                                        </div>
                                        <p>{item.category}</p>
                                    </div>
                                    <div className="complaint-actions">
                                        <span className="complaint-time"><Clock3 size={12} /> {item.time}</span>
                                        <button className="view-details-btn" onClick={() => navigate('/admin/complaints')}>View Details</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </motion.section>

            <motion.section
                className="ops-grid"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.14 }}
            >
                <div className="surface-card quick-actions-card">
                    <div className="surface-head">
                        <div>
                            <h3>Quick Actions</h3>
                            <p>Speed up daily operations</p>
                        </div>
                    </div>

                    <div className="quick-actions-grid">
                        {quickActions.map((action) => (
                            <button key={action.label} className="quick-action" onClick={() => navigate(action.path)}>
                                <div className="quick-action-main">
                                    <span className="quick-action-icon"><action.icon size={16} /></span>
                                    <span>{action.label}</span>
                                </div>
                                <Plus size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="surface-card timeline-card">
                    <div className="surface-head">
                        <div>
                            <h3>Activity Timeline</h3>
                            <p>Latest operational events</p>
                        </div>
                    </div>

                    <div className="timeline-list">
                        {timelineEvents.length === 0 ? (
                            <div className="list-empty">No data yet</div>
                        ) : (
                            timelineEvents.map((event, idx) => (
                                <div key={`${event.title}-${idx}`} className="timeline-item">
                                    <span className={`timeline-dot ${event.color}`} />
                                    <div className="timeline-content">
                                        <strong>{event.title}</strong>
                                        <p>{event.meta}</p>
                                    </div>
                                    <span className="timeline-time">{event.time}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.section>

            <motion.section
                className="data-grid"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
            >
                <div className="surface-card payments-card">
                    <div className="surface-head">
                        <div>
                            <h3>Recent Payments</h3>
                            <p>Latest maintenance transactions</p>
                        </div>
                        <button className="link-btn" onClick={() => navigate('/admin/payments')}>View All</button>
                    </div>

                    {isLoading ? (
                        <div className="table-skeleton-wrap">
                            <SkeletonCard className="table-skeleton" />
                        </div>
                    ) : recentPayments.length === 0 ? (
                        <div className="table-empty">No payments yet</div>
                    ) : (
                        <div className="table-wrap">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th>Flat</th>
                                        <th>Resident</th>
                                        <th>Month</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayments.map((row, idx) => (
                                        <tr key={`${row.flat}-${row.month}-${idx}`}>
                                            <td>{row.flat}</td>
                                            <td>
                                                <div className="resident-cell">
                                                    <span className="resident-avatar">{getResidentInitials(row.resident)}</span>
                                                    <span>{row.resident}</span>
                                                </div>
                                            </td>
                                            <td>{row.month}</td>
                                            <td>₹ {row.amount.toLocaleString('en-IN')}</td>
                                            <td>
                                                <span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.section>
        </div>
    );
};

export default AdminDashboard;
