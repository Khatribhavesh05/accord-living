import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import {
    Bell, Calendar as CalendarIcon, Clock, AlertCircle,
    Wrench, Users, Info, Plus
} from 'lucide-react';
import '../resident/Announcements.css'; // Reusing the identical SaaS stylesheet

const EventsAnnouncements = () => {
    const toast = useToast();
    const [events, setEvents] = useState([
        { id: 1, title: 'Holi Celebration 2026', date: '25 Mar 2026', time: '10:00 AM', location: 'Club House Ground' },
        { id: 2, title: 'Annual General Meeting', date: '15 Apr 2026', time: '05:00 PM', location: 'Community Hall' },
        { id: 3, title: 'Yoga Workshop', date: 'Every Sunday', time: '07:00 AM', location: 'Garden Area' },
    ]);

    const [announcements, setAnnouncements] = useState([
        { id: 1, title: 'Water Supply Maintenance', type: 'maintenance', date: '08 Feb 2026', message: 'Water supply will be disrupted from 2 PM to 5 PM due to tank cleaning.' },
        { id: 2, title: 'Lift Service Due', type: 'warning', date: '10 Feb 2026', message: 'Lift B-Wing will be under maintenance on 12th Feb.' },
        { id: 3, title: 'Garbage Collection Timing', type: 'info', date: '01 Feb 2026', message: 'Garbage collection trucks will now arrive at 8:30 AM instead of 9:00 AM.' },
    ]);

    const [createModal, setCreateModal] = useState(false);
    const [createType, setCreateType] = useState('event');
    const [form, setForm] = useState({ title: '', date: '', time: '', location: '', message: '', annType: 'info' });

    const handleCreate = (e) => {
        e.preventDefault();
        if (createType === 'event') {
            setEvents(prev => [...prev, { id: Date.now(), title: form.title, date: form.date, time: form.time, location: form.location }]);
            toast.success(`Event "${form.title}" created!`, 'Event Added');
        } else {
            setAnnouncements(prev => [{
                id: Date.now(),
                title: form.title,
                type: form.annType,
                date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                message: form.message
            }, ...prev]);
            toast.success(`Notice "${form.title}" published!`, 'Notice Posted');
        }
        setCreateModal(false);
        setForm({ title: '', date: '', time: '', location: '', message: '', annType: 'info' });
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'meeting': return <Users size={20} />;
            case 'maintenance': return <Wrench size={20} />;
            case 'warning': return <AlertCircle size={20} />;
            case 'event': return <CalendarIcon size={20} />;
            case 'info': default: return <Info size={20} />;
        }
    };

    return (
        <div className="ac-page" style={{ padding: '0', background: 'transparent' }}>
            <PageHeader
                title="Events & Announcements"
                subtitle="Manage society notices and gatherings"
                action={<Button variant="primary" onClick={() => setCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16} /> Create New</Button>}
            />

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>

                {/* Left Col: Notice Board (SaaS Styling) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="ac-section-title" style={{ margin: 0, padding: 0 }}>Notice Board</div>
                        <Button variant="outline" size="sm" onClick={() => {
                            setAnnouncements([]);
                            toast.success('All notices archived successfully!', 'Archived');
                        }}>Archive All</Button>
                    </div>

                    <div className="ac-list">
                        {announcements.length === 0 ? (
                            <div className="ac-empty-state">
                                <div className="ac-empty-icon">
                                    <Bell size={32} />
                                </div>
                                <h3>No active notices</h3>
                                <p>You're all caught up!</p>
                            </div>
                        ) : (
                            announcements.map((notice) => (
                                <div key={notice.id} className={`ac-card type-${notice.type || 'info'}`} style={{ padding: '16px 20px' }}>
                                    <div className="ac-icon-wrap">
                                        {getIconForType(notice.type)}
                                    </div>
                                    <div className="ac-content">
                                        <div className="ac-top-row" style={{ marginBottom: '4px' }}>
                                            <h3 className="ac-title" style={{ fontSize: '15px' }}>{notice.title}</h3>
                                            <div className="ac-date-badge">
                                                <Clock size={12} /> {notice.date}
                                            </div>
                                        </div>
                                        <div className="ac-description" style={{ margin: 0, fontSize: '13px' }}>
                                            {notice.message}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Col: Events Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="ac-section-title" style={{ margin: 0, padding: 0 }}>Upcoming Events</div>
                        <Button variant="outline" size="sm" onClick={() => toast.info(`Showing all ${events.length} events`, 'All Events')}>View All</Button>
                    </div>

                    <div className="ac-list">
                        {events.map((event) => (
                            <div key={event.id} className="ac-card type-event" style={{ padding: '16px 20px' }}>
                                <div className="ac-icon-wrap" style={{ background: 'var(--ac-accent-light)', color: 'var(--ac-accent)' }}>
                                    <CalendarIcon size={20} />
                                </div>
                                <div className="ac-content">
                                    <div className="ac-top-row" style={{ marginBottom: '4px' }}>
                                        <h3 className="ac-title" style={{ fontSize: '15px' }}>{event.title}</h3>
                                        <div className="ac-date-badge">
                                            <Clock size={12} /> {event.date}
                                        </div>
                                    </div>
                                    <div className="ac-description" style={{ margin: 0, display: 'flex', gap: '16px', fontSize: '13px', paddingTop: '4px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> {event.time}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            📍 {event.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Create Event/Announcement Modal */}
            <Modal isOpen={createModal} title="Create New" onClose={() => setCreateModal(false)}>
                <form className="modal-form" onSubmit={handleCreate}>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={createType} onChange={e => setCreateType(e.target.value)}>
                            <option value="event">Society Event</option>
                            <option value="announcement">Notice / Announcement</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Holi Celebration" required />
                    </div>

                    {createType === 'event' ? (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="text" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="e.g. 25 Mar 2026" required />
                                </div>
                                <div className="form-group">
                                    <label>Time</label>
                                    <input type="text" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="e.g. 10:00 AM" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Club House" required />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Notice Type</label>
                                <select value={form.annType} onChange={e => setForm({ ...form, annType: e.target.value })}>
                                    <option value="info">General Information</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="warning">Alert/Warning</option>
                                    <option value="meeting">Meeting</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your notice message..." rows={4} required />
                            </div>
                        </>
                    )}
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Publish {createType === 'event' ? 'Event' : 'Notice'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EventsAnnouncements;
