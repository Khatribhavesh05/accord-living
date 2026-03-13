import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPathByRole } from '../../utils/authUtils';
import './AuthPages.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn, user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(getDashboardPathByRole(user.role), { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const { user: loggedInUser, error } = await signIn(email.trim(), password);
            if (error) {
                const msg = error.message || '';
                if (
                    msg.includes('invalid-credential') ||
                    msg.includes('wrong-password') ||
                    msg.includes('user-not-found') ||
                    msg.includes('INVALID_LOGIN_CREDENTIALS')
                ) {
                    setErrorMsg('Invalid email or password.');
                } else {
                    setErrorMsg(msg || 'Login failed. Please try again.');
                }
                return;
            }
            if (loggedInUser) {
                navigate(getDashboardPathByRole(loggedInUser.role), { replace: true });
            }
        } catch (err) {
            setErrorMsg('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <span className="auth-logo-icon">🏢</span>
                    <h1 className="auth-brand">CIVIORA</h1>
                    <p className="auth-tagline">Society Management Platform</p>
                </div>

                <h2 className="auth-title">Login to Your Society</h2>

                {errorMsg && (
                    <div className="auth-error">
                        <span>⚠️ {errorMsg}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="auth-field">
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn auth-btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in…' : 'Login'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    New society?{' '}
                    <Link to="/signup/create-society" className="auth-link">
                        Create Society
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
