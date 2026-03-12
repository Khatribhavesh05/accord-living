import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard } from 'lucide-react';


/**
 * TracebackNav - Navigation component for Traceback module
 * Provides Home and Dashboard navigation buttons
 */
const TracebackNav = () => {
    const navigate = useNavigate();
    const location = useLocation();


    // Navigation handlers (no-op after Traceback removal)
    const handleHome = () => {
        navigate('/');
    };
    const handleDashboard = () => {
        navigate('/');
    };

    return (
        <div className="traceback-nav">
            <button onClick={handleHome} className="traceback-nav-btn">
                <Home size={18} />
                <span>Home</span>
            </button>

            <button onClick={handleDashboard} className="traceback-nav-btn">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
            </button>
        </div>
    );
};

export default TracebackNav;
