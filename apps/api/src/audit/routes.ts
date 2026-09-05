import { FastifyInstance } from 'fastify';
import { getByTransaction } from './auditService.js';

export default async function auditRoutes(fastify: FastifyInstance) {
  // Use /:id/audit as specified
  fastify.get('/:id/audit', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const logs = await getByTransaction(id);
    return logs;
  });
}
