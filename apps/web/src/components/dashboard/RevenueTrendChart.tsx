'use client';

import { useQuery } from '@apollo/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useAppSelector } from '@/store';
import { REVENUE_TREND } from '@/graphql/queries';
import { formatCurrency, formatShortDate } from '@/lib/formatters';
import type { TrendPoint } from '@/types';

export default function RevenueTrendChart() {
  const { startDate, endDate, period } = useAppSelector((s) => s.dashboard);

  const { data, loading, error } = useQuery<{ revenueTrend: TrendPoint[] }>(REVENUE_TREND, {
    variables: { period, startDate, endDate },
  });

  if (loading) {
    return <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (error) {
    return (
      <div className="h-72 flex items-center justify-center text-red-600 text-sm">
        Failed to load chart: {error.message}
      </div>
    );
  }

  const points = data?.revenueTrend ?? [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue &amp; Orders Trend</h2>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={points} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders']
            }
            labelFormatter={formatShortDate}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            fill="url(#colorRevenue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
