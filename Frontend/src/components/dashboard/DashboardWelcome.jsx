import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function formatClock(date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function DashboardWelcome() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-indigo-600/90 via-violet-700/90 to-slate-900/95 p-6 shadow-glow sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
            <Sparkles size={14} />
            Smart Queue Command Center
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {greeting}, {user?.userName || 'Admin'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-100/90 sm:text-base">
            Real-time queue intelligence, branch performance, and operational health — all in one premium workspace.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 rounded-xl border border-white/15 bg-black/20 px-5 py-4 backdrop-blur-md sm:items-end">
          <div className="flex items-center gap-2 text-indigo-200">
            <Calendar size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Today</span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-white">{formatClock(now)}</p>
          <p className="text-sm text-indigo-200/90">{formatDate(now)}</p>
        </div>
      </div>
    </motion.div>
  );
}
