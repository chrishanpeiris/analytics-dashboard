/**
 * Formatting utilities — pure functions, easy to unit test.
 * These are the functions covered by Jest unit tests in __tests__/utils/formatters.test.ts
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(isoString: string): string {
  // Handles both full ISO strings and YYYY-MM date keys from trend data
  const d = isoString.length === 7 ? new Date(`${isoString}-01`) : new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: isoString.length === 7 ? undefined : 'numeric' });
}

export function isPositiveChange(value: number): boolean {
  return value > 0;
}
