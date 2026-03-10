const ASSETS_KEY = 'civiora_assets_fallback_v1';
const BOOKINGS_KEY = 'civiora_asset_bookings_fallback_v1';
const ASSET_BOOKING_EVENT = 'civiora-asset-booking-updated';

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const readList = (key) => {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(key), []);
};

const writeList = (key, list) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
  window.dispatchEvent(new CustomEvent(ASSET_BOOKING_EVENT, { detail: { key } }));
};

export const getAssetBookingUpdateEvent = () => ASSET_BOOKING_EVENT;

const makeId = (prefix) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getLocalAssets = () => {
  return readList(ASSETS_KEY)
    .slice()
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
};

export const saveLocalAssets = (assets) => {
  writeList(ASSETS_KEY, assets);
};

export const insertLocalAssets = (payload) => {
  const existing = getLocalAssets();
  const items = Array.isArray(payload) ? payload : [payload];

  const created = items.map((row) => ({
    ...row,
    id: row.id || makeId('asset'),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  saveLocalAssets([...created, ...existing]);
  return created;
};

export const updateLocalAsset = (id, updates) => {
  const existing = getLocalAssets();
  const next = existing.map((asset) => (
    String(asset.id) === String(id)
      ? { ...asset, ...updates, updated_at: new Date().toISOString() }
      : asset
  ));
  saveLocalAssets(next);
  return next.find((asset) => String(asset.id) === String(id)) || null;
};

export const deleteLocalAsset = (id) => {
  const existing = getLocalAssets();
  const next = existing.filter((asset) => String(asset.id) !== String(id));
  saveLocalAssets(next);

  const bookings = getLocalBookings();
  const nextBookings = bookings.filter((booking) => String(booking.asset_id) !== String(id));
  saveLocalBookings(nextBookings);
};

export const getLocalBookings = () => {
  return readList(BOOKINGS_KEY)
    .slice()
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
};

export const saveLocalBookings = (bookings) => {
  writeList(BOOKINGS_KEY, bookings);
};

export const insertLocalBooking = (payload) => {
  const existing = getLocalBookings();
  const normalizedStatus = payload.booking_status || payload.status || 'pending';
  const record = {
    ...payload,
    booking_status: normalizedStatus,
    status: normalizedStatus,
    id: payload.id || makeId('booking'),
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalBookings([record, ...existing]);
  return record;
};

export const updateLocalBookingStatus = (id, status) => {
  const existing = getLocalBookings();
  const next = existing.map((booking) => (
    String(booking.id) === String(id)
      ? { ...booking, status, booking_status: status, updated_at: new Date().toISOString() }
      : booking
  ));
  saveLocalBookings(next);
  return next.find((booking) => String(booking.id) === String(id)) || null;
};

export const updateLocalBookingPayment = (id, updates) => {
  const existing = getLocalBookings();
  const next = existing.map((booking) => (
    String(booking.id) === String(id)
      ? { ...booking, ...updates, updated_at: new Date().toISOString() }
      : booking
  ));
  saveLocalBookings(next);
  return next.find((booking) => String(booking.id) === String(id)) || null;
};

export const attachLocalAssetRelation = (booking, assets) => {
  const asset = assets.find((row) => String(row.id) === String(booking.asset_id));
  return {
    ...booking,
    assets: asset
      ? {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          price_per_hour: Number(asset.price_per_hour || 0),
          image_url: asset.image_url || null,
        }
      : booking.assets,
  };
};
