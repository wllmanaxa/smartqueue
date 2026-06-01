export default function Spinner({ className = 'h-8 w-8' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-primary-600 dark:border-slate-700 dark:border-t-primary-400 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
