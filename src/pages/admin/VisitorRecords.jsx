import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import {
  addToBlacklist,
  downloadTextFile,
  getCurrentRole,
  listVisitors,
  subscribeVisitorRealtime,
  toCsv,
} from '../../utils/visitorService';

const VisitorRecords = () => {
  const toast = useToast();
  const role = getCurrentRole();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [flat, setFlat] = useState('');
  const [type, setType] = useState('all');
  const [date, setDate] = useState('');

  const refresh = async () => {
    const data = await listVisitors();
    setRows(data);
  };

  useEffect(() => {
    refresh().catch((err) => toast.error(err.message || 'Failed to load visitor records'));
    const unsub = subscribeVisitorRealtime(() => {
      refresh().catch(() => null);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => rows.filter((row) => {
    const s = search.trim().toLowerCase();
    const matchSearch = !s || [row.visitor_name, row.phone_number, row.purpose, row.flat_number].some((x) => String(x || '').toLowerCase().includes(s));
    const matchFlat = !flat.trim() || String(row.flat_number || '').toLowerCase().includes(flat.trim().toLowerCase());
    const matchType = type === 'all' || row.visitor_type === type;
    const matchDate = !date || String(row.created_at || '').startsWith(date);
    return matchSearch && matchFlat && matchType && matchDate;
  }), [rows, search, flat, type, date]);

  const exportCsv = () => {
    const csv = toCsv(filtered);
    downloadTextFile(`visitor-records-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const exportExcel = () => {
    const csv = toCsv(filtered);
    const html = `<html><body><table border="1">${csv.split('\n').map((line) => `<tr>${line.split(',').map((cell) => `<td>${cell.replace(/^"|"$/g, '')}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
    downloadTextFile(`visitor-records-${Date.now()}.xls`, html, 'application/vnd.ms-excel');
  };

  const onBlacklist = async (row) => {
    const reason = window.prompt('Blacklist reason for this visitor:', 'Security policy violation');
    if (!reason) return;
    try {
      await addToBlacklist({
        visitor_name: row.visitor_name,
        phone_number: row.phone_number,
        reason,
      });
      toast.success('Visitor added to blacklist.');
    } catch (error) {
      toast.error(error.message || 'Failed to blacklist visitor');
    }
  };

  if (role !== 'admin') {
    return <Card><div style={{ padding: 20 }}>Unauthorized: admin role required.</div></Card>;
  }

  return (
    <div>
      <PageHeader title="Visitor Records" subtitle="Search, filter, and export complete visitor history" />

      <Card>
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto auto', gap: 8 }}>
            <input placeholder="Search visitor / phone / purpose / flat" value={search} onChange={(e) => setSearch(e.target.value)} />
            <input placeholder="Filter by flat" value={flat} onChange={(e) => setFlat(e.target.value)} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Guest">Guest</option>
              <option value="Delivery">Delivery</option>
              <option value="Service">Service</option>
            </select>
            <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
            <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Flat Number</th>
                  <th>Purpose</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Status</th>
                  <th>Approval Method</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.visitor_name}</td>
                    <td>{row.flat_number}</td>
                    <td>{row.purpose}</td>
                    <td>{row.entry_time ? new Date(row.entry_time).toLocaleString() : '-'}</td>
                    <td>{row.exit_time ? new Date(row.exit_time).toLocaleString() : '-'}</td>
                    <td>{row.status}</td>
                    <td>{row.approval_method}</td>
                    <td>{row.visitor_type}</td>
                    <td><Button variant="danger" size="sm" onClick={() => onBlacklist(row)}>Blacklist</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VisitorRecords;
