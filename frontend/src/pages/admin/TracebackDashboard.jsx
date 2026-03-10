import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, ArrowUpRight, ArrowDownLeft, 
  CheckCircle, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';
import axios from 'axios';

const TracebackDashboard = () => {
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'matches', 'report'
  const [filter, setFilter] = useState('All');
  const [userRole, setUserRole] = useState(''); // Will be derived if possible or ignored if relying on backend
  
  // Form State
  const [newItem, setNewItem] = useState({ type: 'Lost', category: 'Keys', description: '', location: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, matchesRes] = await Promise.all([
        axios.get('/api/traceback/items'),
        axios.get('/api/traceback/matches')
      ]);
      setItems(itemsRes.data.items || []);
      setMatches(matchesRes.data.matches || []);
    } catch (error) {
      console.error("Error fetching traceback data", error);
    } finally {
      setLoading(false);
    }
  };

  const handeSubmitReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/traceback/items', newItem);
      fetchData();
      setActiveTab('items');
      setNewItem({ type: 'Lost', category: 'Keys', description: '', location: '' });
    } catch (err) {
      alert('Failed to report item');
    }
  };

  const handleClaim = async (itemId, matchId) => {
      try {
          await axios.post('/api/traceback/claims', { itemId, matchId });
          fetchData(); 
          alert('Claim submitted for approval');
      } catch (err) {
          alert('Error claiming item');
      }
  };

  // Stats
  const activeCount = items.filter(i => i.status === 'Open').length;
  const matchCount = matches.length;
  const resolvedCount = items.filter(i => i.status === 'Returned').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Traceback</h1>
          <p className="text-sm text-gray-500 mt-1">Unified Lost & Found Management</p>
        </div>
        <button 
          onClick={() => setActiveTab('report')}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
        >
          <Plus size={16} /> Report New Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KPICard title="Active Reports" value={activeCount} icon={<Clock size={20} className="text-blue-600"/>} />
        <KPICard title="Matches Found" value={matchCount} icon={<CheckCircle size={20} className="text-green-600"/>} />
        <KPICard title="Resolved" value={resolvedCount} icon={<ArrowUpRight size={20} className="text-gray-400"/>} />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <TabButton label="Dashboard Items" active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
        <TabButton label={`Matches (${matches.length})`} active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} />
        <TabButton label="Report Item" active={activeTab === 'report'} onClick={() => setActiveTab('report')} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400"><RefreshCw className="animate-spin"/></div>
      ) : (
        <>
          {activeTab === 'items' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Item & Category</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No items found.</td></tr>
                    ) : (
                        items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                item.type === 'Lost' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                                {item.type === 'Lost' ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                                {item.type}
                            </span>
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{item.category}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{item.description}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{item.location || 'Unknown'}</td>
                            <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                                {new Date(item.dateReported).toLocaleDateString()}
                            </td>
                        </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
             <div className="grid grid-cols-1 gap-4">
                 {matches.length === 0 ? (
                     <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-border">No automated matches found.</div>
                 ) : (
                     matches.map((m, idx) => (
                         <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                             <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">HIGH CONFIDENCE MATCH</span>
                                 </div>
                                 <div className="flex gap-8 text-sm">
                                      <div>
                                          <div className="text-gray-500 text-xs">YOUR ITEM</div>
                                          <div className="font-medium">{m.item.category} - {m.item.type}</div>
                                          <div className="text-gray-400 text-xs">{m.item.description}</div>
                                      </div>
                                      <div className="border-l border-gray-100 pl-8">
                                          <div className="text-gray-500 text-xs">POTENTIAL MATCH</div>
                                          <div className="font-medium">{m.matchedItem.category} - {m.matchedItem.type}</div>
                                          <div className="text-gray-400 text-xs">{m.matchedItem.description}</div>
                                      </div>
                                 </div>
                             </div>
                             <button 
                                onClick={() => handleClaim(m.item.id, m.matchedItem.id)}
                                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition whitespace-nowrap"
                             >
                                 Claim Match
                             </button>
                         </div>
                     ))
                 )}
             </div>
          )}

          {activeTab === 'report' && (
              <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-semibold mb-6">Report a Lost or Found Item</h2>
                  <form onSubmit={handeSubmitReport} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <label className="block p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition has-[:checked]:border-black has-[:checked]:bg-gray-50">
                              <input type="radio" name="type" className="hidden" 
                                checked={newItem.type === 'Lost'} onChange={() => setNewItem({...newItem, type: 'Lost'})} />
                              <span className="block text-center font-medium">I Lost Something</span>
                          </label>
                          <label className="block p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition has-[:checked]:border-black has-[:checked]:bg-gray-50">
                              <input type="radio" name="type" className="hidden" 
                                checked={newItem.type === 'Found'} onChange={() => setNewItem({...newItem, type: 'Found'})} />
                              <span className="block text-center font-medium">I Found Something</span>
                          </label>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                            value={newItem.category}
                            onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                          >
                              <option>Keys</option>
                              <option>Wallet/Purse</option>
                              <option>Electronics</option>
                              <option>Clothing</option>
                              <option>Documents</option>
                              <option>Other</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition h-24"
                            placeholder="Describe the item (color, brand, distinguishing marks)..."
                            value={newItem.description}
                            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                            placeholder="Where was it lost/found?"
                            value={newItem.location}
                            onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                          />
                      </div>

                      <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition mt-2">
                          Submit Report
                      </button>
                  </form>
              </div>
          )}
        </>
      )}
    </div>
  );
};

// Components
const KPICard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
    </div>
);

const TabButton = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`pb-4 text-sm font-medium transition relative ${active ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {label}
        {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full"></div>}
    </button>
);

const StatusBadge = ({ status }) => {
    // "Active" instead of "Searching" for internal representation
    const styles = {
        'Open': 'bg-blue-50 text-blue-700 border-blue-100',
        'Claimed': 'bg-amber-50 text-amber-700 border-amber-100',
        'Returned': 'bg-green-50 text-green-700 border-green-100',
        'Active': 'bg-blue-50 text-blue-700 border-blue-100'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles['Open']}`}>
            {status}
        </span>
    );
};

export default TracebackDashboard;
