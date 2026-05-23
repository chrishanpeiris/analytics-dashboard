export const typeDefs = `#graphql
  scalar Date

  enum Period {
    DAILY
    WEEKLY
    MONTHLY
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum Role {
    ADMIN
    VIEWER
  }

  # ── Domain types ────────────────────────────────────────────

  type Category {
    id:   String!
    name: String!
  }

  type Product {
    id:        String!
    name:      String!
    price:     Float!
    category:  Category!
    createdAt: String!
  }

  type Customer {
    id:    String!
    name:  String!
    email: String!
  }

  type OrderItem {
    id:       String!
    product:  Product!
    quantity: Int!
    price:    Float!
  }

  type Order {
    id:        String!
    customer:  Customer!
    status:    OrderStatus!
    total:     Float!
    itemCount: Int!
    createdAt: String!
  }

  # ── Analytics types ──────────────────────────────────────────

  type SalesOverview {
    totalRevenue:      Float!
    totalOrders:       Int!
    averageOrderValue: Float!
    totalCustomers:    Int!
    revenueChange:     Float!   # % vs previous period
    ordersChange:      Float!
  }

  type TrendPoint {
    date:    String!
    revenue: Float!
    orders:  Int!
  }

  type ProductMetric {
    product:    Product!
    revenue:    Float!
    unitsSold:  Int!
  }

  type CustomerMetric {
    customer:    Customer!
    totalSpend:  Float!
    orderCount:  Int!
  }

  type OrdersPage {
    orders:     [Order!]!
    total:      Int!
    page:       Int!
    totalPages: Int!
  }

  # ── Auth ─────────────────────────────────────────────────────

  type AuthPayload {
    token: String!
    user: AuthUser!
  }

  type AuthUser {
    id:    String!
    email: String!
    name:  String!
    role:  Role!
  }

  # ── Queries & Mutations ──────────────────────────────────────

  type Query {
    salesOverview(startDate: String, endDate: String): SalesOverview!
    revenueTrend(period: Period!, startDate: String, endDate: String): [TrendPoint!]!
    topProducts(limit: Int, startDate: String, endDate: String): [ProductMetric!]!
    topCustomers(limit: Int, startDate: String, endDate: String): [CustomerMetric!]!
    orders(page: Int, limit: Int, status: OrderStatus, startDate: String, endDate: String): OrdersPage!
    me: AuthUser
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
  }
`;
