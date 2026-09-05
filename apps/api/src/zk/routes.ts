import { FastifyInstance } from 'fastify';
import { ZKVerifier } from './verifier.js';
import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function (fastify: FastifyInstance) {
  const verifier = new ZKVerifier();

  fastify.post('/request', async (request, reply) => {
    try {
      const { transactionId, policyHash, orderNonce, supplierIdentityCommitment, credentialId } = request.body as any;
      const id = uuidv4();
      await db.query(
        `INSERT INTO proof_requests (id, transaction_id, policy_hash, order_nonce, supplier_identity_commitment, credential_id, status, expires_at) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW() + INTERVAL '1 hour')`,
        [id, transactionId, policyHash, orderNonce, supplierIdentityCommitment, credentialId]
      );
      return { id };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/submit', async (request, reply) => {
    try {
      const { proofRequestId, submittedProof, submittedPublicSignals } = request.body as any;
      const result = await verifier.verifyProof(proofRequestId, submittedProof, submittedPublicSignals);
      return result;
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const reqRes = await db.query(`SELECT status, error FROM proof_requests WHERE id = $1`, [id]);
      return reqRes.rows[0];
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });
}
