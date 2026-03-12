import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import {
  approveVisitor,
  getCurrentRole,
  getResidentFlat,
  listPendingApprovalsForFlat,
  listVisitorsForFlat,
  rejectVisitor,
  subscribeVisitorRealtime,
  VISITOR_STATUS,
} from '../../utils/visitorService';

const ResidentVisitorApproval = () => {
  const toast = useToast();
  const role = getCurrentRole();
  const flat = getResidentFlat();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!flat) {
      setPending([]);
      setHistory([]);
      return;
    }
    const [p, all] = await Promise.all([
      listPendingApprovalsForFlat(flat),
      listVisitorsForFlat(flat),
    ]);
    setPending(p);
    setHistory(all.filter((row) => row.status !== VISITOR_STATUS.WAITING));
  };

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((err) => toast.error(err.message || 'Failed to load visitor approvals'))
      .finally(() => mounted && setLoading(false));

    const unsub = subscribeVisitorRealtime(() => {
      refresh().catch(() => null);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [flat]);

  const summary = useMemo(() => ({
    pending: pending.length,
    approved: history.filter((h) => h.approved).length,
    rejected: history.filter((h) => h.status === VISITOR_STATUS.CANCELLED).length,
  }), [pending, history]);

  const onApprove = async (id) => {
    try {
      await approveVisitor(id);
      await refresh();
      toast.success('Visitor approved. Security can allow entry now.');
    } catch (error) {
      toast.error(error.message || 'Failed to approve visitor');
    }
  };

  const onReject = async (id) => {
    try {
      await rejectVisitor(id);
      await refresh();
      toast.info('Visitor request rejected.');
    } catch (error) {
      toast.error(error.message || 'Failed to reject visitor');
    }
  };

  if (role !== 'resident') {
    return <Card><div style={{ padding: 20 }}>Unauthorized: resident role required.</div></Card>;
  }

  return (
    <div>
      <PageHeader
        title="Visitor Approval Center"
        subtitle="Approve or reject incoming visitors for your flat"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <Card><div style={{ padding: 16 }}><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Your Flat</div><strong>{flat || 'Not configured'}</strong></div></Card>
        <Card><div style={{ padding: 16 }}><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending Approvals</div><strong>{summary.pending}</strong></div></Card>
        <Card><div style={{ padding: 16 }}><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Approved / Rejected</div><strong>{summary.approved} / {summary.rejected}</strong></div></Card>
      </div>

      <Card>
        <div style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Pending Visitor Requests</h3>
          {loading ? <div>Loading...</div> : pending.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No pending approvals right now.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {pending.map((row) => (
                <div key={row.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{row.visitor_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {row.phone_number} | {row.visitor_type} | Purpose: {row.purpose}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Arrived: {new Date(row.entry_time || row.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Button variant="primary" size="sm" onClick={() => onApprove(row.id)}>Approve</Button>
                      <Button variant="danger" size="sm" onClick={() => onReject(row.id)}>Reject</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Visitor History</h3>
          {history.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No history yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Purpose</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Status</th>
                    <th>Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 25).map((row) => (
                    <tr key={row.id}>
                      <td>{row.visitor_name}</td>
                      <td>{row.purpose}</td>
                      <td>{row.entry_time ? new Date(row.entry_time).toLocaleString() : '-'}</td>
                      <td>{row.exit_time ? new Date(row.exit_time).toLocaleString() : '-'}</td>
                      <td>{row.status}</td>
                      <td>{row.approval_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResidentVisitorApproval;
