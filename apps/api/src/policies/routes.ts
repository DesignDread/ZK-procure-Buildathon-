import { FastifyInstance } from 'fastify';
import { PolicyService } from './policyService.js';

export default async function (fastify: FastifyInstance) {
  const policyService = new PolicyService();

  fastify.post('/', async (request, reply) => {
    try {
      const { name, createdBy, shape } = request.body as any;
      const policy = await policyService.createPolicy(name, createdBy, shape);
      return policy;
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/templates', async (request, reply) => {
    try {
      const templates = await policyService.getPolicyTemplates();
      return templates;
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/:id/versions', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const version = await policyService.getPolicyVersion(id);
      return [version];
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });
}
