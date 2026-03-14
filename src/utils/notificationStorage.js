const NOTIFICATIONS_KEY = 'accord-living_notifications_v1';
const NOTIFY_EVENT = 'accord-living-notifications-updated';
const NOTIFICATION_READS_KEY = 'accord-living_notification_reads_v1';

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const getStoredNotifications = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(NOTIFICATIONS_KEY), []);
};

const getStoredReadState = () => {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem(NOTIFICATION_READS_KEY), {});
};

const persistNotifications = (notifications) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(NOTIFY_EVENT));
};

const persistReadState = (reads) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(reads));
  window.dispatchEvent(new CustomEvent(NOTIFY_EVENT));
};

const getCurrentUser = () => {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem('user'), {});
};

const canSeeNotification = (notification, user) => {
  const targetId = String(notification.recipient_id || '').trim();
  const targetName = String(notification.recipient_name || '').trim().toLowerCase();
  const targetRole = String(notification.recipient_role || '').trim().toLowerCase();

  const userId = String(user?.id || '').trim();
  const userName = String(user?.name || '').trim().toLowerCase();
  const userRole = String(user?.role || '').trim().toLowerCase();

  if (!targetId && !targetName && !targetRole) return true;
  if (targetId && userId && targetId === userId) return true;
  if (targetName && userName && targetName === userName) return true;
  if (targetRole && userRole && targetRole === userRole) return true;
  return false;
};

const formatRelativeTime = (isoDate) => {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) return 'just now';

  const deltaMs = Date.now() - timestamp;
  const seconds = Math.max(1, Math.floor(deltaMs / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const getNotificationUpdateEvent = () => NOTIFY_EVENT;

export const buildNotificationScope = (...parts) => parts.filter(Boolean).join(':');

export const isScopedNotificationRead = (scope, id) => {
  if (!scope || !id) return false;
  const reads = getStoredReadState();
  return Boolean(reads[`${scope}:${id}`]);
};

export const markScopedNotificationAsRead = (scope, id) => {
  if (!scope || !id) return;
  const reads = getStoredReadState();
  reads[`${scope}:${id}`] = true;
  persistReadState(reads);
};

export const markScopedNotificationsAsRead = (scope, ids = []) => {
  if (!scope) return;
  const reads = getStoredReadState();
  ids.forEach((id) => {
    if (id) reads[`${scope}:${id}`] = true;
  });
  persistReadState(reads);
};

export const listNotificationsForCurrentUser = () => {
  const user = getCurrentUser();
  return getStoredNotifications()
    .filter((item) => canSeeNotification(item, user))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((item) => ({
      ...item,
      timestamp: item.timestamp || formatRelativeTime(item.created_at),
    }));
};

export const pushNotification = (notification) => {
  const list = getStoredNotifications();
  const next = {
    id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: notification.type || 'info',
    title: notification.title || 'Update',
    message: notification.message || '',
    read: Boolean(notification.read),
    recipient_id: notification.recipient_id || null,
    recipient_name: notification.recipient_name || null,
    recipient_role: notification.recipient_role || null,
    created_at: notification.created_at || new Date().toISOString(),
  };

  persistNotifications([next, ...list]);
  return next;
};

export const markNotificationAsRead = (id) => {
  const list = getStoredNotifications();
  persistNotifications(list.map((item) => (
    String(item.id) === String(id) ? { ...item, read: true } : item
  )));
};

export const deleteNotificationById = (id) => {
  const list = getStoredNotifications();
  persistNotifications(list.filter((item) => String(item.id) !== String(id)));
};

export const clearNotificationsForCurrentUser = () => {
  const user = getCurrentUser();
  const list = getStoredNotifications();
  const remaining = list.filter((item) => !canSeeNotification(item, user));
  persistNotifications(remaining);
};
