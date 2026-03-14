import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bell, AlertTriangle, CreditCard, CheckCircle2, Megaphone,
    CalendarDays, CloudSun, Droplets, Wind, Sparkles, ShieldAlert,
    ArrowRight, WalletCards, MessageSquareWarning, PhoneCall,
    BadgeIndianRupee, Clock3, CircleCheckBig, Activity
} from 'lucide-react';
import { Button } from '../../components/ui';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import '../../styles/ResidentDashboard.css';
import { useAuth } from '../../context/AuthContext';
import { subscribeToResidentBills } from '../../firebase/billService';
import { subscribeToResidentComplaints } from '../../firebase/complaintService';
import { subscribeToAnnouncements } from '../../firebase/announcementService';
import { subscribeToSociety } from '../../firebase/societyService';

const Skeleton = ({ className = '' }) => <div className={`rd-skeleton ${className}`} />;

const AnimatedCount = ({ value, prefix = '', duration = 1000 }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let frame;
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);

    return <>{prefix}{display.toLocaleString('en-IN')}</>;
};

const ResidentDashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const [totalDueAmount, setTotalDueAmount] = useState(0);
    const [lastPaymentAmount, setLastPaymentAmount] = useState(0);
    const [lastPaymentDate, setLastPaymentDate] = useState('No payment history yet');
    const [activeComplaints, setActiveComplaints] = useState(0);
    const [announcementCount, setAnnouncementCount] = useState(0);
    const [residentBills, setResidentBills] = useState([]);
    const [residentComplaints, setResidentComplaints] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [society, setSociety] = useState(null);
    const [weather, setWeather] = useState({ loading: true, city: 'Jaipur', temperature: null, condition: 'Unavailable', humidity: null, windSpeed: null });
    const residentDisplayName = user?.name || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Resident');
    const residentInitials = residentDisplayName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'R';

    useEffect(() => {
        const id = setTimeout(() => setIsLoading(false), 850);
        return () => clearTimeout(id);
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const unsubBills = subscribeToResidentBills(user.uid, user?.societyId || null, (items) => {
            setResidentBills(items);
            const due = items
                .filter((bill) => !bill.isPaid)
                .reduce((sum, bill) => sum + (Number(bill.totalAmount) || 0), 0);
            setTotalDueAmount(due);

            const residentPayments = items
                .flatMap((bill) =>
                    (bill.payments || [])
                        .filter((payment) => payment?.residentUid === user.uid && String(payment?.status || '').toLowerCase() === 'paid')
                        .map((payment) => {
                            const parsedDate = payment?.paidDate ? new Date(payment.paidDate) : null;
                            const fallbackDate = bill?.createdAt?.toDate?.() || null;
                            return {
                                amount: Number(payment?.amount) || 0,
                                date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : fallbackDate,
                            };
                        })
                )
                .filter((payment) => payment.date);

            residentPayments.sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0));
            const latest = residentPayments[0];
            if (latest) {
                setLastPaymentAmount(latest.amount || 0);
                setLastPaymentDate(latest.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
            } else {
                setLastPaymentAmount(0);
                setLastPaymentDate('No payment history yet');
            }
        }, user?.flatNumber);
        const unsubComplaints = subscribeToResidentComplaints(user.uid, (items) => {
            setResidentComplaints(items);
            setActiveComplaints(items.filter(c => (c.status || '').toLowerCase() !== 'resolved').length);
        });
        const unsubAnnouncements = subscribeToAnnouncements(user?.societyId || null, (items) => {
            setAnnouncements(items);
            setAnnouncementCount(items.length);
        });
        return () => {
            unsubBills && unsubBills();
            unsubComplaints && unsubComplaints();
            unsubAnnouncements && unsubAnnouncements();
        };
    }, [user?.uid, user?.societyId, user?.flatNumber]);

    useEffect(() => {
        if (!user?.societyId) {
            setSociety(null);
            return () => {};
        }
        return subscribeToSociety(user.societyId, setSociety);
    }, [user?.societyId]);

    useEffect(() => {
        const locationText = String(society?.location || '').trim();
        const cityQuery = locationText || 'Jaipur';
        let cancelled = false;

        const fetchWeather = async () => {
            try {
                setWeather((prev) => ({ ...prev, loading: true, city: cityQuery }));
                const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`);
                const geoJson = await geoResponse.json();
                const match = geoJson?.results?.[0];
                if (!match) throw new Error('No geocoding result');

                const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`);
                const weatherJson = await weatherResponse.json();
                const current = weatherJson?.current;
                if (!current) throw new Error('No weather payload');

                const weatherCodeMap = {
                    0: 'Clear sky',
                    1: 'Mainly clear',
                    2: 'Partly cloudy',
                    3: 'Overcast',
                    45: 'Foggy',
                    48: 'Depositing rime fog',
                    51: 'Light drizzle',
                    53: 'Moderate drizzle',
                    55: 'Dense drizzle',
                    61: 'Slight rain',
                    63: 'Moderate rain',
                    65: 'Heavy rain',
                    71: 'Slight snow',
                    80: 'Rain showers',
                    95: 'Thunderstorm',
                };

                if (!cancelled) {
                    setWeather({
                        loading: false,
                        city: match.name || cityQuery,
                        temperature: Math.round(current.temperature_2m),
                        condition: weatherCodeMap[current.weather_code] || 'Weather update',
                        humidity: current.relative_humidity_2m,
                        windSpeed: Math.round(current.wind_speed_10m),
                    });
                }
            } catch {
                if (!cancelled) {
                    setWeather({
                        loading: false,
                        city: cityQuery,
                        temperature: null,
                        condition: 'Weather unavailable',
                        humidity: null,
                        windSpeed: null,
                    });
                }
            }
        };

        fetchWeather();
        return () => {
            cancelled = true;
        };
    }, [society?.location]);

    const parseDateValue = (value) => {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        if (value instanceof Date) return value;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatRelativeTime = (value) => {
        const date = parseDateValue(value);
        if (!date) return 'just now';
        const diffMs = Date.now() - date.getTime();
        const minutes = Math.max(1, Math.floor(diffMs / 60000));
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const recentActivity = useMemo(() => {
        const activities = [];

        residentBills.slice(0, 4).forEach((bill) => {
            if (bill.isPaid) {
                activities.push({
                    text: `${bill.billMonth || 'Maintenance'} payment received`,
                    time: formatRelativeTime(bill.paidDate || bill.updatedAt || bill.createdAt),
                    Icon: CircleCheckBig,
                    accent: 'success',
                    sortTs: parseDateValue(bill.paidDate || bill.updatedAt || bill.createdAt)?.getTime() || 0,
                });
            } else {
                activities.push({
                    text: `${bill.billMonth || 'Maintenance'} bill pending`,
                    time: formatRelativeTime(bill.updatedAt || bill.createdAt),
                    Icon: BadgeIndianRupee,
                    accent: 'warning',
                    sortTs: parseDateValue(bill.updatedAt || bill.createdAt)?.getTime() || 0,
                });
            }
        });

        residentComplaints.slice(0, 3).forEach((complaint) => {
            activities.push({
                text: `Complaint ${String(complaint.status || 'pending').toLowerCase() === 'resolved' ? 'resolved' : 'updated'}: ${complaint.category || 'General issue'}`,
                time: formatRelativeTime(complaint.updatedAt || complaint.createdAt),
                Icon: MessageSquareWarning,
                accent: 'warning',
                sortTs: parseDateValue(complaint.updatedAt || complaint.createdAt)?.getTime() || 0,
            });
        });

        announcements.slice(0, 3).forEach((notice) => {
            activities.push({
                text: `${notice.title || 'Announcement'} posted`,
                time: formatRelativeTime(notice.createdAt),
                Icon: Megaphone,
                accent: 'info',
                sortTs: parseDateValue(notice.createdAt)?.getTime() || 0,
            });
        });

        return activities.sort((a, b) => b.sortTs - a.sortTs).slice(0, 6);
    }, [residentBills, residentComplaints, announcements]);

    const paymentSeries = useMemo(() => {
        const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
        const buckets = [];
        for (let index = 5; index >= 0; index -= 1) {
            const date = new Date();
            date.setMonth(date.getMonth() - index);
            buckets.push({
                key: `${date.getFullYear()}-${date.getMonth()}`,
                month: monthFormatter.format(date),
                amount: 0,
            });
        }

        residentBills.forEach((bill) => {
            (bill.payments || [])
                .filter((payment) => payment?.residentUid === user?.uid && String(payment?.status || '').toLowerCase() === 'paid')
                .forEach((payment) => {
                    const paymentDate = parseDateValue(payment.paidDate) || parseDateValue(bill.updatedAt) || parseDateValue(bill.createdAt);
                    if (!paymentDate) return;
                    const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
                    const bucket = buckets.find((item) => item.key === key);
                    if (bucket) {
                        bucket.amount += Number(payment.amount) || 0;
                    }
                });
        });

        return buckets.map(({ month, amount }) => ({ month, amount }));
    }, [residentBills, user?.uid]);

    const upcomingDue = useMemo(() => {
        const pending = residentBills.filter((bill) => !bill.isPaid);
        if (pending.length === 0) return null;

        const sorted = [...pending].sort((a, b) => {
            const aDate = parseDateValue(a.dueDate) || parseDateValue(a.createdAt) || new Date(8640000000000000);
            const bDate = parseDateValue(b.dueDate) || parseDateValue(b.createdAt) || new Date(8640000000000000);
            return aDate.getTime() - bDate.getTime();
        });

        const nextBill = sorted[0];
        const dueDate = parseDateValue(nextBill.dueDate) || parseDateValue(nextBill.createdAt);
        return {
            title: `${nextBill.billMonth || 'Maintenance'} • ₹${(Number(nextBill.totalAmount) || 0).toLocaleString('en-IN')}`,
            subtitle: dueDate
                ? `Due on ${dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'Due date not set',
        };
    }, [residentBills]);

    const societyUpdates = useMemo(() => (
        announcements
            .filter((item) => !['event', 'meeting'].includes(String(item.type || '').toLowerCase()))
            .slice(0, 3)
            .map((item) => ({
                title: item.title || 'Society update',
                description: item.message || 'New notice has been published for residents.',
                date: item.displayDate || 'Today',
            }))
    ), [announcements]);

    const societyEvents = useMemo(() => (
        announcements
            .filter((item) => ['event', 'meeting'].includes(String(item.type || '').toLowerCase()))
            .slice(0, 3)
            .map((item) => ({
                title: item.title || 'Society event',
                description: item.message || 'Upcoming event details will appear here.',
                date: item.displayDate || 'Upcoming',
            }))
    ), [announcements]);

    const aiInsights = useMemo(() => {
        const insights = [];
        if (totalDueAmount > 0) {
            insights.push(`You have ₹${totalDueAmount.toLocaleString('en-IN')} in pending maintenance dues.`);
        } else {
            insights.push('Your maintenance dues are fully cleared.');
        }
        if (activeComplaints > 0) {
            insights.push(`${activeComplaints} complaint${activeComplaints > 1 ? 's are' : ' is'} still active and being tracked.`);
        } else {
            insights.push('There are no active complaints on your profile.');
        }
        if (announcementCount > 0) {
            insights.push(`${announcementCount} society update${announcementCount > 1 ? 's are' : ' is'} available for review.`);
        }
        return insights.slice(0, 3);
    }, [totalDueAmount, activeComplaints, announcementCount]);

    const smartNotifications = useMemo(() => {
        const notices = [];
        if (upcomingDue) notices.push(upcomingDue.subtitle);
        const unresolved = residentComplaints.find((item) => String(item.status || '').toLowerCase() !== 'resolved');
        if (unresolved) {
            notices.push(`Complaint status: ${unresolved.status || 'Pending'} for ${unresolved.category || 'General issue'}.`);
        }
        if (announcements[0]) {
            notices.push(`Latest notice: ${announcements[0].title || 'Society update'}.`);
        }
        return notices.slice(0, 3);
    }, [upcomingDue, residentComplaints, announcements]);

    const stats = useMemo(() => ([
        {
            key: 'due',
            label: 'Total Due',
            value: totalDueAmount,
            hint: totalDueAmount > 0 ? 'Outstanding maintenance dues' : 'All dues cleared',
            Icon: CreditCard,
            accent: 'danger',
            prefix: '₹'
        },
        {
            key: 'paid',
            label: 'Last Payment',
            value: lastPaymentAmount,
            hint: lastPaymentDate,
            Icon: CheckCircle2,
            accent: 'success',
            prefix: '₹'
        },
        {
            key: 'complaints',
            label: 'Active Complaints',
            value: activeComplaints,
            hint: activeComplaints > 0 ? 'In Progress' : 'No active complaints',
            Icon: AlertTriangle,
            accent: 'warning',
            prefix: ''
        },
        {
            key: 'announce',
            label: 'Announcements',
            value: announcementCount,
            hint: announcementCount > 0 ? 'New Updates' : 'No new updates',
            Icon: Bell,
            accent: 'info',
            prefix: ''
        },
    ]), [totalDueAmount, lastPaymentAmount, lastPaymentDate, activeComplaints, announcementCount]);

    const quickActions = [
        { label: 'Pay Maintenance', Icon: WalletCards, route: '/resident/bills', accent: 'indigo' },
        { label: 'File Complaint', Icon: MessageSquareWarning, route: '/resident/complaints', accent: 'violet' },
        { label: 'View Announcements', Icon: Megaphone, route: '/resident/announcements', accent: 'sky' },
        { label: 'Emergency Contact', Icon: PhoneCall, route: '/resident/emergency-sos', accent: 'danger' },
    ];

    return (
        <div className="resident-dashboard-sa">
            <motion.section
                className="rd-welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div>
                    <h1>Welcome back, {residentDisplayName}</h1>
                    <p>Here is an overview of your society activity</p>
                </div>
                <div className="rd-welcome-avatar">{residentInitials}</div>
            </motion.section>

            <motion.section
                className="rd-kpi-grid"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
            >
                {isLoading
                    ? [...Array(4)].map((_, idx) => <Skeleton key={`rd-kpi-${idx}`} className="rd-kpi-skeleton" />)
                    : stats.map((item) => (
                        <motion.article
                            key={item.key}
                            className={`rd-kpi-card ${item.accent}`}
                            whileHover={{ y: -4, scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 270, damping: 22 }}
                        >
                            <div className="rd-kpi-icon"><item.Icon size={18} /></div>
                            <div className="rd-kpi-label">{item.label}</div>
                            <div className="rd-kpi-value"><AnimatedCount value={item.value} prefix={item.prefix} /></div>
                            <div className="rd-kpi-hint">{item.hint}</div>
                        </motion.article>
                    ))}
            </motion.section>

            <motion.section
                className="rd-quick-actions"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
            >
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        className={`rd-action-card ${action.accent}`}
                        onClick={() => navigate(action.route)}
                    >
                        <span className="rd-action-icon"><action.Icon size={18} /></span>
                        <span>{action.label}</span>
                        <ArrowRight size={15} />
                    </button>
                ))}
            </motion.section>

            <motion.section
                className="rd-dashboard-grid"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
            >
                <div className="rd-surface rd-card rd-timeline-card">
                    <div className="rd-surface-head">
                        <h3>Recent Activity</h3>
                    </div>
                    {isLoading ? (
                        <Skeleton className="rd-panel-skeleton" />
                    ) : recentActivity.length === 0 ? (
                        <div className="rd-empty">No data yet</div>
                    ) : (
                        <div className="rd-timeline">
                            {recentActivity.map((item, idx) => (
                                <div className="rd-timeline-item" key={`${item.time}-${idx}`}>
                                    <span className={`rd-timeline-dot ${item.accent}`}><item.Icon size={12} /></span>
                                    <div className="rd-timeline-content">
                                        <p>{item.text}</p>
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rd-surface rd-card rd-chart-card">
                    <div className="rd-surface-head">
                        <h3>Monthly Maintenance Payments</h3>
                    </div>
                    {isLoading ? (
                        <Skeleton className="rd-chart-skeleton" />
                    ) : paymentSeries.length === 0 ? (
                        <div className="rd-empty">No data yet</div>
                    ) : (
                        <div className="rd-chart-wrap">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={paymentSeries} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="rdLine" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                                            <stop offset="100%" stopColor="#818CF8" stopOpacity={0.7} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--rd-grid)" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--rd-muted)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--rd-muted)', fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => [`₹${value}`, 'Amount']}
                                        contentStyle={{ borderRadius: 10, border: '1px solid var(--rd-border)', background: 'var(--rd-card)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="url(#rdLine)"
                                        strokeWidth={3}
                                        dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                                        isAnimationActive
                                        animationDuration={850}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="rd-surface rd-card rd-reminder-card">
                    <div className="rd-surface-head">
                        <h3>Upcoming Due Reminder</h3>
                    </div>
                    <div className="rd-reminder">
                        <div>
                            <strong>{upcomingDue?.title || 'No upcoming dues'}</strong>
                            <p>{upcomingDue?.subtitle || 'You are fully up to date on maintenance.'}</p>
                        </div>
                        <Button variant="primary" disabled={!upcomingDue} onClick={() => navigate('/resident/bills')}>Pay Now</Button>
                    </div>
                </div>

                <div className="rd-surface rd-card rd-weather-card">
                    <div className="rd-surface-head">
                        <h3>Weather • {weather.city}</h3>
                    </div>
                    {weather.loading ? (
                        <Skeleton className="rd-panel-skeleton" />
                    ) : weather.temperature === null ? (
                        <div className="rd-empty">Weather unavailable</div>
                    ) : (
                        <div className="rd-weather-grid">
                            <div className="rd-weather-main">
                                <CloudSun size={26} />
                                <div>
                                    <strong>{weather.temperature}°C</strong>
                                    <span>{weather.condition}</span>
                                </div>
                            </div>
                            <div className="rd-weather-meta"><Droplets size={14} /> Humidity {weather.humidity}%</div>
                            <div className="rd-weather-meta"><Wind size={14} /> Wind {weather.windSpeed} km/h</div>
                        </div>
                    )}
                </div>

                <div className="rd-surface rd-card rd-updates-card">
                    <div className="rd-surface-head">
                        <h3>Society Updates</h3>
                    </div>
                    <div className="rd-updates-grid">
                        {societyUpdates.length === 0 ? (
                            <div className="rd-empty">No data yet</div>
                        ) : (
                            societyUpdates.map((item) => (
                                <article key={item.title} className="rd-update-card">
                                    <h4>{item.title}</h4>
                                    <p>{item.description}</p>
                                    <div className="rd-update-foot">
                                        <span><CalendarDays size={13} /> {item.date}</span>
                                        <button onClick={() => navigate('/resident/announcements')}>Read More</button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </div>

                <div className="rd-surface rd-card rd-events-card">
                    <div className="rd-surface-head">
                        <h3>Society Events</h3>
                    </div>
                    <div className="rd-updates-grid">
                        {societyEvents.length === 0 ? (
                            <div className="rd-empty">No upcoming events</div>
                        ) : (
                            societyEvents.map((item) => (
                                <article key={`${item.title}-${item.date}`} className="rd-update-card">
                                    <h4>{item.title}</h4>
                                    <p>{item.description}</p>
                                    <div className="rd-update-foot">
                                        <span><CalendarDays size={13} /> {item.date}</span>
                                        <button onClick={() => navigate('/resident/announcements')}>Open</button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </div>

                <div className="rd-surface rd-card rd-ai-card">
                    <div className="rd-surface-head">
                        <h3>AI Insights</h3>
                    </div>
                    <div className="rd-timeline">
                        {aiInsights.map((item, index) => (
                            <div className="rd-timeline-item" key={`insight-${index}`}>
                                <span className="rd-timeline-dot info"><Sparkles size={12} /></span>
                                <div className="rd-timeline-content">
                                    <p>{item}</p>
                                    <span>Live summary</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rd-surface rd-card rd-smart-notif-card">
                    <div className="rd-surface-head">
                        <h3>Smart Notifications</h3>
                    </div>
                    <div className="rd-timeline">
                        {smartNotifications.length === 0 ? (
                            <div className="rd-empty">No smart alerts</div>
                        ) : (
                            smartNotifications.map((item, index) => (
                                <div className="rd-timeline-item" key={`notice-${index}`}>
                                    <span className="rd-timeline-dot warning"><Activity size={12} /></span>
                                    <div className="rd-timeline-content">
                                        <p>{item}</p>
                                        <span>Actionable update</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default ResidentDashboard;
