import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import Spinner from './Spinner';

export default function Select({
  label,
  options = [],
  error,
  className = '',
  placeholder,
  loading = false,
  emptyMessage = 'No options available',
  value,
  onChange,
  disabled,
  id: idProp,
  ...props
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));
  const hasValue = value !== undefined && value !== null && value !== '';
  const displayLabel = selected?.label ?? (placeholder && !hasValue ? placeholder : '');

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (optValue) => {
    onChange?.({ target: { value: optValue } });
    setOpen(false);
  };

  const triggerClasses = [
    'flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm outline-none transition-all duration-200',
    'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
    'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error ? 'border-red-500' : '',
    !hasValue && placeholder ? 'text-slate-400 dark:text-slate-500' : '',
    open ? 'border-primary-500 ring-2 ring-primary-500/20' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const menu =
    typeof document !== 'undefined' &&
    createPortal(
      <AnimatePresence>
        {open && !disabled && !loading && (
          <motion.ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 9999,
            }}
            className="max-h-60 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/40"
          >
            {options.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</li>
            ) : (
              options.map((o) => {
                const isSelected = String(o.value) === String(value);
                return (
                  <li key={o.value === '' ? '__empty__' : o.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(o.value)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{o.label}</span>
                      {isSelected && <FiCheck className="shrink-0 text-primary-600 dark:text-primary-400" />}
                    </button>
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <label className={`block w-full ${className}`} htmlFor={id}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`${triggerClasses} w-full`}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((prev) => {
            if (!prev) updateMenuPosition();
            return !prev;
          });
        }}
        {...props}
      >
        <span className="min-w-0 flex-1 truncate">{loading ? 'Loading...' : displayLabel}</span>
        {loading ? (
          <Spinner className="h-4 w-4 shrink-0" />
        ) : (
          <FiChevronDown
            className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            size={18}
            aria-hidden
          />
        )}
      </button>
      {menu}
      {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </label>
  );
}
