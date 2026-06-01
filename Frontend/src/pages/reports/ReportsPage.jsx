import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { branchesApi, reportsApi } from '../../api/services';

const COLORS = ['#3b82f6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b'];

export default function ReportsPage() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState([]);
  const [peak, setPeak] = useState([]);
  const [staff, setStaff] = useState([]);
  const [queueStats, setQueueStats] = useState(null);

  useEffect(() => {
    branchesApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => {
      setBranches(r.items || []);
      if (r.items?.[0]) setBranchId(r.items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    Promise.all([
      reportsApi.daily({ branchId, from, to }),
      reportsApi.peakHours({ branchId, day: to }),
      reportsApi.staffPerformance({ branchId, from, to }),
      reportsApi.queueStats(branchId),
    ])
      .then(([d, p, s, q]) => {
        setDaily(d || []);
        setPeak(p || []);
        setStaff(s || []);
        setQueueStats(q);
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  const pieData = queueStats
    ? [
        { name: 'Waiting', value: queueStats.waiting },
        { name: 'Serving', value: queueStats.serving },
        { name: 'Completed today', value: queueStats.completedToday },
        { name: 'Skipped today', value: queueStats.skippedToday },
      ]
    : [];

  if (loading && !daily.length) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Daily volume, peak hours, and staff performance</p>
        </div>
        <Select
          className="w-56"
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Daily reports</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="totalTickets" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Total" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Peak hours</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peak}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ticketCount" fill="#6366f1" name="Tickets" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Queue statistics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Staff performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staff} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="userName" width={80} />
                <Tooltip />
                <Bar dataKey="ticketsServed" fill="#06b6d4" name="Tickets served" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
