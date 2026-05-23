'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveTab } from '@/store/dashboardSlice';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import SalesOverview from '@/components/dashboard/SalesOverview';
import RevenueTrendChart from '@/components/dashboard/RevenueTrendChart';
import TopProductsTable from '@/components/dashboard/TopProductsTable';
import OrdersTable from '@/components/dashboard/OrdersTable';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((s) => s.dashboard.activeTab);

  return (
    <div className="space-y-6">
      {/* Header + date range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            <p className="text-sm text-gray-500">Sales performance at a glance</p>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
            {(['overview', 'orders'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => dispatch(setActiveTab(tab))}
                data-testid={`tab-${tab}`}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <DateRangePicker />
      </div>

      {activeTab === 'overview' && (
        <>
          <SalesOverview />
          <RevenueTrendChart />
          <TopProductsTable />
        </>
      )}

      {activeTab === 'orders' && <OrdersTable />}
    </div>
  );
}
