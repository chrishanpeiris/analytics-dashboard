# Analytics Dashboard

A full-stack sales analytics dashboard demonstrating:

- **GraphQL API** — Apollo Server 4, schema-first design, DataLoader for N+1 prevention
- **Prisma ORM** — type-safe DB access with migrations (vs raw SQL in Project 1)
- **Apollo Client** — queries, cache, `useQuery` / `useMutation`
- **Redux Toolkit** — UI state (filters, date range) kept separate from Apollo server state
- **3-layer testing** — Jest unit tests, RTL + MSW component tests, Cypress e2e
- **Docker + docker-compose** — entire stack in one command
- **GitHub Actions CI** — typecheck → lint → jest → build Docker images → push to GHCR

## Architecture

```
Browser (Next.js 14)
  │  GraphQL mutation: login → receives JWT
  │  stores JWT in localStorage
  │
  │  Apollo Client — Authorization: Bearer <jwt>
  ▼
GraphQL API (Apollo Server 4 + Express, port 4000)
  ├── context.ts       → jwtVerify, attaches userId to every request
  ├── resolvers/       → salesOverview, revenueTrend, topProducts, topCustomers, orders
  ├── dataloaders/     → batch-fetch products & users (prevents N+1 queries)
  └── Prisma ORM       → type-safe PostgreSQL queries with migrations
       └── PostgreSQL (port 5432)
```

**Redux vs Apollo state split:**
| State | Owned by |
|---|---|
| date range, period, active tab, status filter | Redux Toolkit |
| metrics, chart data, orders list | Apollo Client cache |

## Quick start (Docker)

```bash
make up          # builds & starts postgres + api + web

# First run: migrate DB and seed demo data
make db-migrate
make db-seed

# Open http://localhost:3000
# Login: admin@example.com / demo1234
```

## Quick start (local dev)

```bash
# Requires: Node 20+, PostgreSQL running locally

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npm install

# Run Prisma migrations and seed
cd apps/api
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
cd ../..

npm run dev   # api on :4000, web on :3000
```

## Project structure

```
apps/
  api/                          Apollo Server 4 + Express
    prisma/
      schema.prisma             Data model (User, Product, Category, Order, OrderItem)
      seed.ts                   20 products, 120 orders across 90 days
    src/
      schema/
        typeDefs.ts             GraphQL schema (SDL)
        resolvers/
          query.ts              All Query resolvers
          index.ts              Mutation resolvers + field resolvers
      dataloaders/index.ts      DataLoader for Product and User (N+1 prevention)
      context.ts                JWT verification, Prisma client, DataLoaders per request
      index.ts                  Apollo Server + Express bootstrap

  web/                          Next.js 14 (App Router)
    src/
      app/
        dashboard/page.tsx      Main dashboard with tab switcher
        dashboard/layout.tsx    Auth guard + header
        login/page.tsx          GraphQL mutation login form
      components/dashboard/
        SalesOverview.tsx        4 metric cards (Apollo query)
        RevenueTrendChart.tsx    Recharts area chart (Apollo query)
        TopProductsTable.tsx     Product revenue table (Apollo query)
        DateRangePicker.tsx      Presets + custom inputs (Redux dispatch)
        OrdersTable.tsx          Paginated orders + status filter
      store/
        dashboardSlice.ts        Redux Toolkit slice (date range, period, tab, filter)
        index.ts                 Store + typed hooks
      lib/
        apollo.ts               Apollo Client (auth link + error link)
        formatters.ts            Pure utility functions (tested with Jest)
      graphql/queries.ts         GQL query/mutation documents
    __tests__/
      utils/formatters.test.ts   Jest unit tests (14 cases)
      components/MetricCard.test.tsx   RTL component tests
      components/DateRangePicker.test.tsx  RTL + Redux integration tests
    cypress/
      e2e/auth.cy.ts             Login flow e2e
      e2e/dashboard.cy.ts        Dashboard filtering e2e
```

## Testing

```bash
# Jest (unit + component)
npm run test -w apps/web

# Jest with coverage
npm run test:coverage -w apps/web

# Cypress (requires running app)
npm run dev &
npm run cypress:run -w apps/web
```

**Test layers explained:**
- **Jest unit** (`formatters.test.ts`) — pure functions, no DOM, instant feedback
- **RTL component** (`MetricCard`, `DateRangePicker`) — render with real Redux store, assert DOM output
- **Cypress e2e** — full browser, real API, real DB; tests the login → dashboard → filter flow

## CI/CD

Every push runs:
1. **Typecheck** — `tsc --noEmit` across both apps
2. **Lint** — `next lint`
3. **Jest** — unit + component tests with coverage upload
4. **Build + push** — Docker images built with layer caching, pushed to GHCR on `main`

## Key design decisions

| Decision | Why |
|---|---|
| GraphQL over REST | Flexible querying; dashboard can request exactly the fields it needs |
| Prisma over raw SQL | Type-safe migrations, auto-generated client, better DX — contrast with Project 1 |
| DataLoader | Batches N individual DB lookups into one query per request cycle |
| Apollo owns server state, Redux owns UI state | Clean separation; Apollo cache handles refetching, Redux handles filters |
| JWT in localStorage (not httpOnly cookie) | Simpler demo; trade-off acknowledged — production would use httpOnly |
| 3-layer test strategy | Unit for logic, RTL for components, Cypress for user flows |
