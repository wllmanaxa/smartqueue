import DashboardCard from './DashboardCard';
import Skeleton from '../ui/Skeleton';
import ErrorState from '../ui/ErrorState';

export default function ChartContainer({
  title,
  subtitle,
  children,
  loading,
  error,
  onRetry,
  className = '',
  height = 'h-72',
  delay = 0,
  action,
}) {
  return (
    <DashboardCard className={className} delay={delay}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={height}>
        {loading ? (
          <div className="flex h-full flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="flex-1 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : (
          children
        )}
      </div>
    </DashboardCard>
  );
}
