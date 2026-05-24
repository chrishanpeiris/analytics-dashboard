# Analytics Dashboard — Testing Guide

**Stack:** Jest + React Testing Library + jest-dom (unit) · Cypress (E2E)

---

## Commands

```bash
# From the repo root
npm test                  # Run Jest unit tests
npm run test:e2e          # Run Cypress E2E headlessly

# From apps/web/
npm test                  # Jest unit tests (watch mode off)
npm run test:watch        # Jest watch mode
npm run test:coverage     # Coverage report
npm run cypress:open      # Cypress interactive browser
npm run cypress:run       # Cypress headless (CI)
```

---

## How it's wired up

```
apps/web/
├── jest.config.js          — nextJest wrapper, jsdom env, @/ alias
├── jest.setup.ts           — @testing-library/jest-dom matchers
├── tsconfig.test.json      — TypeScript config for test files
└── src/__tests__/
    ├── components/         — Component tests (RTL)
    └── utils/              — Pure function tests

apps/web/cypress/
├── e2e/                    — Full browser E2E specs
└── support/                — Custom commands and setup
```

`jest.config.js` uses `nextJest({ dir: './' })` which automatically:
- Sets up the `@/` path alias
- Transforms TSX with SWC
- Handles CSS/image imports
- Ignores `cypress/` test files

---

## The three tools

| Tool | What it does |
|---|---|
| **Jest** | Test runner — finds files, runs them, reports results |
| **React Testing Library** | Renders components into jsdom, queries DOM by role/text/label |
| **jest-dom** | Extra assertions: `toBeInTheDocument`, `toHaveClass`, `toHaveTextContent` |
| **Cypress** | Spins up a real browser and drives the full app end-to-end |

---

## Test file locations

```
src/components/ui/MetricCard.tsx     →  src/__tests__/components/MetricCard.test.tsx
src/utils/formatters.ts              →  src/__tests__/utils/formatters.test.ts
cypress/e2e/dashboard.cy.ts          →  (Cypress E2E — already in cypress/e2e/)
```

---

## Pattern 1 — Pure utility function

```ts
// src/__tests__/utils/formatters.test.ts
import { formatCurrency, formatNumber } from '@/utils/formatters';

describe('formatCurrency', () => {
  it('formats a number as USD', () => {
    expect(formatCurrency(12345.67)).toBe('$12,345.67');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

No imports from React or RTL needed — just call the function and assert.

---

## Pattern 2 — React component

```tsx
// src/__tests__/components/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import MetricCard from '@/components/ui/MetricCard';

describe('MetricCard', () => {
  it('renders title and formatted value', () => {
    render(<MetricCard title="Total Revenue" value={12345.67} format="currency" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345.67')).toBeInTheDocument();
  });

  it('shows positive change in green', () => {
    render(
      <MetricCard data-testid="card" title="Revenue" value={1000} format="currency" change={15.3} />,
    );
    const el = screen.getByTestId('card-change');
    expect(el).toHaveTextContent('+15.3%');
    expect(el).toHaveClass('text-green-600');
  });

  it('shows negative change in red', () => {
    render(
      <MetricCard data-testid="card" title="Revenue" value={1000} format="currency" change={-8.2} />,
    );
    expect(screen.getByTestId('card-change')).toHaveClass('text-red-600');
  });

  it('hides the change indicator when no change prop is given', () => {
    render(<MetricCard data-testid="card" title="Customers" value={42} />);
    expect(screen.queryByTestId('card-change')).not.toBeInTheDocument();
  });
});
```

**Most useful `screen` queries:**

| Query | Use when |
|---|---|
| `getByText('...')` | Exactly one element with that text |
| `getByRole('button', { name: /save/i })` | By ARIA role + accessible name |
| `getByTestId('...')` | When there's no better semantic query (last resort) |
| `queryByText('...')` | Checking something is **not** there (returns null, doesn't throw) |
| `findByText('...')` | Async — waits for element to appear |

---

## Pattern 3 — Component that uses Apollo (GraphQL)

Wrap the component in a `MockedProvider` so queries are intercepted:

```tsx
import { MockedProvider } from '@apollo/client/testing';
import { GET_METRICS } from '@/graphql/queries';

const mocks = [
  {
    request: { query: GET_METRICS, variables: { range: '7d' } },
    result: { data: { metrics: { totalRevenue: 50000 } } },
  },
];

it('renders revenue from the API', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <MetricsDashboard range="7d" />
    </MockedProvider>,
  );

  // Loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for query to resolve
  expect(await screen.findByText('$50,000')).toBeInTheDocument();
});
```

---

## Pattern 4 — Component that uses Redux

Wrap in a `Provider` with a pre-loaded store:

```tsx
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from '@/store/filtersSlice';
import { DateRangePicker } from '@/components/DateRangePicker';

function renderWithStore(preloadedState = {}) {
  const store = configureStore({
    reducer: { filters: filtersReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <DateRangePicker />
    </Provider>,
  );
}

it('shows the selected range label', () => {
  renderWithStore({ filters: { range: '30d' } });
  expect(screen.getByText('Last 30 days')).toBeInTheDocument();
});
```

---

## Pattern 5 — Mocking

### Mock a module
```ts
jest.mock('@/lib/api', () => ({
  fetchMetrics: jest.fn().mockResolvedValue({ totalRevenue: 1000 }),
}));
```

### Spy on a function
```ts
const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
// ... code that might log errors ...
expect(spy).not.toHaveBeenCalled();
spy.mockRestore();
```

### Reset between tests
```ts
beforeEach(() => jest.clearAllMocks());
```

---

## E2E tests (Cypress)

Cypress drives a real browser. Tests live in `cypress/e2e/`.

```bash
# Run all E2E tests headlessly
npm run cypress:run

# Open the Cypress interactive UI (great for debugging)
npm run cypress:open
```

```ts
// cypress/e2e/dashboard.cy.ts
describe('Dashboard', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows the four metric cards', () => {
    cy.contains('Total Revenue').should('be.visible');
    cy.contains('Total Orders').should('be.visible');
  });

  it('filters data when a date range is selected', () => {
    cy.get('[data-testid="range-select"]').select('30d');
    cy.get('[data-testid="metric-revenue"]').should('not.contain', 'Loading');
  });
});
```

**Key Cypress commands:**

| Command | Purpose |
|---|---|
| `cy.visit('/path')` | Navigate to a page |
| `cy.contains('text')` | Find element by text content |
| `cy.get('[data-testid="x"]')` | Find by data attribute |
| `cy.get('button').click()` | Click an element |
| `cy.get('select').select('value')` | Select a dropdown option |
| `.should('be.visible')` | Assert element is visible |
| `.should('contain', 'text')` | Assert text content |

---

## What's already tested

| File | Tests |
|---|---|
| `utils/formatters.test.ts` | Currency, number, percentage formatting |
| `components/MetricCard.test.tsx` | Value display, positive/negative change colours |
| `components/DateRangePicker.test.tsx` | Range selection, label display |
| `cypress/e2e/` | Full dashboard flow in a real browser |

---

## Adding a new test

1. Create the file in `src/__tests__/` mirroring the source path
2. Run `npm run test:watch` from `apps/web/` — it picks up the new file instantly
3. Write one failing test first (TDD), then write the code to make it pass
