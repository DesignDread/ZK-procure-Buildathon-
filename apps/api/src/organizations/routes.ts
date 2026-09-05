import { FastifyInstance } from 'fastify';
import { query } from '../config/database.js';

export default async function orgRoutes(fastify: FastifyInstance) {
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const res = await query('SELECT id, name, org_type, created_at FROM organizations WHERE id = $1', [id]);
    
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'Organization not found' });
    }
    
    return res.rows[0];
  });

  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    const res = await query('SELECT id, name, org_type, created_at FROM organizations');
    return res.rows;
  });
}
