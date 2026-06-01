import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartContainer from './ChartContainer';
import { CHART_COLORS, chartAxisTick, chartGridStroke, glassTooltipStyle } from './chartConfig';
import EmptyState from '../ui/EmptyState';

function ChartEmpty({ label }) {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState title={label} description="Data will appear as tickets are processed." className="py-8" />
    </div>
  );
}

export function WeeklyTicketsChart({ data, loading, error, onRetry, delay = 0 }) {
  return (
    <ChartContainer
      title="Weekly tickets"
      subtitle="Issued vs completed — last 7 days"
      loading={loading}
      error={error}
      onRetry={onRetry}
      delay={delay}
      className="lg:col-span-2"
    >
      {data?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="weeklyTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="weeklyCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="name" tick={chartAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={glassTooltipStyle} />
            <Area
              type="monotone"
              dataKey="tickets"
              name="Tickets"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#weeklyTickets)"
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#weeklyCompleted)"
              animationDuration={1400}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label="No weekly data" />
      )}
    </ChartContainer>
  );
}

export function DailyTrafficChart({ data, loading, error, onRetry, delay = 0 }) {
  return (
    <ChartContainer title="Daily traffic" subtitle="Hourly ticket volume today" loading={loading} error={error} onRetry={onRetry} delay={delay}>
      {data?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="trafficLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="name" tick={chartAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={glassTooltipStyle} />
            <Line
              type="monotone"
              dataKey="traffic"
              name="Traffic"
              stroke="url(#trafficLine)"
              strokeWidth={3}
              dot={{ r: 3, fill: '#06b6d4' }}
              activeDot={{ r: 6 }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label="No traffic data" />
      )}
    </ChartContainer>
  );
}

export function ServiceDistributionChart({ data, loading, error, onRetry, delay = 0 }) {
  return (
    <ChartContainer title="Service distribution" subtitle="Share by service type" loading={loading} error={error} onRetry={onRetry} delay={delay}>
      {data?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationDuration={1000}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={glassTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label="No service breakdown" />
      )}
    </ChartContainer>
  );
}

export function BranchPerformanceChart({ data, loading, error, onRetry, delay = 0 }) {
  const chartData = (data || []).slice(0, 6).map((b) => ({
    name: (b.branchName || 'Branch').slice(0, 12),
    active: b.activeTickets ?? 0,
    counters: b.counters ?? 0,
  }));

  return (
    <ChartContainer
      title="Branch performance"
      subtitle="Active tickets by location"
      loading={loading}
      error={error}
      onRetry={onRetry}
      delay={delay}
      className="lg:col-span-2"
    >
      {chartData.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <defs>
              <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="name" tick={chartAxisTick} axisLine={false} tickLine={false} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={glassTooltipStyle} />
            <Bar dataKey="active" name="Active tickets" fill="url(#barActive)" radius={[8, 8, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label="No branch data" />
      )}
    </ChartContainer>
  );
}
