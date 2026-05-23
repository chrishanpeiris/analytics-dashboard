# Analytics Dashboard — Developer Guide

> GraphQL · Apollo Server · Apollo Client · Redux Toolkit · Prisma · PostgreSQL  
> Reference this when adding features, debugging, or preparing for interviews.

---

## Table of contents

1. [How the system is wired](#1-how-the-system-is-wired)
2. [Project structure](#2-project-structure)
3. [Request flows end-to-end](#3-request-flows-end-to-end)
4. [Key files and what they own](#4-key-files-and-what-they-own)
5. [How to add a feature](#5-how-to-add-a-feature)
6. [The state split — Apollo vs Redux](#6-the-state-split)
7. [Running locally](#7-running-locally)
8. [Testing](#8-testing)
9. [Interview playbook](#9-interview-playbook)

---

## 1. How the system is wired

```
Browser
  │
  ├── Apollo Client ──► GraphQL API :4000 ──► PostgreSQL (via Prisma)
  │        │                │
  │        │                └── DataLoader (batch N+1 queries)
  │        │
  └── Redux Store (UI state only: dateRange, period, activeTab, statusFilter)
```

**Two state systems, one rule:**
- Apollo Client = server state (metrics, chart data, orders, products)
- Redux = UI state (date pickers, active tabs, filter selections)

Never store server data in Redux. Never store UI state in Apollo cache.

---

## 2. Project structure

```
analytics-dashboard/
├── apps/
│   ├── api/                         ← GraphQL API (Apollo Server 4 + Express)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← database schema (source of truth)
│   │   │   └── seed.ts              ← seeds realistic test data
│   │   └── src/
│   │       ├── index.ts             ← Apollo Server setup + Express middleware
│   │       ├── context.ts           ← GraphQL context (auth + DataLoader per request)
│   │       ├── dataloaders/index.ts ← DataLoader for batching product/category queries
│   │       └── schema/
│   │           ├── typeDefs.ts      ← GraphQL schema (SDL)
│   │           └── resolvers/
│   │               ├── index.ts     ← merges all resolvers
│   │               └── query.ts     ← all Query resolvers
│   │
│   └── web/                         ← Next.js 14 frontend
│       └── src/
│           ├── app/
│           │   ├── login/page.tsx   ← login form
│           │   ├── dashboard/
│           │   │   ├── layout.tsx   ← dashboard shell (sidebar, header)
│           │   │   └── page.tsx     ← composes dashboard sections
│           │   └── providers.tsx    ← Apollo + Redux providers
│           ├── components/dashboard/
│           │   ├── SalesOverview.tsx     ← metric cards + revenue trend chart
│           │   ├── RevenueTrendChart.tsx ← Recharts line chart
│           │   ├── OrdersTable.tsx       ← paginated orders with status filter
│           │   ├── TopProductsTable.tsx  ← top N products by revenue
│           │   └── DateRangePicker.tsx   ← writes to Redux
│           ├── graphql/queries.ts    ← all gql`` query documents
│           ├── lib/
│           │   ├── apollo.ts         ← ApolloClient setup (auth link, error link)
│           │   └── formatters.ts     ← currency, percent, date formatters
│           ├── store/
│           │   ├── index.ts          ← Redux store
│           │   └── dashboardSlice.ts ← UI state slice
│           └── types/index.ts        ← frontend TypeScript types
│
├── docker-compose.yml               ← PostgreSQL + API + Web
└── package.json                     ← npm workspaces root
```

---

## 3. Request flows end-to-end

### Login
```
POST /api/auth/login  { email, password }
  1. API validates credentials against hardcoded demo users
  2. Signs JWT: { sub: userId, email }
  3. Returns { token }
  4. Browser: localStorage.setItem('auth_token', token)
  5. Apollo Client's authLink reads token on every subsequent request
```

### Dashboard data load
```
Apollo Client sends:
  query DashboardData($startDate, $endDate, $period) {
    salesSummary(startDate, endDate) { totalRevenue, totalOrders, ... }
    revenueTrend(startDate, endDate, period) { date, revenue }
    topProducts(startDate, endDate, limit) { name, revenue, units }
  }

  1. authLink adds Authorization: Bearer <token> header
  2. Apollo Server context.ts extracts + verifies JWT
  3. Resolvers query PostgreSQL via Prisma
  4. DataLoader batches any repeated sub-queries (N+1 prevention)
  5. Apollo Client caches response with cache-and-network policy
  6. Components re-render with data
```

### Filter change (date range)
```
User changes date range in DateRangePicker
  1. dispatch(setDateRange({ startDate, endDate }))  ← Redux
  2. Redux store updates
  3. Dashboard components read new dates from useSelector()
  4. Apollo re-executes queries with new variables
  5. Apollo Client merges new data into cache
  6. Components re-render with updated data
```

### Orders table (paginated)
```
query Orders($startDate, $endDate, $status, $page, $limit) {
  orders(...)  { id, customer, total, status, createdAt, items { product { name } } }
}

  DataLoader kicks in for items[].product:
  Instead of: SELECT * FROM products WHERE id = 1
              SELECT * FROM products WHERE id = 2
              SELECT * FROM products WHERE id = 3  (N queries)

  DataLoader batches into:
              SELECT * FROM products WHERE id IN (1, 2, 3)  (1 query)
```

---

## 4. Key files and what they own

| File | Responsibility |
|---|---|
| `api/prisma/schema.prisma` | Database schema — source of truth for all data shapes |
| `api/src/schema/typeDefs.ts` | GraphQL schema — what the frontend can query |
| `api/src/schema/resolvers/query.ts` | All resolver logic — Prisma queries happen here |
| `api/src/dataloaders/index.ts` | DataLoader — prevents N+1 on nested relations |
| `api/src/context.ts` | Per-request context: JWT auth + fresh DataLoader instance |
| `web/src/graphql/queries.ts` | All GraphQL query documents — one file, easy to find |
| `web/src/lib/apollo.ts` | ApolloClient setup: auth link, error link, cache policy |
| `web/src/store/dashboardSlice.ts` | Redux slice — UI state only |
| `web/src/lib/formatters.ts` | Currency, percent, date formatting — used across all components |

---

## 5. How to add a feature

### Pattern: add a new metric card

Example: add "Average Order Value".

```
Step 1 — GraphQL schema (api/src/schema/typeDefs.ts)
  type SalesSummary {
    totalRevenue: Float!
    totalOrders: Int!
    averageOrderValue: Float!   ← add this
  }

Step 2 — Resolver (api/src/schema/resolvers/query.ts)
  salesSummary: async (_, { startDate, endDate }, { prisma }) => {
    const result = await prisma.order.aggregate({
      where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
      _sum: { total: true },
      _count: { id: true },
    })
    const totalRevenue = result._sum.total ?? 0
    const totalOrders = result._count.id
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    }
  }

Step 3 — GraphQL query (web/src/graphql/queries.ts)
  Add averageOrderValue to the DASHBOARD_DATA query fragment

Step 4 — Component (web/src/components/dashboard/SalesOverview.tsx)
  <MetricCard
    label="Avg Order Value"
    value={formatCurrency(data.salesSummary.averageOrderValue)}
  />
```

---

### Pattern: add a new GraphQL query

Example: add a `customerCount` query.

```
Step 1 — typeDefs.ts
  type Query {
    customerCount(startDate: String!, endDate: String!): Int!
  }

Step 2 — resolvers/query.ts
  customerCount: async (_, { startDate, endDate }, { prisma }) => {
    return prisma.order.groupBy({
      by: ['customerId'],
      where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
    }).then(groups => groups.length)
  }

Step 3 — queries.ts (frontend)
  export const CUSTOMER_COUNT = gql`
    query CustomerCount($startDate: String!, $endDate: String!) {
      customerCount(startDate: $startDate, endDate: $endDate)
    }
  `

Step 4 — Component
  const { startDate, endDate } = useSelector(state => state.dashboard)
  const { data } = useQuery(CUSTOMER_COUNT, {
    variables: { startDate, endDate },
  })
```

---

### Pattern: add a Redux UI state value

Example: add a "compact view" toggle.

```
Step 1 — dashboardSlice.ts
  interface DashboardState {
    ...existing...
    compactView: boolean
  }
  initialState: { ...existing..., compactView: false }
  reducers: {
    setCompactView: (state, action: PayloadAction<boolean>) => {
      state.compactView = action.payload
    }
  }
  export const { setCompactView } = dashboardSlice.actions

Step 2 — Component
  const compactView = useSelector(state => state.dashboard.compactView)
  const dispatch = useDispatch()

  <button onClick={() => dispatch(setCompactView(!compactView))}>
    {compactView ? 'Expand' : 'Compact'}
  </button>
```

---

### Pattern: add a database model (Prisma)

Example: add a `Category` table.

```
Step 1 — schema.prisma
  model Category {
    id       Int       @id @default(autoincrement())
    name     String    @unique
    products Product[]
  }

  model Product {
    ...existing...
    categoryId Int?
    category   Category? @relation(fields: [categoryId], references: [id])
  }

Step 2 — Run migration
  cd apps/api
  npx prisma migrate dev --name add-category

Step 3 — Update seed (prisma/seed.ts) if needed

Step 4 — Add to GraphQL schema + resolver as usual
```

---

## 6. The state split

This is the most important design decision to understand and explain.

```
Apollo Client owns:                Redux owns:
  ├── salesSummary                   ├── startDate
  ├── revenueTrend                   ├── endDate
  ├── orders                         ├── period ('day'|'week'|'month')
  └── topProducts                    ├── activeTab
                                     └── orderStatusFilter
```

**Why this split?**

Apollo already has a cache — storing server data in Redux too means you're maintaining two copies. Apollo handles loading, error, and refetch states automatically.

Redux is synchronous and simple — perfect for UI state like "which tab is active" that doesn't need caching or network awareness.

**The connection point:** components read `startDate`/`endDate` from Redux and pass them as Apollo query variables. When Redux updates, Apollo re-fetches automatically.

```typescript
// Every data component follows this pattern:
const { startDate, endDate } = useSelector(state => state.dashboard)
const { data, loading } = useQuery(SOME_QUERY, {
  variables: { startDate, endDate },
  fetchPolicy: 'cache-and-network',
})
```

---

## 7. Running locally

```bash
# Start PostgreSQL
docker compose up postgres -d

# Install + seed database
cd apps/api && npx prisma migrate dev && npx prisma db seed
cd ../..

# Start both services
npm run dev

# Open http://localhost:3000
# Login: admin@example.com / password
```

**Or use Docker Compose for everything:**
```bash
docker compose up --build
```

---

## 8. Testing

**Three layers of testing:**

```
Unit tests (Jest)         ← fast, no browser, no network
  web/src/__tests__/utils/formatters.test.ts
  web/src/__tests__/components/MetricCard.test.tsx

Component tests (RTL)     ← render component, assert DOM
  web/src/__tests__/components/DateRangePicker.test.tsx

E2E tests (Cypress)       ← real browser, real API
  web/cypress/e2e/auth.cy.ts
  web/cypress/e2e/dashboard.cy.ts
```

```bash
npm test                  # unit + component tests (Jest)
npm run cypress:open      # E2E tests (needs app running)
```

**When to write which test:**
- New formatter function → unit test
- New UI component → RTL component test
- New user flow (login → see data → filter) → Cypress E2E test
- New GraphQL resolver → test via Cypress (real API) or with a test DB

---

## 9. Interview playbook

### Walk me through the architecture

> "The app has a GraphQL API backed by PostgreSQL via Prisma, and a Next.js frontend. State is split deliberately: Apollo Client owns server data (metrics, orders, products) and handles caching + loading states. Redux owns UI state (date ranges, active tabs, filters). The connection point is that components pull dates from Redux and use them as Apollo query variables. When the user changes the date range, Redux updates, Apollo re-fetches — it's clean separation of concerns."

### What is DataLoader and why is it here?

> "DataLoader solves the N+1 query problem. When the orders table renders, each order has line items, and each line item references a product. Without DataLoader, fetching 20 orders → 20 × N product queries. DataLoader batches all product lookups from a single render cycle into one `SELECT ... WHERE id IN (...)` query. It's created fresh per request in the Apollo context so it never leaks cache across users."

### Why GraphQL instead of REST?

> "The dashboard has multiple components that each need different subsets of data. REST would need multiple endpoints or over-fetching. With GraphQL, the dashboard sends one query per render that describes exactly what each component needs — no more, no less. It also makes adding new metrics easy: add a field to the schema, update the resolver, update the query. No versioning needed."

### Apollo fetchPolicy: cache-and-network — why?

> "It shows cached data immediately (so the dashboard feels instant on navigation) while always fetching fresh data in the background. The user sees something right away, then it silently updates. The alternative `cache-first` would show stale data if filters changed; `network-only` would show a loading spinner every time."

### What would you add at scale?

> "Persisted queries (send a hash instead of the full query string for repeated queries), Redis caching for expensive aggregations at the resolver level, and pagination cursors instead of offset-based pagination for the orders table. I'd also add subscription support for real-time metric updates."
