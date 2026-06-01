import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from './Button';

export default function Pagination({
  pageNumber,
  totalPages,
  totalCount,
  onPrevious,
  onNext,
  disabled,
}) {
  if (totalCount === 0 && !disabled) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <p className="text-slate-500 dark:text-slate-400">
        Page <span className="font-semibold text-slate-700 dark:text-slate-200">{pageNumber}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</span>
        {totalCount != null && (
          <span className="ml-1 text-slate-400">· {totalCount} total</span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={disabled || pageNumber <= 1} onClick={onPrevious}>
          <FiChevronLeft /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || pageNumber >= totalPages}
          onClick={onNext}
        >
          Next <FiChevronRight />
        </Button>
      </div>
    </div>
  );
}
