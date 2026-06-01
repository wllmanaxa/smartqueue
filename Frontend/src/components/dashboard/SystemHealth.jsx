import { Activity, Server, Users, Zap } from 'lucide-react';
import DashboardCard from './DashboardCard';
import Skeleton from '../ui/Skeleton';

function HealthRow({ icon: Icon, label, value, status = 'ok' }) {
  const statusColors = {
    ok: 'text-emerald-500 bg-emerald-500/10',
    warn: 'text-amber-500 bg-amber-500/10',
    bad: 'text-rose-500 bg-rose-500/10',
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100/80 bg-slate-50/50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${statusColors[status]}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

export default function SystemHealth({ apiHealth, activeUsers, queuePerformance, loading, delay = 0.35 }) {
  if (loading) {
    return (
      <DashboardCard delay={delay}>
        <Skeleton className="mb-4 h-5 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="mb-2 h-14 w-full rounded-xl" />
        ))}
      </DashboardCard>
    );
  }

  const apiStatus =
    apiHealth?.status === 'healthy' ? 'Operational' : apiHealth?.status === 'checking' ? 'Checking…' : 'Degraded';
  const apiRowStatus = apiHealth?.status === 'healthy' ? 'ok' : apiHealth?.status === 'checking' ? 'warn' : 'bad';

  return (
    <DashboardCard delay={delay}>
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">System health</h3>
      <div className="space-y-2">
        <HealthRow icon={Server} label="API status" value={apiStatus} status={apiRowStatus} />
        <HealthRow
          icon={Zap}
          label="Response time"
          value={apiHealth?.ms != null ? `${apiHealth.ms} ms` : '—'}
          status={apiHealth?.ms != null && apiHealth.ms < 300 ? 'ok' : 'warn'}
        />
        <HealthRow icon={Users} label="Active users" value={activeUsers} status="ok" />
        <HealthRow icon={Activity} label="Queue performance" value={queuePerformance} status="ok" />
      </div>
    </DashboardCard>
  );
}
