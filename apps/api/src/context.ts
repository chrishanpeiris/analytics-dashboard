import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import type { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { createLoaders, Loaders } from './dataloaders';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface Context {
  prisma: PrismaClient;
  loaders: Loaders;
  userId: string | null;
  userRole: string | null;
}

export async function createContext({ req }: ExpressContextFunctionArgument): Promise<Context> {
  const loaders = createLoaders(prisma);
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    return { prisma, loaders, userId: null, userRole: null };
  }

  try {
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return {
      prisma,
      loaders,
      userId: payload.sub as string,
      userRole: payload.role as string,
    };
  } catch {
    return { prisma, loaders, userId: null, userRole: null };
  }
}
