/**
 * Traceback API Service — All Lost & Found operations via backend Supabase
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const apiFetch = async (url, options = {}) => {
    // Detect current portal from URL path and send the correct role's user info
    const userHeaders = {};
    try {
        const path = window.location.pathname;
        let roleKey = 'user'; // default fallback
        if (path.startsWith('/admin')) roleKey = 'user_admin';
        else if (path.startsWith('/security')) roleKey = 'user_security';
        else if (path.startsWith('/resident')) roleKey = 'user_resident';

        const storedUser = localStorage.getItem(roleKey) || localStorage.getItem('user');
        if (storedUser) {
            userHeaders['x-user-info'] = storedUser;
        }
    } catch (e) { /* ignore */ }

    const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...userHeaders,
            ...(options.headers || {})
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
};

/** Report a lost or found item */
export const reportItem = (type, itemData) =>
    apiFetch('/api/traceback/items', {
        method: 'POST',
        body: JSON.stringify({
            type,
            category: itemData.category,
            description: itemData.description,
            color: itemData.color || '',
            location: itemData.location || '',
            event_date: itemData.event_date || null,
            image_url: itemData.image_url || '',
            contact: itemData.contact || ''
        })
    });

/** Get all matches, items, and claims for the dashboard */
export const getMatches = (view = 'resident') => apiFetch(`/api/traceback/matches?view=${view}`);

/** Submit a claim for a found item */
export const submitClaim = (itemId, matchId, securityQuestions, securityAnswers, proofImage) =>
    apiFetch('/api/traceback/claim', {
        method: 'POST',
        body: JSON.stringify({
            item_id: itemId,
            match_id: matchId || null,
            security_questions: securityQuestions,
            security_answers: securityAnswers,
            proof_image: proofImage || ''
        })
    });

/** Approve a claim */
export const approveClaim = (claimId) =>
    apiFetch('/api/traceback/approve-claim', {
        method: 'POST',
        body: JSON.stringify({ claim_id: claimId })
    });

/** Reject a claim */
export const rejectClaim = (claimId, reason) =>
    apiFetch('/api/traceback/reject-claim', {
        method: 'POST',
        body: JSON.stringify({ claim_id: claimId, reason: reason || '' })
    });

/** Verify QR token */
export const verifyQR = (token) =>
    apiFetch('/api/traceback/verify-qr', {
        method: 'POST',
        body: JSON.stringify({ token })
    });

/** Get my found items with pending claims */
export const getMyFoundItems = () => apiFetch('/api/traceback/my-found-items');

/** Convert a file to base64 */
export const imageToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});
