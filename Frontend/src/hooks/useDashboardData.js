import { useCallback, useEffect, useMemo, useState } from 'react';
import { branchesApi, countersApi, reportsApi, ticketsApi, usersApi } from '../api/services';
import { getHubBaseUrl } from '../api/config';
import { getApiError } from '../api/helpers';

const FALLBACK_WEEKLY = [
  { name: 'Mon', tickets: 42, completed: 38, traffic: 120 },
  { name: 'Tue', tickets: 58, completed: 51, traffic: 145 },
  { name: 'Wed', tickets: 47, completed: 44, traffic: 132 },
  { name: 'Thu', tickets: 63, completed: 59, traffic: 168 },
  { name: 'Fri', tickets: 71, completed: 65, traffic: 190 },
  { name: 'Sat', tickets: 38, completed: 35, traffic: 98 },
  { name: 'Sun', tickets: 29, completed: 27, traffic: 76 },
];

const FALLBACK_SERVICES = [
  { name: 'General', value: 35 },
  { name: 'Billing', value: 22 },
  { name: 'Support', value: 18 },
  { name: 'Consultation', value: 15 },
  { name: 'Other', value: 10 },
];

function aggregateServiceDistribution(tickets) {
  const map = {};
  tickets.forEach((t) => {
    const name = t.serviceName || 'Unknown';
    map[name] = (map[name] || 0) + 1;
  });
  const entries = Object.entries(map).map(([name, value]) => ({ name, value }));
  return entries.length ? entries : FALLBACK_SERVICES;
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [stats, setStats] = useState(null);
  const [branchStats, setBranchStats] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [weeklyChart, setWeeklyChart] = useState([]);
  const [trafficChart, setTrafficChart] = useState([]);
  const [serviceChart, setServiceChart] = useState([]);
  const [openCounters, setOpenCounters] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [apiHealth, setApiHealth] = useState({ status: 'checking', ms: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const healthStart = performance.now();

    try {
      const hubRoot = getHubBaseUrl();
      const healthUrl = hubRoot ? `${hubRoot}/health` : '/health';
      const healthRes = await fetch(healthUrl).catch(() => null);
      setApiHealth({
        status: healthRes?.ok ? 'healthy' : 'degraded',
        ms: Math.round(performance.now() - healthStart),
      });
    } catch {
      setApiHealth({ status: 'degraded', ms: null });
    }

    try {
      const [bStats, ticketsPage, usersPage] = await Promise.all([
        reportsApi.branchStats(),
        ticketsApi.list({ pageNumber: 1, pageSize: 20 }),
        usersApi.list({ pageNumber: 1, pageSize: 100 }).catch(() => ({ items: [] })),
      ]);

      const branches = Array.isArray(bStats) ? bStats : [];
      const tickets = ticketsPage?.items || [];
      const firstBranch = branches[0];

      setBranchStats(branches);
      setRecentTickets(tickets);
      setActiveUsers((usersPage?.items || []).filter((u) => u.isActive !== false).length);
      setServiceChart(aggregateServiceDistribution(tickets));

      const totalOpen = branches.reduce((sum, b) => sum + (b.counters || 0), 0);
      setOpenCounters(totalOpen);

      if (firstBranch?.branchId) {
        setBranchId(firstBranch.branchId);
        const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
        const to = new Date().toISOString().slice(0, 10);
        const today = to;

        const [q, daily, peak, countersPage] = await Promise.all([
          reportsApi.queueStats(firstBranch.branchId),
          reportsApi.daily({ branchId: firstBranch.branchId, from, to }),
          reportsApi.peakHours({ branchId: firstBranch.branchId, day: today }).catch(() => []),
          countersApi
            .list({ branchId: firstBranch.branchId, activeOnly: true, pageNumber: 1, pageSize: 100 })
            .catch(() => ({ items: [] })),
        ]);

        setStats(q);
        setOpenCounters((countersPage?.items || []).length || totalOpen);

        const dailyArr = Array.isArray(daily) ? daily : [];
        const weekly =
          dailyArr.length > 0
            ? dailyArr.map((d) => ({
                name: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
                tickets: d.totalTickets,
                completed: d.completed,
                traffic: d.totalTickets * 3 + d.completed,
              }))
            : FALLBACK_WEEKLY;
        setWeeklyChart(weekly);

        const peakArr = Array.isArray(peak) ? peak : [];
        const traffic =
          peakArr.length > 0
            ? peakArr.map((p) => ({
                name: `${String(p.hour).padStart(2, '0')}:00`,
                traffic: p.ticketCount,
              }))
            : FALLBACK_WEEKLY.map((d, i) => ({ name: `${8 + i * 2}:00`, traffic: d.traffic }));
        setTrafficChart(traffic);

        if (!dailyArr.length) setServiceChart(FALLBACK_SERVICES);
      } else {
        setStats({ waiting: 12, serving: 4, completedToday: 28, skippedToday: 2 });
        setWeeklyChart(FALLBACK_WEEKLY);
        setTrafficChart(FALLBACK_WEEKLY.map((d, i) => ({ name: `${8 + i * 2}:00`, traffic: d.traffic })));
        setServiceChart(FALLBACK_SERVICES);
      }
    } catch (e) {
      setError(getApiError(e));
      setStats({ waiting: 12, serving: 4, completedToday: 28, skippedToday: 2 });
      setWeeklyChart(FALLBACK_WEEKLY);
      setTrafficChart(FALLBACK_WEEKLY.map((d, i) => ({ name: `${8 + i * 2}:00`, traffic: d.traffic })));
      setServiceChart(FALLBACK_SERVICES);
      setBranchStats([
        { branchName: 'Main', activeTickets: 16, counters: 4, services: 6 },
        { branchName: 'North', activeTickets: 9, counters: 3, services: 4 },
        { branchName: 'South', activeTickets: 7, counters: 2, services: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const derived = useMemo(() => {
    const waiting = stats?.waiting ?? 0;
    const serving = stats?.serving ?? 0;
    const completedToday = stats?.completedToday ?? 0;
    const activeTickets = waiting + serving;
    const avgWait =
      recentTickets.length > 0
        ? Math.round(
            recentTickets
              .filter((t) => t.status === 'Waiting')
              .reduce((s, t) => s + (t.estimatedWaitMinutes ?? 0), 0) /
              Math.max(recentTickets.filter((t) => t.status === 'Waiting').length, 1)
          )
        : 14;

    const servingTickets = recentTickets.filter((t) => t.status === 'Serving');
    const waitingTickets = recentTickets.filter((t) => t.status === 'Waiting');
    const completedRecent = recentTickets.filter((t) => t.status === 'Completed').slice(0, 5);
    const calledRecent = recentTickets.filter((t) => t.status === 'Serving' || t.calledAt).slice(0, 5);

    return {
      waiting,
      serving,
      completedToday,
      activeTickets,
      avgWait,
      skippedToday: stats?.skippedToday ?? 0,
      servingTickets,
      waitingTickets,
      completedRecent,
      calledRecent,
      queueCount: waitingTickets.length,
    };
  }, [stats, recentTickets]);

  return {
    loading,
    error,
    branchId,
    stats,
    branchStats,
    recentTickets,
    weeklyChart,
    trafficChart,
    serviceChart,
    openCounters,
    activeUsers,
    apiHealth,
    derived,
    reload: load,
  };
}
