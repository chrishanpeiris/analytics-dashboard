'use client';

import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { TOP_PRODUCTS } from '@/graphql/queries';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import type { ProductMetric } from '@/types';

export default function TopProductsTable() {
  const { startDate, endDate } = useAppSelector((s) => s.dashboard);

  const { data, loading, error } = useQuery<{ topProducts: ProductMetric[] }>(TOP_PRODUCTS, {
    variables: { limit: 8, startDate, endDate },
  });

  if (loading) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />;
  if (error) return <p className="text-red-600 text-sm">Failed to load products.</p>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Top Products by Revenue</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-6 py-3 text-left">Product</th>
            <th className="px-6 py-3 text-left">Category</th>
            <th className="px-6 py-3 text-right">Units</th>
            <th className="px-6 py-3 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data?.topProducts.map((pm) => (
            <tr key={pm.product.id} className="hover:bg-gray-50">
              <td className="px-6 py-3 font-medium text-gray-900">{pm.product.name}</td>
              <td className="px-6 py-3 text-gray-500">{pm.product.category.name}</td>
              <td className="px-6 py-3 text-right text-gray-600">{formatNumber(pm.unitsSold)}</td>
              <td className="px-6 py-3 text-right font-medium text-gray-900">{formatCurrency(pm.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
