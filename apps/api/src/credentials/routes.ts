import { FastifyInstance } from 'fastify';
import { CredentialService } from './credentialService.js';

export default async function (fastify: FastifyInstance) {
  const credentialService = new CredentialService();

  fastify.post('/request', async (request, reply) => {
    try {
      const { supplierOrgId, issuerId } = request.body as any;
      const result = await credentialService.requestCredential(supplierOrgId, issuerId);
      return result;
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/issue', async (request, reply) => {
    try {
      const { supplierOrgId } = request.body as any;
      const signedCredential = await credentialService.issueCredential(supplierOrgId);
      return signedCredential;
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const isRevoked = await credentialService.isRevoked(id);
      return { status: isRevoked ? 'REVOKED' : 'ACTIVE' };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });
}
