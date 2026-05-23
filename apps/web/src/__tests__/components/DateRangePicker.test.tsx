import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '@/store/dashboardSlice';
import DateRangePicker from '@/components/dashboard/DateRangePicker';

function renderWithStore() {
  const store = configureStore({ reducer: { dashboard: dashboardReducer } });
  const utils = render(
    <Provider store={store}>
      <DateRangePicker />
    </Provider>,
  );
  return { ...utils, store };
}

describe('DateRangePicker', () => {
  it('renders preset buttons', () => {
    renderWithStore();
    expect(screen.getByTestId('preset-7d')).toBeInTheDocument();
    expect(screen.getByTestId('preset-30d')).toBeInTheDocument();
    expect(screen.getByTestId('preset-90d')).toBeInTheDocument();
  });

  it('renders period selector buttons', () => {
    renderWithStore();
    expect(screen.getByTestId('period-DAILY')).toBeInTheDocument();
    expect(screen.getByTestId('period-WEEKLY')).toBeInTheDocument();
    expect(screen.getByTestId('period-MONTHLY')).toBeInTheDocument();
  });

  it('highlights active period button', () => {
    renderWithStore();
    // DAILY is the default
    expect(screen.getByTestId('period-DAILY')).toHaveClass('bg-indigo-600');
    expect(screen.getByTestId('period-WEEKLY')).not.toHaveClass('bg-indigo-600');
  });

  it('dispatches setPeriod when a period button is clicked', () => {
    const { store } = renderWithStore();
    fireEvent.click(screen.getByTestId('period-WEEKLY'));
    expect(store.getState().dashboard.period).toBe('WEEKLY');
  });

  it('dispatches setDateRange when preset is clicked', () => {
    const { store } = renderWithStore();
    const before = store.getState().dashboard.startDate;
    fireEvent.click(screen.getByTestId('preset-7d'));
    const after = store.getState().dashboard.startDate;
    // start date should change (become more recent)
    expect(after).not.toBe(before);
  });
});
