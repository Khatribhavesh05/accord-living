import { supabase } from './supabaseClient';

export const VISITOR_STATUS = {
  INSIDE: 'inside',
  EXITED: 'exited',
  WAITING: 'waiting_approval',
  CANCELLED: 'cancelled',
};

const DEFAULT_SETTINGS = {
  society_name: 'CIVIORA',
  require_resident_approval: true,
  enable_qr_pass: true,
  enable_photo_capture: true,
  enable_vehicle_tracking: true,
  enable_otp_verification: false,
  allow_walkin_visitors: true,
  auto_approve_delivery: true,
  max_visitors_per_flat: 5,
  visitor_pass_expiry_hours: 12,
};

const safeLower = (value) => String(value || '').trim().toLowerCase();

export const getCurrentUser = () => {
  try {
    const roleUser =
      localStorage.getItem('user_admin') ||
      localStorage.getItem('user_security') ||
      localStorage.getItem('user_resident') ||
      localStorage.getItem('user');
    return roleUser ? JSON.parse(roleUser) : {};
  } catch {
    return {};
  }
};

export const getCurrentRole = () => {
  const user = getCurrentUser();
  return safeLower(user.role) || 'resident';
};

export const getResidentFlat = () => {
  const user = getCurrentUser();
  return (
    user.flat_number ||
    user.flatNumber ||
    user.flat ||
    user.apartment ||
    user.unit ||
    ''
  );
};

const ensureSettingsRow = async () => {
  const { data, error } = await supabase
    .from('visitor_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const insert = await supabase
    .from('visitor_settings')
    .insert(DEFAULT_SETTINGS)
    .select('*')
    .single();

  if (insert.error) throw insert.error;
  return insert.data;
};

export const getVisitorSettings = async () => ensureSettingsRow();

export const updateVisitorSettings = async (updates) => {
  const current = await ensureSettingsRow();
  const { data, error } = await supabase
    .from('visitor_settings')
    .update(updates)
    .eq('id', current.id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

const addVisitorLog = async ({ visitorId, action, role, actorId }) => {
  const { error } = await supabase.from('visitor_logs').insert({
    visitor_id: visitorId,
    action,
    performed_by_role: role,
    performed_by_id: actorId || null,
  });
  if (error) throw error;
};

export const getBlacklistByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('visitor_blacklist')
    .select('*')
    .eq('phone_number', String(phone || '').trim())
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const addToBlacklist = async (payload) => {
  const { data, error } = await supabase
    .from('visitor_blacklist')
    .upsert(payload, { onConflict: 'phone_number' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const createVisitorCheckIn = async (formData) => {
  const settings = await ensureSettingsRow();
  const user = getCurrentUser();

  const phone = String(formData.phone_number || '').trim();
  const blacklisted = await getBlacklistByPhone(phone);
  if (blacklisted) {
    throw new Error('This visitor is blacklisted and cannot be checked in.');
  }

  const { count } = await supabase
    .from('visitors')
    .select('id', { count: 'exact', head: true })
    .eq('flat_number', formData.flat_number)
    .in('status', [VISITOR_STATUS.INSIDE, VISITOR_STATUS.WAITING]);

  if ((count || 0) >= Number(settings.max_visitors_per_flat || 0)) {
    throw new Error('Max visitor limit reached for this flat.');
  }

  const isDelivery = safeLower(formData.visitor_type) === 'delivery';
  const autoApproved = Boolean(settings.auto_approve_delivery && isDelivery);
  const requiresApproval = Boolean(settings.require_resident_approval) && !autoApproved;

  const row = {
    visitor_name: formData.visitor_name,
    phone_number: phone,
    purpose: formData.purpose,
    flat_number: formData.flat_number,
    vehicle_number: formData.vehicle_number || '',
    visitor_photo: formData.visitor_photo || '',
    visitor_type: formData.visitor_type || 'Guest',
    entry_time: new Date().toISOString(),
    status: requiresApproval ? VISITOR_STATUS.WAITING : VISITOR_STATUS.INSIDE,
    approved: !requiresApproval,
    approval_method: autoApproved ? 'auto' : (requiresApproval ? 'resident' : 'admin'),
    approved_by: autoApproved ? 'system_auto_delivery' : (!requiresApproval ? 'security' : ''),
    created_by_security: user.id || null,
  };

  const { data, error } = await supabase.from('visitors').insert(row).select('*').single();
  if (error) throw error;

  await addVisitorLog({
    visitorId: data.id,
    action: 'created',
    role: 'security',
    actorId: user.id || null,
  });

  return { visitor: data, settings };
};

export const markVisitorExit = async (visitorId) => {
  const user = getCurrentUser();
  const { data, error } = await supabase
    .from('visitors')
    .update({ status: VISITOR_STATUS.EXITED, exit_time: new Date().toISOString() })
    .eq('id', visitorId)
    .select('*')
    .single();

  if (error) throw error;

  await addVisitorLog({
    visitorId,
    action: 'exited',
    role: 'security',
    actorId: user.id || null,
  });

  return data;
};

export const approveVisitor = async (visitorId) => {
  const user = getCurrentUser();
  const role = getCurrentRole();
  const by = role === 'admin' ? 'admin' : 'resident';

  const { data, error } = await supabase
    .from('visitors')
    .update({
      approved: true,
      status: VISITOR_STATUS.INSIDE,
      approval_method: by,
      approved_by: user.name || by,
    })
    .eq('id', visitorId)
    .select('*')
    .single();

  if (error) throw error;

  await addVisitorLog({
    visitorId,
    action: 'approved',
    role: by,
    actorId: user.id || null,
  });

  return data;
};

export const rejectVisitor = async (visitorId) => {
  const user = getCurrentUser();
  const role = getCurrentRole();
  const by = role === 'admin' ? 'admin' : 'resident';

  const { data, error } = await supabase
    .from('visitors')
    .update({
      approved: false,
      status: VISITOR_STATUS.CANCELLED,
      approval_method: by,
      approved_by: user.name || by,
    })
    .eq('id', visitorId)
    .select('*')
    .single();

  if (error) throw error;

  await addVisitorLog({
    visitorId,
    action: 'rejected',
    role: by,
    actorId: user.id || null,
  });

  return data;
};

export const listVisitors = async () => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const listVisitorsForFlat = async (flatNumber) => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('flat_number', flatNumber)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listPendingApprovalsForFlat = async (flatNumber) => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('flat_number', flatNumber)
    .eq('status', VISITOR_STATUS.WAITING)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const computeVisitorAnalytics = (rows, range = '7') => {
  const now = new Date();
  const days = Number(range);
  const filtered = range === 'all'
    ? rows
    : rows.filter((row) => new Date(row.created_at) >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000));

  const total = filtered.length;
  const approvals = filtered.filter((r) => r.approved).length;
  const entriesCompleted = filtered.filter((r) => r.status === VISITOR_STATUS.EXITED).length;
  const currentlyInside = filtered.filter((r) => r.status === VISITOR_STATUS.INSIDE || r.status === VISITOR_STATUS.WAITING).length;
  const uniqueVisitors = new Set(filtered.map((r) => `${safeLower(r.visitor_name)}-${String(r.phone_number || '')}`)).size;

  const totalStayMins = filtered
    .filter((r) => r.entry_time && r.exit_time)
    .reduce((sum, r) => sum + ((new Date(r.exit_time) - new Date(r.entry_time)) / 60000), 0);
  const stayCount = filtered.filter((r) => r.entry_time && r.exit_time).length;
  const avgStayMinutes = stayCount ? Math.round(totalStayMins / stayCount) : 0;

  const perDayMap = {};
  const perFlatMap = {};
  const perHourMap = {};
  const purposeMap = {};

  filtered.forEach((r) => {
    const d = new Date(r.created_at);
    const day = d.toISOString().split('T')[0];
    const hour = String(d.getHours()).padStart(2, '0');

    perDayMap[day] = (perDayMap[day] || 0) + 1;
    perFlatMap[r.flat_number] = (perFlatMap[r.flat_number] || 0) + 1;
    perHourMap[hour] = (perHourMap[hour] || 0) + 1;
    purposeMap[r.purpose] = (purposeMap[r.purpose] || 0) + 1;
  });

  const peakVisitDay = Object.entries(perDayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return {
    totalVisitors: total,
    totalApprovals: approvals,
    entriesCompleted,
    visitorsCurrentlyInside: currentlyInside,
    conversionRate: total ? Math.round((entriesCompleted / total) * 100) : 0,
    averageStayMinutes: avgStayMinutes,
    peakVisitDay,
    uniqueVisitors,
    visitorsPerDay: Object.entries(perDayMap).map(([date, count]) => ({ date, count })),
    visitorsPerFlat: Object.entries(perFlatMap).map(([flat, count]) => ({ flat, count })),
    peakVisitingHours: Object.entries(perHourMap).map(([hour, count]) => ({ hour: `${hour}:00`, count })),
    purposeBreakdown: Object.entries(purposeMap).map(([purpose, count]) => ({ purpose, count })),
  };
};

export const toCsv = (rows) => {
  const headers = [
    'Visitor Name', 'Phone Number', 'Flat Number', 'Purpose', 'Visitor Type',
    'Vehicle Number', 'Entry Time', 'Exit Time', 'Status', 'Approval Method', 'Approved'
  ];

  const body = rows.map((r) => [
    r.visitor_name,
    r.phone_number,
    r.flat_number,
    r.purpose,
    r.visitor_type,
    r.vehicle_number || '',
    r.entry_time || '',
    r.exit_time || '',
    r.status,
    r.approval_method,
    r.approved ? 'Yes' : 'No',
  ]);

  return [headers, ...body]
    .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

export const downloadTextFile = (fileName, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const subscribeVisitorRealtime = (onChange) => {
  const channel = supabase
    .channel(`visitors-realtime-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_settings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_logs' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
