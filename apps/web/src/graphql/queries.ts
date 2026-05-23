import { gql } from '@apollo/client';

export const SALES_OVERVIEW = gql`
  query SalesOverview($startDate: String, $endDate: String) {
    salesOverview(startDate: $startDate, endDate: $endDate) {
      totalRevenue
      totalOrders
      averageOrderValue
      totalCustomers
      revenueChange
      ordersChange
    }
  }
`;

export const REVENUE_TREND = gql`
  query RevenueTrend($period: Period!, $startDate: String, $endDate: String) {
    revenueTrend(period: $period, startDate: $startDate, endDate: $endDate) {
      date
      revenue
      orders
    }
  }
`;

export const TOP_PRODUCTS = gql`
  query TopProducts($limit: Int, $startDate: String, $endDate: String) {
    topProducts(limit: $limit, startDate: $startDate, endDate: $endDate) {
      product {
        id
        name
        category {
          name
        }
      }
      revenue
      unitsSold
    }
  }
`;

export const TOP_CUSTOMERS = gql`
  query TopCustomers($limit: Int, $startDate: String, $endDate: String) {
    topCustomers(limit: $limit, startDate: $startDate, endDate: $endDate) {
      customer {
        id
        name
        email
      }
      totalSpend
      orderCount
    }
  }
`;

export const ORDERS = gql`
  query Orders($page: Int, $limit: Int, $status: OrderStatus, $startDate: String, $endDate: String) {
    orders(page: $page, limit: $limit, status: $status, startDate: $startDate, endDate: $endDate) {
      orders {
        id
        customer {
          name
          email
        }
        status
        total
        itemCount
        createdAt
      }
      total
      page
      totalPages
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      name
      role
    }
  }
`;
