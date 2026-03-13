import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'sans-serif', background: '#f5f6fa' }}>
                    <div style={{ fontSize: 40 }}>⚠️</div>
                    <h2 style={{ margin: 0, color: '#1e293b' }}>Something went wrong</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
                    <button onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }} style={{ marginTop: 8, padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Go Back</button>
                </div>
            );
        }
        return this.props.children;
    }
}
import { ThemeProvider } from './context/ThemeContext';
import { VisitorProvider } from './context/VisitorContext';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import CreateSocietyPage from './pages/auth/CreateSocietyPage';
import OnboardingDashboard from './pages/admin/OnboardingDashboard';
import AdminLayout from './pages/AdminLayout';
import * as AdminPages from './pages/admin/index';
import ResidentLayout from './pages/ResidentLayout';
import SecurityLayout from './pages/SecurityLayout';
import * as SecurityPages from './pages/security/index';
import * as ResidentPages from './pages/resident/index';

import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
    // TODO: Firebase - set up onAuthStateChanged listener here

    return (
        <ErrorBoundary>
        <ThemeProvider>
            <AuthProvider>
                <VisitorProvider>
                    <ToastProvider>
                        <Router>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup/create-society" element={<CreateSocietyPage />} />
                            <Route
                                path="/admin/onboarding"
                                element={
                                    <ProtectedRoute allowedRoles={['admin']}>
                                        <OnboardingDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Legacy redirects */}
                            <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/resident-dashboard" element={<Navigate to="/resident/dashboard" replace />} />
                            <Route path="/security-dashboard" element={<Navigate to="/security/dashboard" replace />} />
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute allowedRoles={['admin']}>
                                        <AdminLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<AdminPages.AdminDashboard />} />
                                <Route path="residents" element={<AdminPages.ResidentManagement />} />
                                <Route path="maintenance" element={<AdminPages.BillManagement />} />
                                <Route path="staff" element={<AdminPages.StaffManagement />} />
                                <Route path="complaints" element={<AdminPages.ComplaintManagement />} />
                                <Route path="notices" element={<AdminPages.EventsAnnouncements />} />
                                <Route path="emergency" element={<AdminPages.EmergencyManagement />} />
                                <Route path="reports" element={<AdminPages.ReportsAnalytics />} />
                                <Route path="settings" element={<AdminPages.AdminSettings />} />
                                <Route path="attendance" element={<AdminPages.AttendanceLogs />} />
                                <Route path="visitor-records" element={<AdminPages.VisitorRecords />} />
                                <Route path="visitor-settings" element={<AdminPages.VisitorSystemSettings />} />
                            </Route>

                            {/* Resident Nested Routes */}
                            <Route
                                path="/resident"
                                element={
                                    <ProtectedRoute allowedRoles={['resident']}>
                                        <ResidentLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<ResidentPages.ResidentDashboard />} />
                                <Route path="bills" element={<ResidentPages.MyBills />} />
                                <Route path="complaints" element={<ResidentPages.Complaints />} />
                                <Route path="announcements" element={<ResidentPages.Announcements />} />
                                <Route path="documents" element={<ResidentPages.Documents />} />
                                <Route path="emergency-sos" element={<ResidentPages.EmergencySOS />} />
                                <Route path="settings" element={<ResidentPages.ResidentSettings />} />
                                <Route path="visitor-approval" element={<ResidentPages.VisitorPreApproval />} />
                            </Route>

                            <Route
                                path="/security"
                                element={
                                    <ProtectedRoute allowedRoles={['security']}>
                                        <SecurityLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<SecurityPages.SecurityDashboard />} />
                                <Route path="visitors" element={<SecurityPages.VisitorEntry />} />
                                <Route path="settings" element={<SecurityPages.SecuritySettings />} />
                                <Route path="preapproved" element={<SecurityPages.PreApprovedVisitors />} />
                                <Route path="attendance" element={<SecurityPages.StaffAttendance />} />
                                <Route path="emergency-alerts" element={<SecurityPages.EmergencyAlerts />} />
                            </Route>
                        </Routes>
                    </Router>
                </ToastProvider>
            </VisitorProvider>
            </AuthProvider>
        </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
