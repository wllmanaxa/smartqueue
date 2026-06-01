import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import Button from './Button';

export default function ErrorState({ title = 'Failed to load data', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-12 text-center dark:border-red-900/40 dark:bg-red-950/20">
      <FiAlertCircle className="mb-3 text-4xl text-red-500" />
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{message}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <FiRefreshCw /> Try again
        </Button>
      )}
    </div>
  );
}
