import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Monitor,
  Timer,
  Users,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import DashboardWelcome from '../../components/dashboard/DashboardWelcome';
import AnimatedStatCard from '../../components/dashboard/AnimatedStatCard';
import {
  WeeklyTicketsChart,
  DailyTrafficChart,
  ServiceDistributionChart,
  BranchPerformanceChart,
} from '../../components/dashboard/DashboardCharts';
import LiveQueueWidget from '../../components/dashboard/LiveQueueWidget';
import RecentActivities from '../../components/dashboard/RecentActivities';
import QuickActions from '../../components/dashboard/QuickActions';
import SystemHealth from '../../components/dashboard/SystemHealth';
import ErrorState from '../../components/ui/ErrorState';

export default function DashboardPage() {
  const {
    loading,
    error,
    weeklyChart,
    trafficChart,
    serviceChart,
    branchStats,
    recentTickets,
    openCounters,
    activeUsers,
    apiHealth,
    derived,
    reload,
  } = useDashboardData();

  const queuePerformance =
    derived.activeTickets > 0
      ? `${Math.round((derived.completedToday / (derived.completedToday + derived.activeTickets)) * 100)}% throughput`
      : 'Optimal';

  return (
    <div className="space-y-6 pb-8 lg:space-y-8">
      <DashboardWelcome />

      {error && !loading && (
        <ErrorState message={error} onRetry={reload} title="Some dashboard data could not be loaded" />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AnimatedStatCard
          title="Waiting customers"
          value={derived.waiting}
          icon={Users}
          accent="amber"
          loading={loading}
          delay={0.05}
        />
        <AnimatedStatCard
          title="Currently serving"
          value={derived.serving}
          icon={Monitor}
          accent="cyan"
          loading={loading}
          delay={0.08}
        />
        <AnimatedStatCard
          title="Completed today"
          value={derived.completedToday}
          icon={CheckCircle2}
          accent="emerald"
          loading={loading}
          delay={0.11}
        />
        <AnimatedStatCard
          title="Active tickets"
          value={derived.activeTickets}
          icon={ClipboardList}
          accent="indigo"
          subtitle={`Skipped today: ${derived.skippedToday}`}
          loading={loading}
          delay={0.14}
        />
        <AnimatedStatCard
          title="Average wait"
          value={derived.avgWait}
          suffix="min"
          icon={Timer}
          accent="violet"
          loading={loading}
          delay={0.17}
        />
        <AnimatedStatCard
          title="Open counters"
          value={openCounters}
          icon={Clock}
          accent="rose"
          loading={loading}
          delay={0.2}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <WeeklyTicketsChart data={weeklyChart} loading={loading} error={error} onRetry={reload} delay={0.1} />
        <DailyTrafficChart data={trafficChart} loading={loading} onRetry={reload} delay={0.15} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ServiceDistributionChart data={serviceChart} loading={loading} onRetry={reload} delay={0.12} />
        <BranchPerformanceChart data={branchStats} loading={loading} onRetry={reload} delay={0.18} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivities
            recentTickets={recentTickets}
            servingTickets={derived.servingTickets}
            completedRecent={derived.completedRecent}
            loading={loading}
          />
        </div>
        <LiveQueueWidget
          servingTickets={derived.servingTickets}
          queueCount={derived.queueCount}
          avgWait={derived.avgWait}
          loading={loading}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <SystemHealth
          apiHealth={apiHealth}
          activeUsers={activeUsers}
          queuePerformance={queuePerformance}
          loading={loading}
        />
      </section>
    </div>
  );
}
