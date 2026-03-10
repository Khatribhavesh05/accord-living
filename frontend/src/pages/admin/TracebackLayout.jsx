import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { TracebackNav } from '../../components/ui';
import '../../styles/Traceback.css';

const TracebackLayout = ({ children }) => {
    return (
        <div className="traceback-layout" style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
            <div className="traceback-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {children || <Outlet />}
            </div>
        </div>
    );
};

export default TracebackLayout;