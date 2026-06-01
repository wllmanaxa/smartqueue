import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Layers, Monitor, Ticket, UserPlus } from 'lucide-react';
import DashboardCard from './DashboardCard';

const actions = [
  { to: '/tickets', label: 'Add ticket', desc: 'Issue queue number', icon: Ticket, gradient: 'from-indigo-500 to-violet-600' },
  { to: '/branches', label: 'Add branch', desc: 'New location', icon: Building2, gradient: 'from-cyan-500 to-blue-600' },
  { to: '/services', label: 'Add service', desc: 'Queue offering', icon: Layers, gradient: 'from-emerald-500 to-teal-600' },
  { to: '/counters', label: 'Add counter', desc: 'Service desk', icon: Monitor, gradient: 'from-amber-500 to-orange-600' },
  { to: '/users', label: 'Add user', desc: 'Team member', icon: UserPlus, gradient: 'from-rose-500 to-pink-600' },
];

export default function QuickActions({ delay = 0.3 }) {
  return (
    <DashboardCard delay={delay}>
      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Quick actions</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map(({ to, label, desc, icon: Icon, gradient }, i) => (
          <motion.div key={to} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to={to}
              className="group flex items-center gap-3 rounded-xl border border-slate-100/80 bg-slate-50/50 p-3 transition hover:border-primary-500/30 hover:bg-white dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-primary-500/40 dark:hover:bg-white/[0.05]"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md transition group-hover:shadow-lg`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
}
