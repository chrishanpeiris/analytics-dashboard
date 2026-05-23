import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { Context } from '../../context';

type DateRange = { startDate?: string | null; endDate?: string | null };

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;
type OrderItemRecord = Prisma.OrderItemGetPayload<Record<string, never>>;

function requireAuth(ctx: Context) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
}

function parseDateRange({ startDate, endDate }: DateRange): { gte?: Date; lte?: Date } {
  return {
    ...(startDate ? { gte: new Date(startDate) } : {}),
    ...(endDate ? { lte: new Date(endDate) } : {}),
  };
}

function previousPeriod(start: Date | undefined, end: Date | undefined) {
  const e = end ?? new Date();
  const s = start ?? new Date(e.getTime() - 30 * 24 * 60 * 60 * 1000);
  const span = e.getTime() - s.getTime();
  return { gte: new Date(s.getTime() - span), lte: s };
}

function sumRevenue(orders: OrderWithItems[]): number {
  return orders.reduce(
    (sum: number, o: OrderWithItems) =>
      sum + o.items.reduce((s: number, i: OrderItemRecord) => s + Number(i.price) * i.quantity, 0),
    0,
  );
}

export const queryResolvers = {
  me: async (_: unknown, __: unknown, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
  },

  salesOverview: async (_: unknown, args: DateRange, ctx: Context) => {
    requireAuth(ctx);
    const dateFilter = parseDateRange(args);
    const prevFilter = previousPeriod(dateFilter.gte, dateFilter.lte);

    const [orders, prevOrders, customers] = await Promise.all([
      ctx.prisma.order.findMany({
        where: { createdAt: dateFilter, status: { notIn: ['CANCELLED'] } },
        include: { items: true },
      }),
      ctx.prisma.order.findMany({
        where: { createdAt: prevFilter, status: { notIn: ['CANCELLED'] } },
        include: { items: true },
      }),
      ctx.prisma.user.count({ where: { role: 'VIEWER' } }),
    ]);

    const totalRevenue = sumRevenue(orders);
    const prevRevenue = sumRevenue(prevOrders);
    const totalOrders = orders.length;
    const prevOrderCount = prevOrders.length;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCustomers: customers,
      revenueChange: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      ordersChange: prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0,
    };
  },

  revenueTrend: async (
    _: unknown,
    args: DateRange & { period: 'DAILY' | 'WEEKLY' | 'MONTHLY' },
    ctx: Context,
  ) => {
    requireAuth(ctx);
    const dateFilter = parseDateRange(args);

    const orders = await ctx.prisma.order.findMany({
      where: { createdAt: dateFilter, status: { notIn: ['CANCELLED'] } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const d = new Date(order.createdAt);
      let key: string;
      if (args.period === 'DAILY') {
        key = d.toISOString().slice(0, 10);
      } else if (args.period === 'WEEKLY') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      } else {
        key = d.toISOString().slice(0, 7);
      }
      const bucket = buckets.get(key) ?? { revenue: 0, orders: 0 };
      bucket.revenue += order.items.reduce((s: number, i: OrderItemRecord) => s + Number(i.price) * i.quantity, 0);
      bucket.orders += 1;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  },

  topProducts: async (
    _: unknown,
    args: DateRange & { limit?: number | null },
    ctx: Context,
  ) => {
    requireAuth(ctx);
    const dateFilter = parseDateRange(args);
    const limit = args.limit ?? 10;

    type ItemWithProduct = Prisma.OrderItemGetPayload<{ include: { product: { include: { category: true } } } }>;

    const items = await ctx.prisma.orderItem.findMany({
      where: { order: { createdAt: dateFilter, status: { notIn: ['CANCELLED'] } } },
      include: { product: { include: { category: true } } },
    });

    const map = new Map<string, { product: ItemWithProduct['product']; revenue: number; unitsSold: number }>();
    for (const item of items) {
      const entry = map.get(item.productId) ?? { product: item.product, revenue: 0, unitsSold: 0 };
      entry.revenue += Number(item.price) * item.quantity;
      entry.unitsSold += item.quantity;
      map.set(item.productId, entry);
    }

    return [...map.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  topCustomers: async (
    _: unknown,
    args: DateRange & { limit?: number | null },
    ctx: Context,
  ) => {
    requireAuth(ctx);
    const dateFilter = parseDateRange(args);
    const limit = args.limit ?? 10;

    type OrderWithUserAndItems = Prisma.OrderGetPayload<{ include: { items: true; user: true } }>;

    const orders = await ctx.prisma.order.findMany({
      where: { createdAt: dateFilter, status: { notIn: ['CANCELLED'] } },
      include: { items: true, user: true },
    });

    const map = new Map<string, { customer: OrderWithUserAndItems['user']; totalSpend: number; orderCount: number }>();
    for (const order of orders) {
      const spend = order.items.reduce((s: number, i: OrderItemRecord) => s + Number(i.price) * i.quantity, 0);
      const entry = map.get(order.userId) ?? { customer: order.user, totalSpend: 0, orderCount: 0 };
      entry.totalSpend += spend;
      entry.orderCount += 1;
      map.set(order.userId, entry);
    }

    return [...map.values()]
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, limit);
  },

  orders: async (
    _: unknown,
    args: DateRange & { page?: number | null; limit?: number | null; status?: string | null },
    ctx: Context,
  ) => {
    requireAuth(ctx);
    const dateFilter = parseDateRange(args);
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      ...(args.status ? { status: args.status as Prisma.EnumOrderStatusFilter } : {}),
    };

    const [rawOrders, total] = await Promise.all([
      ctx.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      ctx.prisma.order.count({ where }),
    ]);

    const orders = await Promise.all(
      rawOrders.map(async (o: OrderWithItems) => {
        const user = await ctx.loaders.userLoader.load(o.userId);
        return {
          ...o,
          customer: user,
          total: o.items.reduce((s: number, i: OrderItemRecord) => s + Number(i.price) * i.quantity, 0),
          itemCount: o.items.reduce((s: number, i: OrderItemRecord) => s + i.quantity, 0),
        };
      }),
    );

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  },
};
