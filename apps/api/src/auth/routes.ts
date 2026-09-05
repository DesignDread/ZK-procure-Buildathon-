import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/database.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      const res = await query('SELECT * FROM users WHERE email = $1', [email]);
      const user = res.rows[0];

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role
      });

      return { token };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/register', async (request, reply) => {
    // For demo purposes only
    return reply.code(501).send({ error: 'Not implemented' });
  });

  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { userId } = request.user;
    const res = await query('SELECT id, email, first_name, last_name, role, organization_id FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
        return reply.code(404).send({ error: 'User not found' });
    }
    return res.rows[0];
  });
}
