'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { setDateRange, setPeriod } from '@/store/dashboardSlice';
import type { Period } from '@/types';

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
];

export default function DateRangePicker() {
  const dispatch = useAppDispatch();
  const { startDate, endDate, period } = useAppSelector((s) => s.dashboard);

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    dispatch(setDateRange({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }));
  }

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="date-range-picker">
      {/* Presets */}
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600"
            data-testid={`preset-${p.label}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => dispatch(setDateRange({ startDate: e.target.value, endDate }))}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          data-testid="input-start-date"
        />
        <span>–</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => dispatch(setDateRange({ startDate, endDate: e.target.value }))}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          data-testid="input-end-date"
        />
      </div>

      {/* Period selector */}
      <div className="flex gap-1 ml-auto">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => dispatch(setPeriod(p.value))}
            data-testid={`period-${p.value}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              period === p.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
