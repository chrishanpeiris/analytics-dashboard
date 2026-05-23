import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Period, OrderStatus } from '@/types';

/**
 * dashboardSlice owns UI-only state:
 *   - date range filter
 *   - chart period granularity
 *   - active tab
 *   - orders status filter
 *
 * Server data (metrics, chart data, orders) is owned by Apollo Client cache.
 * This separation is a deliberate architecture decision — one of the first
 * things a senior engineer will ask about in an interview.
 */

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const today = () => new Date().toISOString().slice(0, 10);

export type ActiveTab = 'overview' | 'orders';

interface DashboardState {
  startDate: string;
  endDate: string;
  period: Period;
  activeTab: ActiveTab;
  orderStatusFilter: OrderStatus | 'ALL';
}

const initialState: DashboardState = {
  startDate: thirtyDaysAgo(),
  endDate: today(),
  period: 'DAILY',
  activeTab: 'overview',
  orderStatusFilter: 'ALL',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDateRange(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    setPeriod(state, action: PayloadAction<Period>) {
      state.period = action.payload;
    },
    setActiveTab(state, action: PayloadAction<ActiveTab>) {
      state.activeTab = action.payload;
    },
    setOrderStatusFilter(state, action: PayloadAction<OrderStatus | 'ALL'>) {
      state.orderStatusFilter = action.payload;
    },
  },
});

export const { setDateRange, setPeriod, setActiveTab, setOrderStatusFilter } = dashboardSlice.actions;
export default dashboardSlice.reducer;
