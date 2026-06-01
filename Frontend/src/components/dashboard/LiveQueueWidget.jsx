import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Clock, Radio, Users } from 'lucide-react';
import DashboardCard from './DashboardCard';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';

const statusVariant = {
  Waiting: 'warning',
  Serving: 'cyan',
  Completed: 'success',
};

export default function LiveQueueWidget({ servingTickets, queueCount, avgWait, loading }) {
  const current = servingTickets?.[0];

  if (loading) {
    return (
      <DashboardCard delay={0.2}>
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard glow delay={0.2} className="border-cyan-500/20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Live queue monitor</h3>
        </div>
        <Link
          to="/queue-monitor"
          className="text-xs font-medium text-primary-600 transition hover:text-primary-500 dark:text-primary-400"
        >
          Open display →
        </Link>
      </div>

      <motion.div
        layout
        className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-violet-500/5 p-5 dark:from-cyan-500/15"
      >
        {current ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Now serving</p>
            <p className="mt-1 font-mono text-3xl font-bold text-slate-900 dark:text-white">{current.ticketNumber}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {current.serviceName}
              {current.counterName ? ` · ${current.counterName}` : ''}
            </p>
            <Badge variant={statusVariant[current.status] || 'cyan'} className="mt-3">
              {current.status}
            </Badge>
          </>
        ) : (
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <Radio className="text-cyan-500" size={28} />
            <p className="text-sm">No ticket currently being served</p>
          </div>
        )}
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-slate-50/80 p-3 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Users size={16} />
            <span className="text-xs font-medium">In queue</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{queueCount}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-slate-50/80 p-3 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock size={16} />
            <span className="text-xs font-medium">Avg. wait</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {avgWait}
            <span className="text-sm font-medium text-slate-500"> min</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Activity size={14} />
        Updates with live ticket activity
      </div>
    </DashboardCard>
  );
}
