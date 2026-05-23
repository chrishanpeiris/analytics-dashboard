import { PrismaClient, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] starting...');

  // Users
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin User', password: passwordHash, role: 'ADMIN' },
  });

  const customers = await Promise.all(
    ['alice@example.com', 'bob@example.com', 'carol@example.com', 'dave@example.com', 'eve@example.com'].map(
      (email, i) =>
        prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split('@')[0], password: passwordHash, role: 'VIEWER' },
        }),
    ),
  );

  // Categories
  const categories = await Promise.all(
    ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  // Products — 4 per category
  const productData = [
    // Electronics
    { name: 'Wireless Headphones', price: 79.99, categoryIndex: 0 },
    { name: 'Mechanical Keyboard', price: 129.99, categoryIndex: 0 },
    { name: 'USB-C Hub', price: 49.99, categoryIndex: 0 },
    { name: 'Webcam HD', price: 89.99, categoryIndex: 0 },
    // Clothing
    { name: 'Cotton T-Shirt', price: 19.99, categoryIndex: 1 },
    { name: 'Slim Fit Jeans', price: 49.99, categoryIndex: 1 },
    { name: 'Running Jacket', price: 89.99, categoryIndex: 1 },
    { name: 'Wool Socks (3-pack)', price: 14.99, categoryIndex: 1 },
    // Books
    { name: 'Clean Code', price: 34.99, categoryIndex: 2 },
    { name: 'Designing Data-Intensive Apps', price: 49.99, categoryIndex: 2 },
    { name: 'The Pragmatic Programmer', price: 39.99, categoryIndex: 2 },
    { name: 'Refactoring', price: 44.99, categoryIndex: 2 },
    // Home & Garden
    { name: 'Desk Lamp', price: 39.99, categoryIndex: 3 },
    { name: 'Succulent Plant Set', price: 24.99, categoryIndex: 3 },
    { name: 'Coffee Maker', price: 59.99, categoryIndex: 3 },
    { name: 'Bamboo Cutting Board', price: 29.99, categoryIndex: 3 },
    // Sports
    { name: 'Yoga Mat', price: 34.99, categoryIndex: 4 },
    { name: 'Resistance Bands Set', price: 24.99, categoryIndex: 4 },
    { name: 'Water Bottle 1L', price: 19.99, categoryIndex: 4 },
    { name: 'Jump Rope', price: 14.99, categoryIndex: 4 },
  ];

  const products = await Promise.all(
    productData.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          categoryId: categories[p.categoryIndex].id,
        },
      }),
    ),
  );

  // Orders — spread across the last 90 days
  const statuses: OrderStatus[] = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'PENDING', 'CANCELLED'];
  const now = new Date();

  for (let i = 0; i < 120; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // 1–4 items per order
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    await prisma.order.create({
      data: {
        userId: customer.id,
        status,
        createdAt: orderDate,
        items: {
          create: selectedProducts.map((p) => ({
            productId: p.id,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: p.price,
          })),
        },
      },
    });
  }

  console.log(`[seed] done — ${products.length} products, 120 orders, ${customers.length + 1} users`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
