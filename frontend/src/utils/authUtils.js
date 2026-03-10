import { supabase } from './supabaseClient';

export const ROLE_PATHS = {
  admin: '/admin/dashboard',
  resident: '/resident/dashboard',
  security: '/security/dashboard',
};

const isMissingTableError = (error) => {
  const message = (error?.message || '').toLowerCase();
  return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('does not exist') || message.includes('could not find the table');
};

export const normalizeRole = (role) => {
  const roleValue = String(role || '').toLowerCase().trim();
  if (roleValue === 'admin') return 'admin';
  if (roleValue === 'security' || roleValue === 'guard') return 'security';
  return 'resident';
};

export const getDashboardPathByRole = (role) => ROLE_PATHS[normalizeRole(role)] || ROLE_PATHS.resident;

export const getProfileByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  return data || null;
};

export const isProfileApproved = (profile) => {
  if (!profile) return false;

  if (profile.is_approved === false || profile.approved === false) {
    return false;
  }

  const status = String(profile.status || profile.approval_status || '').toLowerCase();
  if (status.includes('pending') || status.includes('waiting') || status.includes('review')) {
    return false;
  }

  if (status.includes('rejected') || status.includes('blocked') || status.includes('inactive')) {
    return false;
  }

  return true;
};

export const getOrCreateProfile = async (user) => {
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();
  if (!normalizedEmail || !user?.id) {
    return null;
  }

  const existingProfile = await getProfileByEmail(normalizedEmail);
  if (existingProfile) {
    return existingProfile;
  }

  const payload = {
    id: user.id,
    email: normalizedEmail,
    name: user.user_metadata?.full_name || user.user_metadata?.name || normalizedEmail,
    role: 'resident',
    status: 'pending_approval',
  };

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(payload);

  if (insertError && !isMissingTableError(insertError)) {
    throw insertError;
  }

  return await getProfileByEmail(normalizedEmail);
};
