'use client';

import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { SALES_OVERVIEW } from '@/graphql/queries';
import MetricCard from '@/components/ui/MetricCard';
import type { SalesOverview as SalesOverviewType } from '@/types';

export default function SalesOverview() {
  const { startDate, endDate } = useAppSelector((s) => s.dashboard);

  const { data, loading, error } = useQuery<{ salesOverview: SalesOverviewType }>(SALES_OVERVIEW, {
    variables: { startDate, endDate },
  });

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
        Failed to load overview: {error.message}
      </div>
    );
  }

  const ov = data!.salesOverview;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        data-testid="metric-revenue"
        title="Total Revenue"
        value={ov.totalRevenue}
        format="currency"
        change={ov.revenueChange}
      />
      <MetricCard
        data-testid="metric-orders"
        title="Total Orders"
        value={ov.totalOrders}
        change={ov.ordersChange}
      />
      <MetricCard
        data-testid="metric-aov"
        title="Avg Order Value"
        value={ov.averageOrderValue}
        format="currency"
      />
      <MetricCard
        data-testid="metric-customers"
        title="Total Customers"
        value={ov.totalCustomers}
      />
    </div>
  );
}
