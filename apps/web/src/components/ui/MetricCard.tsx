import { formatCurrency, formatNumber, formatPercent, isPositiveChange } from '@/lib/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  change?: number;
  'data-testid'?: string;
}

export default function MetricCard({ title, value, format = 'number', change, 'data-testid': testId }: MetricCardProps) {
  const displayValue = format === 'currency' ? formatCurrency(value) : formatNumber(value);
  const positive = change !== undefined ? isPositiveChange(change) : null;

  return (
    <div
      data-testid={testId}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{displayValue}</p>
      {change !== undefined && (
        <p
          className={`mt-1 text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}
          data-testid={testId ? `${testId}-change` : undefined}
        >
          {formatPercent(change)} vs previous period
        </p>
      )}
    </div>
  );
}
