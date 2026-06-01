import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  Layers,
  Monitor,
  Settings,
  Tv,
  Users,
} from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/branches', icon: Building2, label: 'Branches' },
  { to: '/services', icon: Layers, label: 'Services' },
  { to: '/counters', icon: Monitor, label: 'Counters' },
  { to: '/tickets', icon: ClipboardList, label: 'Tickets' },
  { to: '/queue-monitor', icon: Tv, label: 'Queue Monitor' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/[0.06] bg-slate-900/95 shadow-sidebar backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-sm font-bold text-white shadow-glow">
          SQ
        </div>
        <div>
          <p className="text-sm font-bold text-white">Smart Queue</p>
          <p className="text-xs text-slate-400">Enterprise Admin</p>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onMobileClose}>
            {({ isActive }) => (
              <div
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-[1] shrink-0" size={20} strokeWidth={isActive ? 2.25 : 2} />
                <span className="relative z-[1]">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
