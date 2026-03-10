import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { profileService } from '../services/supabaseService';

const AuthContext = createContext(null);

const DEMO_USERS = {
  'admin@society.local': { password: 'Admin@12345', role: 'admin', name: 'Demo Admin', id: 'demo-admin' },
  'resident1@society.local': { password: 'Resident@123', role: 'resident', name: 'Demo Resident', id: 'demo-resident-1' },
  'security@society.local': { password: 'Security@123', role: 'security', name: 'Demo Security', id: 'demo-security' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Sync with localStorage changes (Login component writes directly)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('user');
        setUser(stored ? JSON.parse(stored) : null);
      } catch { setUser(null); }
    };

    window.addEventListener('storage', handleStorage);

    // Also poll for same-tab changes (storage event doesn't fire for same-tab)
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        setUser(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(parsed)) return parsed;
          return prev;
        });
      } catch { /* ignore */ }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Only clear if no demo user is active
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!parsed.id?.startsWith('demo-')) {
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch { /* ignore */ }
        }
      }
      setLoading(false);
    });

    setLoading(false);
    return () => subscription?.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Demo user check
    const demo = DEMO_USERS[normalizedEmail];
    if (demo && demo.password === password) {
      const userData = { id: demo.id, email: normalizedEmail, name: demo.name, role: demo.role };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { user: userData, error: null };
    }

    // Real Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) return { user: null, error };

    const sessionUser = data.session?.user;
    if (sessionUser) {
      const { data: profile } = await profileService.getByEmail(normalizedEmail);
      const userData = {
        id: sessionUser.id,
        email: normalizedEmail,
        name: profile?.name || sessionUser.user_metadata?.full_name || normalizedEmail,
        role: profile?.role || 'resident',
        flat_number: profile?.flat_number || '',
        phone: profile?.phone || '',
        avatar_url: profile?.avatar_url || '',
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { user: userData, error: null };
    }

    return { user: null, error: { message: 'No session returned' } };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('user');
    setUser(null);
    await supabase.auth.signOut().catch(() => {});
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return;
    try {
      if (!user.id.startsWith('demo-')) {
        await profileService.update(user.id, updates);
      }
      const newUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      console.error('updateProfile error:', err);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a fallback so pages don't crash outside AuthProvider
    return {
      user: (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })(),
      loading: false,
      signIn: async () => ({ user: null, error: { message: 'AuthProvider not mounted' } }),
      signInWithGoogle: async () => ({ error: { message: 'AuthProvider not mounted' } }),
      signOut: async () => { localStorage.removeItem('user'); },
      updateProfile: async () => {},
    };
  }
  return context;
}

export default AuthContext;
