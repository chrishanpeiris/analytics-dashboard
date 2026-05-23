import { render, screen } from '@testing-library/react';
import MetricCard from '@/components/ui/MetricCard';

describe('MetricCard', () => {
  it('renders title and formatted currency value', () => {
    render(<MetricCard title="Total Revenue" value={12345.67} format="currency" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345.67')).toBeInTheDocument();
  });

  it('renders formatted number value', () => {
    render(<MetricCard title="Total Orders" value={1500} format="number" />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('shows positive change in green', () => {
    render(
      <MetricCard
        data-testid="metric-test"
        title="Revenue"
        value={1000}
        format="currency"
        change={15.3}
      />,
    );
    const changeEl = screen.getByTestId('metric-test-change');
    expect(changeEl).toHaveTextContent('+15.3%');
    expect(changeEl).toHaveClass('text-green-600');
  });

  it('shows negative change in red', () => {
    render(
      <MetricCard
        data-testid="metric-test"
        title="Revenue"
        value={1000}
        format="currency"
        change={-8.2}
      />,
    );
    const changeEl = screen.getByTestId('metric-test-change');
    expect(changeEl).toHaveTextContent('-8.2%');
    expect(changeEl).toHaveClass('text-red-600');
  });

  it('does not render change indicator when change is not provided', () => {
    render(
      <MetricCard
        data-testid="metric-test"
        title="Customers"
        value={42}
      />,
    );
    expect(screen.queryByTestId('metric-test-change')).not.toBeInTheDocument();
  });
});
