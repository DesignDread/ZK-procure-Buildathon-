import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { searchSuppliers, getSupplierById } from './supplierService.js';
import db from '../config/database.js';
import { TransactionStateMachine } from '../payments/stateMachine.js';

const stateMachine = new TransactionStateMachine();

const searchSchema = z.object({
  hasValidGst: z.string().optional().transform(v => v === 'true'),
  hasVerifiedCredential: z.string().optional().transform(v => v === 'true'),
});

export default async function supplierRoutes(fastify: FastifyInstance) {
  // Fetch pending proof requests, filtered by supplier org ID
  // In production, this would use JWT auth to get the supplier ID automatically
  fastify.get('/pending-requests', async (request, reply) => {
    try {
      const { supplierId } = request.query as { supplierId?: string };

      // Note: proof_requests has no "status" column — all requests are pending until a proof is submitted
      // We filter out requests that already have a proof submitted
      let baseQuery = db('proof_requests as pr')
        .leftJoin('proofs as p', 'p.proof_request_id', 'pr.id')
        .leftJoin('transactions as t', 't.id', 'pr.transaction_id')
        .whereNull('p.id') // Only show requests without a submitted proof yet
        .orderBy('pr.requested_at', 'desc')
        .select([
          'pr.id',
          'pr.transaction_id',
          'pr.policy_hash',
          'pr.order_nonce',
          'pr.requested_at',
          'pr.expires_at',
          't.amount_paise',
          't.state as transaction_state',
          't.supplier_org_id',
        ]);

      if (supplierId) {
        baseQuery = baseQuery.where('t.supplier_org_id', supplierId);
      }

      const pendingReqs = await baseQuery;
      return pendingReqs;
    } catch (error: any) {
      console.error('[pending-requests] error:', error.message);
      return [];
    }
  });

  // Accept a proof submission from the supplier portal
  fastify.post('/submit-proof', async (request, reply) => {
    try {
      const { proofRequestId, proof, publicSignals, commitment } = request.body as any;
      
      if (!proofRequestId) {
        return reply.status(400).send({ error: 'proofRequestId is required' });
      }

      // Idempotency check: reject if proof was already submitted
      const existing = await db('proof_requests').where({ id: proofRequestId }).first();
      if (!existing) {
        return reply.status(404).send({ error: 'Proof request not found' });
      }
      // Check if proof already submitted
      const existingProof = await db('proofs').where({ proof_request_id: proofRequestId }).first();
      if (existingProof) {
        return reply.status(409).send({ 
          error: 'Proof already submitted',
          currentStatus: existingProof.verification_result ? 'verified' : 'failed',
          message: `This proof request was already processed. Duplicate submissions are rejected.`
        });
      }

      // Insert into proofs table
      const isVerified = publicSignals?.result === 1;
      await db('proofs').insert({
        proof_request_id: proofRequestId,
        nonce: existing.order_nonce || 'demo-nonce',
        proof_json: JSON.stringify(proof || {}),
        public_signals: JSON.stringify(publicSignals || {}),
        verification_result: isVerified,
        verified_at: isVerified ? new Date() : null,
        created_at: new Date()
      }).onConflict('nonce').ignore();

      // Log to audit
      try {
        await db('audit_logs').insert({
          entity_id: proofRequestId,
          entity_type: 'proof_request',
          action: publicSignals?.result === 1 ? 'PROOF_VERIFIED' : 'PROOF_FAILED',
          detail: JSON.stringify({ commitment, protocol: proof?.protocol }),
          actor_type: 'supplier',
          actor_id: 'supplier',
          created_at: new Date()
        });
      } catch { /* ignore audit log errors */ }

      // Drive the Transaction State Machine based on proof result
      if (existing.transaction_id) {
        try {
          if (publicSignals?.result === 1) {
            // Valid proof: AWAITING_CREDENTIAL → PROOF_GENERATING → VERIFYING → AUTHORIZED
            const txn = await db('transactions').where({ id: existing.transaction_id }).first();
            if (txn) {
              const transitions: Array<[string, string]> = [];
              if (txn.state === 'DRAFT') {
                transitions.push(['POLICY_CREATED', 'Auto forward']);
                transitions.push(['SUPPLIER_SELECTED', 'Auto forward']);
                transitions.push(['AWAITING_CREDENTIAL', 'Auto forward']);
                transitions.push(['PROOF_GENERATING', 'Proof received from supplier']);
                transitions.push(['VERIFYING', 'Verifying ZK proof']);
                transitions.push(['AUTHORIZED', 'ZK proof verified successfully']);
              } else if (txn.state === 'POLICY_CREATED') {
                transitions.push(['SUPPLIER_SELECTED', 'Auto forward']);
                transitions.push(['AWAITING_CREDENTIAL', 'Auto forward']);
                transitions.push(['PROOF_GENERATING', 'Proof received from supplier']);
                transitions.push(['VERIFYING', 'Verifying ZK proof']);
                transitions.push(['AUTHORIZED', 'ZK proof verified successfully']);
              } else if (txn.state === 'SUPPLIER_SELECTED') {
                transitions.push(['AWAITING_CREDENTIAL', 'Auto forward']);
                transitions.push(['PROOF_GENERATING', 'Proof received from supplier']);
                transitions.push(['VERIFYING', 'Verifying ZK proof']);
                transitions.push(['AUTHORIZED', 'ZK proof verified successfully']);
              } else if (txn.state === 'AWAITING_CREDENTIAL') {
                transitions.push(['PROOF_GENERATING', 'Proof received from supplier']);
                transitions.push(['VERIFYING', 'Verifying ZK proof']);
                transitions.push(['AUTHORIZED', 'ZK proof verified successfully']);
              } else if (txn.state === 'PROOF_GENERATING') {
                transitions.push(['VERIFYING', 'Verifying ZK proof']);
                transitions.push(['AUTHORIZED', 'ZK proof verified successfully']);
              } else if (txn.state === 'VERIFYING') {
                transitions.push(['AUTHORIZED', 'ZK proof verified successfully']);
              }
              
              for (const [toState, reason] of transitions) {
                await stateMachine.requestTransition(existing.transaction_id, toState as any, 'zk_verifier', reason);
              }
              // Also set authorized_at timestamp
              await db('transactions').where({ id: existing.transaction_id }).update({ authorized_at: new Date() });
            }
          } else {
            // Invalid proof: transition to PROOF_INVALID
            try {
              await stateMachine.requestTransition(existing.transaction_id, 'VERIFYING' as any, 'zk_verifier', 'Verifying ZK proof');
              await stateMachine.requestTransition(existing.transaction_id, 'PROOF_INVALID' as any, 'zk_verifier', 'ZK proof verification failed');
            } catch { /* ignore if state doesn't allow this transition */ }
          }
        } catch (stateErr: any) {
          console.warn(`[submit-proof] State machine transition warning: ${stateErr.message}`);
        }
      }

      return { 
        status: publicSignals?.result === 1 ? 'VERIFIED' : 'FAILED',
        proofRequestId,
        transactionId: existing.transaction_id,
        message: publicSignals?.result === 1 
          ? 'Proof verified successfully. Transaction is now AUTHORIZED and ready for payment.' 
          : 'Proof verification failed. Supplier does not meet the policy requirements.'
      };
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.get('/search', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const filters = searchSchema.parse(request.query);
      const suppliers = await searchSuppliers(filters);
      return suppliers;
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }
  });

  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const supplier = await getSupplierById(id);
    
    if (!supplier) {
      return reply.code(404).send({ error: 'Supplier not found' });
    }
    
    return supplier;
  });
}
