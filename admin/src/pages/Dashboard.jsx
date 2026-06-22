import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, StatCard, Spinner, ErrorNote } from '../components/ui.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats').then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of your XB2BX assistant" />
      <ErrorNote>{error}</ErrorNote>
      {!stats && !error ? (
        <Spinner />
      ) : stats ? (
        <>
          <div className="stat-grid">
            <StatCard label="Conversations" value={stats.conversations} sub={`${stats.messages} messages`} />
            <StatCard label="Leads" value={stats.leads.total} sub={`${stats.leads.qualified} qualified`} />
            <StatCard label="Hot leads" value={stats.leads.hot} sub={`${stats.leads.warm} warm · ${stats.leads.cold} cold`} />
            <StatCard label="RFQs" value={stats.rfqs} />
            <StatCard label="Open tickets" value={stats.tickets.open} sub={`${stats.tickets.total} total`} />
            <StatCard label="Escalations" value={stats.escalations} />
            <StatCard label="Suppliers" value={stats.suppliers} />
            <StatCard label="Products" value={stats.products} />
          </div>
          <p className="muted small">Last updated {new Date(stats.generated_at).toLocaleString()}</p>
        </>
      ) : null}
    </div>
  );
}
