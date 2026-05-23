export type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type Role = 'ADMIN' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export interface ProductMetric {
  product: Product;
  revenue: number;
  unitsSold: number;
}

export interface CustomerMetric {
  customer: Customer;
  totalSpend: number;
  orderCount: number;
}

export interface Order {
  id: string;
  customer: Customer;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}
