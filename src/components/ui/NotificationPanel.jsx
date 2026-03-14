import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import './NotificationPanel.css';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAnnouncements } from '../../firebase/announcementService';
import {
    buildNotificationScope,
    clearNotificationsForCurrentUser,
    deleteNotificationById,
    getNotificationUpdateEvent,
    isScopedNotificationRead,
    listNotificationsForCurrentUser,
    markNotificationAsRead,
    markScopedNotificationAsRead,
    markScopedNotificationsAsRead,
} from '../../utils/notificationStorage';

const NotificationPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [storedNotifications, setStoredNotifications] = useState(() => listNotificationsForCurrentUser());
    const [residentAnnouncements, setResidentAnnouncements] = useState([]);
    const [syncTick, setSyncTick] = useState(0);
    const { user } = useAuth();

    const panelRef = useRef(null);
    const buttonRef = useRef(null);
    const announcementScope = useMemo(
        () => buildNotificationScope('resident-announcements', user?.uid || user?.id, user?.societyId),
        [user?.uid, user?.id, user?.societyId]
    );
    const isResident = String(user?.role || '').toLowerCase() === 'resident';

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside the panel and button
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        // Only add listener when panel is open
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close panel on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    useEffect(() => {
        const syncNotifications = () => {
            setStoredNotifications(listNotificationsForCurrentUser());
            setSyncTick((value) => value + 1);
        };
        syncNotifications();

        const eventName = getNotificationUpdateEvent();
        window.addEventListener(eventName, syncNotifications);
        window.addEventListener('storage', syncNotifications);

        return () => {
            window.removeEventListener(eventName, syncNotifications);
            window.removeEventListener('storage', syncNotifications);
        };
    }, []);

    useEffect(() => {
        if (!isResident || !user?.societyId) {
            setResidentAnnouncements([]);
            return () => {};
        }

        return subscribeToAnnouncements(user.societyId, (items) => {
            const mapped = (items || []).map((item) => ({
                id: `resident-announcement-${item.id}`,
                sourceId: item.id,
                source: 'announcement',
                type: item.type === 'alert' ? 'alert' : item.type === 'meeting' ? 'success' : 'info',
                title: item.title || 'Society update',
                message: item.message || 'New notice has been posted for residents.',
                read: isScopedNotificationRead(announcementScope, item.id),
                created_at: item.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                timestamp: item.displayDate || 'just now',
            }));
            setResidentAnnouncements(mapped);
        });
    }, [isResident, user?.societyId, announcementScope, syncTick]);

    const notifications = useMemo(() => {
        const merged = isResident
            ? [...residentAnnouncements, ...storedNotifications]
            : storedNotifications;

        return merged.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    }, [isResident, residentAnnouncements, storedNotifications]);

    const handleMarkAsRead = (id) => {
        const target = notifications.find((notif) => String(notif.id) === String(id));
        if (target?.source === 'announcement') {
            markScopedNotificationAsRead(announcementScope, target.sourceId);
        } else {
            markNotificationAsRead(id);
        }
        setStoredNotifications(listNotificationsForCurrentUser());
        setSyncTick((value) => value + 1);
    };

    const handleDeleteNotification = (id) => {
        deleteNotificationById(id);
        setStoredNotifications(listNotificationsForCurrentUser());
    };

    const handleClearAll = () => {
        if (isResident && residentAnnouncements.length > 0) {
            markScopedNotificationsAsRead(announcementScope, residentAnnouncements.map((item) => item.sourceId));
        }
        clearNotificationsForCurrentUser();
        setStoredNotifications([]);
        setSyncTick((value) => value + 1);
        setIsOpen(false);
    };

    const unreadCount = notifications.filter(notif => !notif.read).length;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'alert':
                return <AlertCircle size={18} />;
            case 'success':
                return <CheckCircle size={18} />;
            case 'info':
            default:
                return <Info size={18} />;
        }
    };

    return (
        <div className="notification-container">
            {/* Bell Button */}
            <button
                ref={buttonRef}
                className={`notification-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                <span className="notification-bell-emoji" aria-hidden="true">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="notification-panel"
                    role="dialog"
                    aria-label="Notifications"
                >
                    {/* Header */}
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close notifications"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <Bell size={32} strokeWidth={1.5} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="notifications-list">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${notif.type} ${!notif.read ? 'unread' : ''}`}
                                    >
                                        <div className="notification-icon">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                        <div className="notification-body">
                                            <div className="notification-title">{notif.title}</div>
                                            <div className="notification-message">{notif.message}</div>
                                            <div className="notification-time">{notif.timestamp}</div>
                                        </div>
                                        <div className="notification-actions">
                                            {!notif.read && (
                                                <button
                                                    className="action-btn mark-read"
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    title="Mark as read"
                                                    aria-label="Mark as read"
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            {notif.source !== 'announcement' && (
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteNotification(notif.id)}
                                                    title="Delete notification"
                                                    aria-label="Delete notification"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="clear-all-btn"
                                onClick={handleClearAll}
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Overlay (for mobile) */}
            {isOpen && <div className="notification-overlay" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

export default NotificationPanel;
