import { FastifyInstance } from 'fastify';
import { IdentityService } from './identityService.js';

export default async function (fastify: FastifyInstance) {
  const identityService = new IdentityService();

  fastify.post('/commitments', async (request, reply) => {
    try {
      const { organizationId, commitment, saltHash } = request.body as any;
      await identityService.registerCommitment(organizationId, commitment, saltHash);
      return { success: true };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/commitments/:orgId', async (request, reply) => {
    try {
      const { orgId } = request.params as any;
      const commitment = await identityService.getCommitment(orgId);
      return { commitment };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });
}
