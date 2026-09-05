import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import db from '../config/database.js';
import { log as auditLog } from '../audit/auditService.js';
import { v4 as uuidv4 } from 'uuid';

const createTransactionSchema = z.object({
  supplierId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional()
});

export default async function procurementRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { supplierId, amount, description } = createTransactionSchema.parse(request.body);
      const buyerId = request.user.organizationId;
      
      const id = uuidv4();
      await db('transactions').insert({
        id,
        buyer_org_id: buyerId,
        supplier_org_id: supplierId,
        amount_paise: amount,
        state: 'DRAFT',
        order_nonce: `ORD-${Date.now()}-${id.slice(0,8)}`,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await auditLog('USER', request.user.userId, 'CREATE_TRANSACTION', 'TRANSACTION', id, { amount, description });
      
      return reply.code(201).send({ id, state: 'DRAFT' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET single transaction — no auth (demo mode, agent creates transactions)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const txn = await db('transactions')
      .select('id', 'buyer_org_id', 'supplier_org_id', 'state', 'amount_paise', 'order_nonce', 'authorized_at', 'created_at', 'updated_at')
      .where({ id })
      .first();
      
    if (!txn) {
      return reply.code(404).send({ error: 'Transaction not found' });
    }
    
    return txn;
  });

  // GET all transactions — no auth (demo mode)
  fastify.get('/', async (request, reply) => {
    const txns = await db('transactions')
      .select('id', 'buyer_org_id', 'supplier_org_id', 'state', 'amount_paise', 'order_nonce', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc')
      .limit(50);
      
    return txns;
  });

  fastify.post('/:id/authorize-payment', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const tx = await db('transactions').select('state').where({ id }).first();
    if (!tx) {
      return reply.code(404).send({ error: 'Transaction not found' });
    }
    
    if (tx.state !== 'AUTHORIZED') {
      return reply.code(400).send({ error: `Transaction must be AUTHORIZED to proceed. Current state: ${tx.state}` });
    }
    
    await auditLog('USER', request.user.userId, 'AUTHORIZE_PAYMENT', 'TRANSACTION', id);
    
    return { success: true, state: 'AUTHORIZED', message: 'Ready for payment. Use /api/payments/:id/create-order to proceed.' };
  });
}
