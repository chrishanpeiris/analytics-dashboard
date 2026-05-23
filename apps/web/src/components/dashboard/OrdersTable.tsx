'use client';

import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setOrderStatusFilter } from '@/store/dashboardSlice';
import { ORDERS } from '@/graphql/queries';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { OrdersPage, OrderStatus } from '@/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED:    'bg-indigo-100 text-indigo-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
};

const ALL_STATUSES: Array<OrderStatus | 'ALL'> = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersTable() {
  const dispatch = useAppDispatch();
  const { startDate, endDate, orderStatusFilter } = useAppSelector((s) => s.dashboard);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<{ orders: OrdersPage }>(ORDERS, {
    variables: {
      page,
      limit: 15,
      status: orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
      startDate,
      endDate,
    },
  });

  const statusBadge = (status: OrderStatus) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-700 mr-2">Orders</h2>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { dispatch(setOrderStatusFilter(s as OrderStatus | 'ALL')); setPage(1); }}
            data-testid={`filter-${s}`}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              orderStatusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading && <div className="h-64 animate-pulse bg-gray-50" />}
      {error && <p className="p-6 text-red-600 text-sm">Failed to load orders.</p>}
      {data && (
        <>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-center">Items</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.orders.orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50" data-testid="order-row">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{o.customer.name}</p>
                    <p className="text-xs text-gray-400">{o.customer.email}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{o.itemCount}</td>
                  <td className="px-6 py-3">{statusBadge(o.status)}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{data.orders.total} orders</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <span className="px-3 py-1">
                {data.orders.page} / {data.orders.totalPages}
              </span>
              <button
                disabled={page >= data.orders.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
