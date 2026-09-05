import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { jwtPlugin } from './auth/jwt.js';

// Route imports
import authRoutes from './auth/routes.js';
import orgRoutes from './organizations/routes.js';
import supplierRoutes from './suppliers/routes.js';
import auditRoutes from './audit/routes.js';
import procurementRoutes from './procurement/routes.js';
import policyRoutes from './policies/routes.js';
import credentialRoutes from './credentials/routes.js';
import identityRoutes from './identity/routes.js';
import zkRoutes from './zk/routes.js';
import webhookRoutes from './webhooks/routes.js';
import agentRoutes from './agent/routes.js';
import paymentsRoutes from './payments/routes.js';

const fastify = Fastify({
  logger: true
});

async function buildServer() {
  await fastify.register(cors, {
    origin: [env.BUYER_APP_URL, env.SUPPLIER_APP_URL],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await fastify.register(jwtPlugin);

  // Public routes (no auth)
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });

  // Authenticated routes
  await fastify.register(orgRoutes, { prefix: '/api/organizations' });
  await fastify.register(supplierRoutes, { prefix: '/api/suppliers' });
  await fastify.register(auditRoutes, { prefix: '/api/transactions' });
  await fastify.register(procurementRoutes, { prefix: '/api/transactions' });
  await fastify.register(policyRoutes, { prefix: '/api/policies' });
  await fastify.register(credentialRoutes, { prefix: '/api/credentials' });
  await fastify.register(identityRoutes, { prefix: '/api/identity' });
  await fastify.register(zkRoutes, { prefix: '/api/proofs' });
  await fastify.register(agentRoutes, { prefix: '/api/agent' });
  await fastify.register(paymentsRoutes, { prefix: '/api/payments' });

  // Health check
  fastify.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }));

  return fastify;
}

buildServer()
  .then((app) => {
    app.listen({ port: env.API_PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
      app.log.info(`Server listening at ${address}`);
    });
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('SIGINT received, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});
