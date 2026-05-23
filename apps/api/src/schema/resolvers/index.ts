import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { Context } from '../../context';
import { queryResolvers } from './query';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export const resolvers = {
  Query: queryResolvers,

  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      ctx: Context,
    ) => {
      const user = await ctx.prisma.user.findUnique({ where: { email } });
      if (!user) throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });

      const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      };
    },
  },

  // Field resolvers — these use DataLoader so Product is batched per request
  Order: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
  },

  Product: {
    price: (parent: { price: unknown }) => Number(parent.price),
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
  },

  OrderItem: {
    price: (parent: { price: unknown }) => Number(parent.price),
    product: async (parent: { productId: string }, _: unknown, ctx: Context) =>
      ctx.loaders.productLoader.load(parent.productId),
  },
};
