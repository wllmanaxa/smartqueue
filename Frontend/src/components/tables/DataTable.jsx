import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import Spinner from '../ui/Spinner';
import { FiInbox } from 'react-icons/fi';

function TableSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50/90 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 max-w-[120px]" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DataTable({
  columns,
  data = [],
  loading,
  refreshing,
  error,
  onRetry,
  emptyTitle = 'No data yet',
  emptyDescription = 'There are no records to display.',
  keyField = 'id',
}) {
  const colCount = Math.min(columns.length, 6);
  const showInitialSkeleton = loading && !data.length;
  const showOverlay = refreshing && data.length > 0;

  if (showInitialSkeleton) {
    return <TableSkeleton rows={6} cols={colCount} />;
  }

  if (error && !data.length) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <EmptyState icon={FiInbox} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px] dark:bg-slate-900/60">
          <Spinner className="h-8 w-8" />
        </div>
      )}
      {error && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          {error} — showing cached results.{' '}
          {onRetry && (
            <button type="button" className="font-semibold underline" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row[keyField] ?? index}
                className={`border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-primary-50/40 dark:border-slate-800/80 dark:hover:bg-slate-800/50 ${
                  index % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'bg-white dark:bg-slate-900'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
