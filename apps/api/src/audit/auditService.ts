import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export async function log(
  actorType: 'USER' | 'SYSTEM' | 'AGENT',
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  detail: any = null
) {
  const id = uuidv4();
  await db('audit_logs').insert({
    id,
    actor_type: actorType,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    detail: detail ? JSON.stringify(detail) : null,
    created_at: new Date()
  });
  return id;
}

export async function getByEntity(entityType: string, entityId: string) {
  return await db('audit_logs')
    .where({ entity_type: entityType, entity_id: entityId })
    .orderBy('created_at', 'desc');
}

export async function getByTransaction(transactionId: string) {
  return await db('audit_logs')
    .where({ entity_type: 'TRANSACTION', entity_id: transactionId })
    .orderBy('created_at', 'desc');
}
