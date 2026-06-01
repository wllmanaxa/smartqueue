import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, loading }) {
  const gradients = {
    primary: 'from-primary-500 to-indigo-600',
    cyan: 'from-cyan-500 to-primary-500',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-500',
    violet: 'from-violet-500 to-indigo-600',
  };

  if (loading) {
    return (
      <Card>
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mt-3 h-3 w-32" />
      </Card>
    );
  }

  return (
    <Card hover className="relative overflow-hidden">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradients[color]} opacity-[0.08]`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {value}
          </motion.p>
          {subtitle && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-xl bg-gradient-to-br ${gradients[color]} p-3 text-white shadow-md`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </Card>
  );
}
