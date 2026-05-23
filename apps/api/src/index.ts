import 'dotenv/config';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { createContext, Context } from './context';

const port = Number(process.env.PORT ?? 4000);

async function start() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // The expressMiddleware return type conflicts with @types/express when
  // multiple versions of the types are in the dep tree — cast to resolve.
  app.use(
    '/graphql',
    expressMiddleware(server, { context: createContext }) as unknown as RequestHandler,
  );

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`[api] GraphQL ready at http://localhost:${port}/graphql`);
}

start().catch((err) => {
  console.error('[api] startup failed:', err);
  process.exit(1);
});
