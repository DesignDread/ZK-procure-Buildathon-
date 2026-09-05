import { FastifyPluginAsync } from 'fastify';
import { AgentOrchestrator } from './orchestrator.js';
import db from '../config/database.js';

const agentRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const orchestrator = new AgentOrchestrator();

  fastify.post('/message', async (request, reply) => {
    const { userId, organizationId, message, transactionId, sessionId } = request.body as any;
    if (!userId || !organizationId || !message) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    const result = await orchestrator.processMessage(userId, organizationId, message, transactionId, sessionId);
    return reply.send(result);
  });

  // Clear conversation history (New Chat)
  fastify.post('/clear-session', async (request, reply) => {
    const { sessionId } = request.body as any;
    if (sessionId) {
      orchestrator.clearSession(sessionId);
    }
    return { status: 'ok', message: 'Session cleared' };
  });

  fastify.get('/runs/:id/trace', async (request, reply) => {
    const { id } = request.params as any;
    const run = await db('agent_runs').where({ id }).first();
    if (!run) return reply.status(404).send({ error: 'Run not found' });
    
    const actions = await db('agent_actions').where({ agent_run_id: id }).orderBy('created_at', 'asc');
    
    return reply.send({ run, actions });
  });
};

export default agentRoutes;
