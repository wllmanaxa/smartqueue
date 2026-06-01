import { motion } from 'framer-motion';

export default function DashboardCard({
  children,
  className = '',
  hover = true,
  padding = true,
  glow = false,
  delay = 0,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/70 shadow-glass backdrop-blur-xl dark:border-white/[0.06] dark:bg-slate-900/50 dark:shadow-glass-dark ${
        glow ? 'ring-1 ring-primary-500/20' : ''
      } ${padding ? 'p-5 sm:p-6' : ''} ${hover ? 'transition-shadow hover:shadow-glow' : ''} ${className}`}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/[0.03]" />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
