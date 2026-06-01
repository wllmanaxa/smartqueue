import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false, padding = true, ...props }) {
  const Comp = hover ? motion.div : 'div';
  const motionProps = hover
    ? { whileHover: { y: -3, transition: { duration: 0.2 } } }
    : {};

  return (
    <Comp
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 ${padding ? 'p-6' : ''} ${hover ? 'transition-shadow hover:shadow-elevated' : ''} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Comp>
  );
}
