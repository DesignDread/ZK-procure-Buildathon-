import knex from 'knex';
import { env } from './env.js';

export const dbClient = knex({
  client: 'pg',
  connection: env.DATABASE_URL
});

/**
 * Execute a raw SQL query. Supports both $1/$2 (pg-native) and ? (knex) placeholders.
 */
export const query = (text: string, params?: any[]) => {
  // knex.raw with pg client supports $1, $2, etc natively — no conversion needed
  return dbClient.raw(text, params || []);
};

export const pool = {
  connect: () => ({
    query: (sql: string, params: any[]) => dbClient.raw(sql, params),
    release: () => {}
  })
};

export const getClient = () => pool.connect();

export const withTransaction = async <T>(fn: (trx: any) => Promise<T>): Promise<T> => {
  return dbClient.transaction(fn);
};

// Create a proxy so `db('table')` works (Knex callable) and `db.query` works (our wrapper)
const dbProxy = new Proxy(dbClient, {
  get: (target, prop) => {
    if (prop === 'query') return query;
    if (prop === 'pool') return pool;
    if (prop === 'getClient') return getClient;
    if (prop === 'withTransaction') return withTransaction;
    if (prop === 'transaction') {
      return (fn: any) => dbClient.transaction(fn);
    }
    // @ts-ignore
    return target[prop];
  }
});

export const db = dbProxy;
export default db;
