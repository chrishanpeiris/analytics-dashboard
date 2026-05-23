import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

/**
 * DataLoaders prevent N+1 queries by batching individual lookups into a
 * single DB round-trip per request.
 *
 * Interview talking point: without DataLoader, resolving Product for each
 * OrderItem in a list of 50 orders would fire 50 individual SELECT queries.
 * DataLoader batches them into one SELECT WHERE id IN (...).
 */
export function createLoaders(prisma: PrismaClient) {
  type ProductWithCategory = Awaited<ReturnType<typeof prisma.product.findFirst>> & { category: { id: string; name: string } };
  type UserRecord = Awaited<ReturnType<typeof prisma.user.findFirst>>;

  const productLoader = new DataLoader<string, NonNullable<ProductWithCategory>>(async (ids) => {
    const products = await prisma.product.findMany({
      where: { id: { in: [...ids] } },
      include: { category: true },
    });
    const map = new Map(products.map((p: typeof products[number]) => [p.id, p]));
    return ids.map((id) => map.get(id) ?? new Error(`Product ${id} not found`)) as NonNullable<ProductWithCategory>[];
  });

  const userLoader = new DataLoader<string, NonNullable<UserRecord>>(async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const map = new Map(users.map((u: typeof users[number]) => [u.id, u]));
    return ids.map((id) => map.get(id) ?? new Error(`User ${id} not found`)) as NonNullable<UserRecord>[];
  });

  return { productLoader, userLoader };
}

export type Loaders = ReturnType<typeof createLoaders>;
