import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateCredential } from '../../firebase/credentialService';
import { createSociety } from '../../firebase/societyService';
import { updateUserProfile } from '../../firebase/userService';
import './AuthPages.css';

const CreateSocietyPage = () => {
    const [form, setForm] = useState({
        societyName: '',
        location: '',
        adminEmail: '',
        password: '',
        confirmPassword: '',
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user, signIn } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const onChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!form.societyName.trim() || !form.location.trim()) {
            setErrorMsg('Society name and location are required.');
            return;
        }
        if (!form.adminEmail.trim()) {
            setErrorMsg('Admin email is required.');
            return;
        }
        if (form.password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create admin Firebase Auth user + user doc (temporary societyId placeholder)
            const { uid } = await generateCredential({
                societyId: '__pending__',
                email: form.adminEmail.trim(),
                role: 'admin',
                name: 'Society Admin',
                password: form.password,
            });

            // 2. Create society doc in Firestore
            const societyId = await createSociety({
                name: form.societyName.trim(),
                location: form.location.trim(),
                adminUid: uid,
            });

            // 3. Update admin user doc with the real societyId
            await updateUserProfile(uid, { societyId });

            // 4. Sign in as admin
            const { error } = await signIn(form.adminEmail.trim(), form.password);
            if (error) throw new Error(error.message);

            // 5. Redirect to onboarding
            navigate('/admin/onboarding', { replace: true });
        } catch (err) {
            const msg = err.message || '';
            if (msg.includes('email-already-in-use')) {
                setErrorMsg('This email is already registered. Please login instead.');
            } else {
                setErrorMsg(msg || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide">
                <div className="auth-logo">
                    <span className="auth-logo-icon">🏢</span>
                    <h1 className="auth-brand">CIVIORA</h1>
                    <p className="auth-tagline">Society Management Platform</p>
                </div>

                <h2 className="auth-title">Create New Society</h2>
                <p className="auth-subtitle">Set up your society and start managing in minutes</p>

                {errorMsg && (
                    <div className="auth-error">
                        <span>⚠️ {errorMsg}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field-row">
                        <div className="auth-field">
                            <label htmlFor="cs-name">Society Name</label>
                            <input
                                id="cs-name"
                                name="societyName"
                                type="text"
                                placeholder="e.g. Green Valley Residency"
                                required
                                value={form.societyName}
                                onChange={onChange}
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="cs-location">Location</label>
                            <input
                                id="cs-location"
                                name="location"
                                type="text"
                                placeholder="e.g. Jodhpur, Rajasthan"
                                required
                                value={form.location}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="cs-email">Admin Email</label>
                        <input
                            id="cs-email"
                            name="adminEmail"
                            type="email"
                            placeholder="admin@yoursociety.com"
                            required
                            autoComplete="email"
                            value={form.adminEmail}
                            onChange={onChange}
                        />
                    </div>

                    <div className="auth-field-row">
                        <div className="auth-field">
                            <label htmlFor="cs-password">Password</label>
                            <input
                                id="cs-password"
                                name="password"
                                type="password"
                                placeholder="Min. 6 characters"
                                required
                                autoComplete="new-password"
                                value={form.password}
                                onChange={onChange}
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="cs-confirm">Confirm Password</label>
                            <input
                                id="cs-confirm"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repeat password"
                                required
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-btn auth-btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Society…' : 'Create Society & Continue'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default CreateSocietyPage;
