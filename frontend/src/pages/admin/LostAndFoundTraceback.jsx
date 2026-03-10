import React from 'react';
import { Link } from 'react-router-dom';
import { TracebackNav } from '../../components/ui';

const LostAndFoundTraceback = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Lost & Found Traceback</h1>
            <TracebackNav />
            <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Link to="report-lost" className="p-4 border rounded shadow hover:bg-gray-50 flex flex-col items-center justify-center h-32">
                    <span className="text-xl mb-2">📢</span>
                    <span className="font-semibold">Report Lost Item</span>
                </Link>
                <Link to="report-found" className="p-4 border rounded shadow hover:bg-gray-50 flex flex-col items-center justify-center h-32">
                    <span className="text-xl mb-2">🔍</span>
                    <span className="font-semibold">Report Found Item</span>
                </Link>
                <Link to="matches" className="p-4 border rounded shadow hover:bg-gray-50 flex flex-col items-center justify-center h-32">
                    <span className="text-xl mb-2">🧩</span>
                    <span className="font-semibold">View Matches</span>
                </Link>
            </div>
        </div>
    );
};

export default LostAndFoundTraceback;
