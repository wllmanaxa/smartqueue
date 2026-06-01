import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiLoader, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = type === 'loading' ? 0 : 4500) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const dismiss = useCallback((id) => {
    remove(id);
  }, [remove]);

  const promise = useCallback(
    async (asyncFn, { loading: loadingMsg = 'Loading...', success, error: errorMsg } = {}) => {
      const id = toast(loadingMsg, 'loading', 0);
      try {
        const result = await asyncFn();
        remove(id);
        if (success) toast(typeof success === 'function' ? success(result) : success, 'success');
        return result;
      } catch (e) {
        remove(id);
        const msg = e?.message || errorMsg || 'Operation failed';
        toast(msg, 'error');
        throw e;
      }
    },
    [toast, remove]
  );

  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    info: FiInfo,
    loading: FiLoader,
  };

  const styles = {
    success: 'border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100',
    error: 'border-red-200/80 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100',
    info: 'border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
    loading: 'border-primary-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss, promise }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-full max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = icons[t.type] || FiInfo;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-elevated ${styles[t.type] || styles.info}`}
              >
                <Icon className={`shrink-0 text-lg ${t.type === 'loading' ? 'animate-spin' : ''}`} />
                <span className="flex-1 text-sm font-medium">{t.message}</span>
                {t.type !== 'loading' && (
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="shrink-0 rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                  >
                    <FiX />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
