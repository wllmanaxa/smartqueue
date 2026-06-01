import { motion } from 'framer-motion';
import { CheckCircle2, Phone, Ticket } from 'lucide-react';
import DashboardCard from './DashboardCard';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';

const statusVariant = {
  Waiting: 'warning',
  Serving: 'cyan',
  Completed: 'success',
  Skipped: 'default',
  Cancelled: 'danger',
};

function ActivityRow({ ticket, icon: Icon, accent }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-xl border border-slate-100/80 bg-slate-50/60 px-3 py-3 transition hover:border-slate-200/80 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/10"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-white">{ticket.ticketNumber}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {ticket.serviceName} · {ticket.branchName}
        </p>
      </div>
      <Badge variant={statusVariant[ticket.status] || 'default'}>{ticket.status}</Badge>
    </motion.div>
  );
}

function Section({ title, items, icon, accent, empty }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h4>
      <div className="space-y-2">
        {items.length ? items.map((t) => <ActivityRow key={t.id} ticket={t} icon={icon} accent={accent} />) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RecentActivities({ recentTickets, servingTickets, completedRecent, loading }) {
  const waiting = recentTickets.filter((t) => t.status === 'Waiting').slice(0, 4);
  const serving = servingTickets.slice(0, 4);
  const completed = completedRecent.slice(0, 4);

  if (loading) {
    return (
      <DashboardCard delay={0.25}>
        <Skeleton className="mb-4 h-5 w-36" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="mb-2 h-14 w-full rounded-xl" />
        ))}
      </DashboardCard>
    );
  }

  return (
    <DashboardCard delay={0.25} className="lg:col-span-2">
      <h3 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">Recent activity</h3>
      <div className="grid gap-6 md:grid-cols-3">
        <Section
          title="Recent tickets"
          items={waiting.length ? waiting : recentTickets.slice(0, 3)}
          icon={Ticket}
          accent="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
          empty="No waiting tickets"
        />
        <Section
          title="Recent calls"
          items={serving}
          icon={Phone}
          accent="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
          empty="No active calls"
        />
        <Section
          title="Completed"
          items={completed}
          icon={CheckCircle2}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          empty="No completions yet"
        />
      </div>
    </DashboardCard>
  );
}
