import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/helpers';

function FloatingOrb({ className, delay = 0, duration = 9 }) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      animate={{ y: [0, -28, 0], x: [0, 16, 0], scale: [1, 1.1, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.12]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    />
  );
}

export default function LoginPage() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!userName.trim()) next.userName = 'Username is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    try {
      await login(userName.trim(), password);
      toast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = getApiError(err);
      setSubmitError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-12 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.35),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0f172a] to-indigo-950" />
      <FloatingOrb className="left-[5%] top-[8%] h-80 w-80 bg-indigo-500/25" delay={0} />
      <FloatingOrb className="right-[5%] top-[15%] h-[28rem] w-[28rem] bg-cyan-400/15" delay={1.2} duration={11} />
      <FloatingOrb className="bottom-[5%] left-[25%] h-72 w-72 bg-violet-600/20" delay={0.6} duration={10} />
      <FloatingOrb className="right-[20%] bottom-[20%] h-56 w-56 bg-primary-500/20" delay={2} />
      <GridOverlay />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[460px]"
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
            className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center"
          >
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 to-cyan-400 opacity-40 blur-xl" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-indigo-500 to-cyan-400 text-2xl font-bold tracking-tight text-white shadow-xl shadow-indigo-500/40">
              SQ
            </span>
          </motion.div>
          <h1 className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            Sign in to manage queues, branches, and live operations
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-2xl shadow-black/50 backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />

          <form onSubmit={handleSubmit} className="relative space-y-5" noValidate>
            <div>
              <label htmlFor="userName" className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="userName"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    if (errors.userName) setErrors((prev) => ({ ...prev, userName: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white/[0.04] py-3.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500/35 ${
                    errors.userName ? 'border-red-400/70' : 'border-white/10 hover:border-white/20 focus:border-primary-400/50'
                  }`}
                />
              </div>
              {errors.userName && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-red-400">
                  {errors.userName}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white/[0.04] py-3.5 pl-10 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500/35 ${
                    errors.password ? 'border-red-400/70' : 'border-white/10 hover:border-white/20 focus:border-primary-400/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-red-400">
                  {errors.password}
                </motion.p>
              )}
            </div>

            {submitError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                {submitError}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.985 }}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 via-indigo-500 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <FiArrowRight />
                  </>
                )}
              </span>
            </motion.button>
          </form>
        </motion.div>

        <p className="mt-10 text-center text-xs tracking-wide text-slate-600">
          Smart Queue · Enterprise queue management
        </p>
      </motion.div>
    </div>
  );
}
