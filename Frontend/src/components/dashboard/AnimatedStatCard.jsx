import { motion } from 'framer-motion';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import DashboardCard from './DashboardCard';
import Skeleton from '../ui/Skeleton';

const accents = {
  indigo: {
    gradient: 'from-indigo-500 to-violet-600',
    glow: 'shadow-indigo-500/25',
    ring: 'ring-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/25',
    ring: 'ring-cyan-500/30',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/25',
    ring: 'ring-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/25',
    ring: 'ring-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/25',
    ring: 'ring-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400',
  },
  rose: {
    gradient: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/25',
    ring: 'ring-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

export default function AnimatedStatCard({
  title,
  value,
  icon: Icon,
  accent = 'indigo',
  subtitle,
  trend,
  loading,
  delay = 0,
  suffix = '',
}) {
  const style = accents[accent] || accents.indigo;
  const numeric = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animated = useAnimatedCounter(numeric, { enabled: !loading });

  if (loading) {
    return (
      <DashboardCard delay={delay} hover={false}>
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="mt-3 h-3 w-36" />
      </DashboardCard>
    );
  }

  const display = Number.isInteger(numeric) ? animated : animated.toFixed(1);

  return (
    <DashboardCard delay={delay} glow className="group">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br ${style.gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <motion.p
            key={display}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2rem]"
          >
            {display}
            {suffix && <span className="ml-1 text-lg font-semibold text-slate-500">{suffix}</span>}
          </motion.p>
          {subtitle && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          {trend && (
            <p className={`mt-2 text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.gradient} text-white shadow-lg ${style.glow} ring-1 ${style.ring}`}
          >
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
