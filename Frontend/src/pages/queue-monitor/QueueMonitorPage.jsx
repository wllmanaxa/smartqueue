import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as signalR from '@microsoft/signalr';
import { branchesApi, ticketsApi } from '../../api/services';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

import { getHubBaseUrl } from '../../api/config';

function getQueueHubUrl() {
  const base = getHubBaseUrl();
  return base ? `${base}/hubs/queue` : '/hubs/queue';
}

export default function QueueMonitorPage() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [announcement, setAnnouncement] = useState('Welcome — please wait for your number to be called');

  const load = useCallback(async () => {
    if (!branchId) return;
    const res = await ticketsApi.list({
      branchId,
      pageNumber: 1,
      pageSize: 50,
    });
    setTickets(res.items || []);
  }, [branchId]);

  useEffect(() => {
    branchesApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => {
      setBranches(r.items || []);
      if (r.items?.[0]) setBranchId(r.items[0].id);
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!branchId) return;
    const token = localStorage.getItem('accessToken');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getQueueHubUrl()}?access_token=${token}`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    connection.on('queueUpdated', () => load());
    connection
      .start()
      .then(() => connection.invoke('JoinBranch', branchId))
      .catch(() => {});

    return () => {
      connection.stop();
    };
  }, [branchId, load]);

  const serving = tickets.filter((t) => t.status === 'Serving');
  const waiting = tickets.filter((t) => t.status === 'Waiting');

  return (
    <div className="min-h-[calc(100vh-8rem)] rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-primary-900 p-6 text-white shadow-card lg:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Queue Monitor</h1>
          <p className="text-primary-200">Live display</p>
        </div>
        <Select
          className="max-w-xs !border-white/20 !bg-white/10 !text-white"
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-4 text-center text-xl font-medium text-cyan-100 lg:text-2xl"
      >
        {announcement}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-300">Now serving</h2>
          <AnimatePresence mode="popLayout">
            {serving.length ? (
              serving.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 rounded-3xl border-2 border-cyan-400 bg-white/10 p-8 backdrop-blur"
                >
                  <p className="text-6xl font-black tracking-tight lg:text-8xl">{t.ticketNumber}</p>
                  <p className="mt-2 text-2xl text-cyan-200">
                    Counter: <span className="font-bold text-white">{t.counterName || '—'}</span>
                  </p>
                  <p className="text-lg text-slate-300">{t.serviceName}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-4xl font-light text-white/40">—</p>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-300">Waiting</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {waiting.slice(0, 12).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white/5 p-4 text-center backdrop-blur"
              >
                <p className="font-mono text-2xl font-bold lg:text-3xl">{t.ticketNumber}</p>
                <Badge variant="warning" className="mt-2">
                  {t.priority}
                </Badge>
              </motion.div>
            ))}
          </div>
          {!waiting.length && <p className="text-white/40">No customers waiting</p>}
        </section>
      </div>
    </div>
  );
}
