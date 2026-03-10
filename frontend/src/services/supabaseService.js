import { supabase } from '../utils/supabaseClient';

// ─── Profile Service ───────────────────────────────────────────
export const profileService = {
  getAll: () => supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  getByRole: (role) => supabase.from('profiles').select('*').eq('role', role).order('name'),
  getById: (id) => supabase.from('profiles').select('*').eq('id', id).single(),
  getByEmail: (email) => supabase.from('profiles').select('*').eq('email', email).single(),
  update: (id, updates) => supabase.from('profiles').update(updates).eq('id', id).select().single(),
  create: (profile) => supabase.from('profiles').insert(profile).select().single(),
  delete: (id) => supabase.from('profiles').delete().eq('id', id),
};

// ─── Announcement Service ──────────────────────────────────────
export const announcementService = {
  getAll: () => supabase.from('announcements').select('*').order('created_at', { ascending: false }),
  getById: (id) => supabase.from('announcements').select('*').eq('id', id).single(),
  create: (announcement) => supabase.from('announcements').insert(announcement).select().single(),
  update: (id, updates) => supabase.from('announcements').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('announcements').delete().eq('id', id),
  subscribe: (callback) =>
    supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, callback)
      .subscribe(),
};

// ─── Complaint Service ─────────────────────────────────────────
export const complaintService = {
  getAll: () => supabase.from('complaints').select('*, profiles(name, flat_number)').order('created_at', { ascending: false }),
  getByResident: (residentId) => supabase.from('complaints').select('*').eq('resident_id', residentId).order('created_at', { ascending: false }),
  create: (complaint) => supabase.from('complaints').insert(complaint).select().single(),
  update: (id, updates) => supabase.from('complaints').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('complaints').delete().eq('id', id),
  subscribe: (callback) =>
    supabase
      .channel('complaints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, callback)
      .subscribe(),
};

// ─── Bill Service ──────────────────────────────────────────────
export const billService = {
  getAll: () => supabase.from('bills').select('*, profiles(name, flat_number)').order('created_at', { ascending: false }),
  getByResident: (residentId) => supabase.from('bills').select('*').eq('resident_id', residentId).order('created_at', { ascending: false }),
  create: (bill) => supabase.from('bills').insert(bill).select().single(),
  update: (id, updates) => supabase.from('bills').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('bills').delete().eq('id', id),
};

// ─── Payment Service ───────────────────────────────────────────
export const paymentService = {
  getAll: () => supabase.from('payments').select('*, profiles(name, flat_number)').order('created_at', { ascending: false }),
  getByResident: (residentId) => supabase.from('payments').select('*').eq('resident_id', residentId).order('created_at', { ascending: false }),
  create: (payment) => supabase.from('payments').insert(payment).select().single(),
  update: (id, updates) => supabase.from('payments').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('payments').delete().eq('id', id),
};

// ─── Visitor Service ───────────────────────────────────────────
export const visitorService = {
  getAll: () => supabase.from('visitors').select('*').order('created_at', { ascending: false }),
  getByResident: (residentId) => supabase.from('visitors').select('*').eq('resident_id', residentId).order('created_at', { ascending: false }),
  getPreApproved: () => supabase.from('visitors').select('*').eq('is_pre_approved', true).eq('status', 'approved').order('created_at', { ascending: false }),
  create: (visitor) => supabase.from('visitors').insert(visitor).select().single(),
  update: (id, updates) => supabase.from('visitors').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('visitors').delete().eq('id', id),
  subscribe: (callback) =>
    supabase
      .channel('visitors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, callback)
      .subscribe(),
};

// ─── Asset Service ─────────────────────────────────────────────
export const assetService = {
  getAll: () => supabase.from('assets').select('*').order('name'),
  create: (asset) => supabase.from('assets').insert(asset).select().single(),
  update: (id, updates) => supabase.from('assets').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('assets').delete().eq('id', id),
};

// ─── Asset Booking Service ─────────────────────────────────────
export const assetBookingService = {
  getAll: () => supabase.from('asset_bookings').select('*, assets(name), profiles(name, flat_number)').order('created_at', { ascending: false }),
  getByResident: (residentId) => supabase.from('asset_bookings').select('*, assets(name)').eq('resident_id', residentId).order('created_at', { ascending: false }),
  create: (booking) => supabase.from('asset_bookings').insert(booking).select().single(),
  update: (id, updates) => supabase.from('asset_bookings').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('asset_bookings').delete().eq('id', id),
  subscribe: (callback) =>
    supabase
      .channel('asset-bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asset_bookings' }, callback)
      .subscribe(),
};

// ─── Delivery Service ──────────────────────────────────────────
export const deliveryService = {
  getAll: () => supabase.from('deliveries').select('*, profiles(name, flat_number)').order('created_at', { ascending: false }),
  create: (delivery) => supabase.from('deliveries').insert(delivery).select().single(),
  update: (id, updates) => supabase.from('deliveries').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('deliveries').delete().eq('id', id),
  subscribe: (callback) =>
    supabase
      .channel('deliveries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, callback)
      .subscribe(),
};

// ─── Emergency Service ─────────────────────────────────────────
export const emergencyService = {
  getAll: () => supabase.from('emergency_alerts').select('*').order('created_at', { ascending: false }),
  create: (alert) => supabase.from('emergency_alerts').insert(alert).select().single(),
  update: (id, updates) => supabase.from('emergency_alerts').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('emergency_alerts').delete().eq('id', id),
  subscribe: (callback) =>
    supabase
      .channel('emergency-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, callback)
      .subscribe(),
};

// ─── Staff Service ─────────────────────────────────────────────
export const staffService = {
  getAll: () => supabase.from('staff').select('*').order('name'),
  create: (staff) => supabase.from('staff').insert(staff).select().single(),
  update: (id, updates) => supabase.from('staff').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('staff').delete().eq('id', id),
};

// ─── Staff Attendance Service ──────────────────────────────────
export const staffAttendanceService = {
  getAll: () => supabase.from('staff_attendance').select('*, staff(name)').order('created_at', { ascending: false }),
  getByStaff: (staffId) => supabase.from('staff_attendance').select('*').eq('staff_id', staffId).order('created_at', { ascending: false }),
  create: (attendance) => supabase.from('staff_attendance').insert(attendance).select().single(),
  update: (id, updates) => supabase.from('staff_attendance').update(updates).eq('id', id).select().single(),
};

// ─── Committee Service ─────────────────────────────────────────
export const committeeService = {
  getAll: () => supabase.from('committee_members').select('*, profiles(name, flat_number)').order('created_at', { ascending: false }),
  create: (member) => supabase.from('committee_members').insert(member).select().single(),
  update: (id, updates) => supabase.from('committee_members').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('committee_members').delete().eq('id', id),
};

// ─── Expense Service ───────────────────────────────────────────
export const expenseService = {
  getAll: () => supabase.from('expenses').select('*').order('created_at', { ascending: false }),
  create: (expense) => supabase.from('expenses').insert(expense).select().single(),
  update: (id, updates) => supabase.from('expenses').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('expenses').delete().eq('id', id),
};

// ─── Document Service ──────────────────────────────────────────
export const documentService = {
  getAll: () => supabase.from('documents').select('*').order('created_at', { ascending: false }),
  create: (doc) => supabase.from('documents').insert(doc).select().single(),
  update: (id, updates) => supabase.from('documents').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('documents').delete().eq('id', id),
};

// ─── Vehicle Service ───────────────────────────────────────────
export const vehicleService = {
  getAll: () => supabase.from('vehicles').select('*, profiles(name, flat_number)').order('created_at', { ascending: false }),
  getByResident: (residentId) => supabase.from('vehicles').select('*').eq('owner_id', residentId),
  create: (vehicle) => supabase.from('vehicles').insert(vehicle).select().single(),
  update: (id, updates) => supabase.from('vehicles').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('vehicles').delete().eq('id', id),
};

// ─── Vehicle Log Service ───────────────────────────────────────
export const vehicleLogService = {
  getAll: () => supabase.from('vehicle_logs').select('*').order('entry_time', { ascending: false }),
  create: (log) => supabase.from('vehicle_logs').insert(log).select().single(),
  update: (id, updates) => supabase.from('vehicle_logs').update(updates).eq('id', id).select().single(),
};

// ─── Shop Service ──────────────────────────────────────────────
export const shopService = {
  getAll: () => supabase.from('shops').select('*').order('name'),
  create: (shop) => supabase.from('shops').insert(shop).select().single(),
  update: (id, updates) => supabase.from('shops').update(updates).eq('id', id).select().single(),
  delete: (id) => supabase.from('shops').delete().eq('id', id),
};

// ─── Storage Service ───────────────────────────────────────────
export const storageService = {
  upload: async (bucket, path, file) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return data;
  },
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl;
  },
  remove: (bucket, paths) => supabase.storage.from(bucket).remove(paths),
};

// ─── Dashboard Service ─────────────────────────────────────────
export const dashboardService = {
  getAdminStats: async () => {
    const [residents, complaints, payments, announcements] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'resident'),
      supabase.from('complaints').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount').order('created_at', { ascending: false }),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
    ]);

    const totalPayments = (payments.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return {
      totalResidents: residents.count || 0,
      totalComplaints: complaints.count || 0,
      totalRevenue: totalPayments,
      totalAnnouncements: announcements.count || 0,
    };
  },
};
