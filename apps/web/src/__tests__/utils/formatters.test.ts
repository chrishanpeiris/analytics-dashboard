import { formatCurrency, formatNumber, formatPercent, formatDate, isPositiveChange } from '@/lib/formatters';

describe('formatCurrency', () => {
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats whole numbers with cents', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats decimals correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats large values with commas', () => {
    expect(formatCurrency(1_000_000)).toBe('$1,000,000.00');
  });
});

describe('formatNumber', () => {
  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('adds commas to thousands', () => {
    expect(formatNumber(1500)).toBe('1,500');
  });

  it('formats millions', () => {
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });
});

describe('formatPercent', () => {
  it('shows + prefix for positive values', () => {
    expect(formatPercent(12.5)).toBe('+12.5%');
  });

  it('shows no prefix for negative values', () => {
    expect(formatPercent(-5.3)).toBe('-5.3%');
  });

  it('formats zero without prefix', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('rounds to 1 decimal place', () => {
    expect(formatPercent(12.456)).toBe('+12.5%');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2024-06-15T00:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });
});

describe('isPositiveChange', () => {
  it('returns true for positive numbers', () => {
    expect(isPositiveChange(10)).toBe(true);
  });

  it('returns false for negative numbers', () => {
    expect(isPositiveChange(-5)).toBe(false);
  });

  it('returns false for zero', () => {
    expect(isPositiveChange(0)).toBe(false);
  });
});
