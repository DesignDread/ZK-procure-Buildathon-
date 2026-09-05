import { TxnState } from '@zk-procure/shared-types';
import db from '../config/database.js';
import crypto from 'crypto';

export class TransactionStateMachine {
  private static readonly VALID_TRANSITIONS = new Map<TxnState, TxnState[]>([
    ['DRAFT', ['POLICY_CREATED', 'CANCELLED']],
    ['POLICY_CREATED', ['SUPPLIER_SELECTED', 'CANCELLED']],
    ['SUPPLIER_SELECTED', ['AWAITING_CREDENTIAL', 'CANCELLED']],
    ['AWAITING_CREDENTIAL', ['CREDENTIAL_EXPIRED', 'PROOF_GENERATING', 'CANCELLED']],
    ['PROOF_GENERATING', ['VERIFYING']],
    ['VERIFYING', ['PROOF_INVALID', 'IDENTITY_MISMATCH', 'POLICY_FAILED', 'AUTHORIZED']],
    ['CREDENTIAL_EXPIRED', ['AWAITING_CREDENTIAL']],
    ['PROOF_INVALID', ['POLICY_FAILED']],
    ['POLICY_FAILED', ['POLICY_CREATED']],
    ['AUTHORIZED', ['PAYMENT_PENDING']],
    ['PAYMENT_PENDING', ['PAYMENT_FAILED', 'PAYMENT_TIMEOUT', 'PAYMENT_SUCCESS']],
    ['PAYMENT_FAILED', ['PAYMENT_PENDING']],
    ['PAYMENT_SUCCESS', ['SETTLED']],
    ['SETTLED', ['DISPUTED']],
    ['IDENTITY_MISMATCH', ['CANCELLED']],
  ]);

  async requestTransition(transactionId: string, toState: TxnState, causedBy: string, reason?: string): Promise<void> {
    // Use a serializable transaction with row-level locking to prevent race conditions
    await db.transaction(async (trx) => {
      // SELECT FOR UPDATE acquires a row-level lock — any concurrent transaction
      // trying to transition the same row will block until this one commits/rolls back
      const txn = await trx('transactions')
        .where({ id: transactionId })
        .forUpdate()  // Row-level lock — prevents concurrent state transitions
        .first();

      if (!txn) throw new Error(`Transaction ${transactionId} not found`);
      
      const currentState = txn.state as TxnState;
      const allowed = TransactionStateMachine.VALID_TRANSITIONS.get(currentState);
      if (!allowed || !allowed.includes(toState)) {
        throw new Error(`Illegal state transition from ${currentState} to ${toState}`);
      }

      await trx('transactions')
        .where({ id: transactionId })
        .update({ state: toState, updated_at: new Date() });

      await trx('transaction_transitions').insert({
        transaction_id: transactionId,
        from_state: currentState,
        to_state: toState,
        caused_by: causedBy,
        reason: reason,
        created_at: new Date(),
      });

      await trx('audit_logs').insert({
        entity_id: transactionId,
        entity_type: 'transaction',
        action: 'STATE_TRANSITION',
        detail: JSON.stringify({ from: currentState, to: toState, reason }),
        actor_type: 'system',
        actor_id: causedBy,
        created_at: new Date(),
      });
    });
  }

  async getState(transactionId: string): Promise<TxnState> {
    const txn = await db('transactions').where({ id: transactionId }).first();
    if (!txn) throw new Error(`Transaction ${transactionId} not found`);
    return txn.state as TxnState;
  }

  async issueAuthorizationToken(transactionId: string): Promise<string> {
    const state = await this.getState(transactionId);
    if (state !== 'AUTHORIZED') {
      throw new Error(`Cannot issue authorization token for state ${state}`);
    }

    const payload = JSON.stringify({
      transactionId,
      exp: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(payload)
      .digest('hex');
    
    const token = `${Buffer.from(payload).toString('base64')}.${signature}`;

    await db('transactions').where({ id: transactionId }).update({ authorization_token: token });
    return token;
  }

  async validateAuthorizationToken(transactionId: string, token: string): Promise<boolean> {
    const txn = await db('transactions').where({ id: transactionId }).first();
    if (!txn || txn.authorization_token !== token) return false;

    const [payloadB64, signature] = token.split('.');
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    
    const expectedSignature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(payloadStr)
      .digest('hex');

    if (signature !== expectedSignature) return false;

    const payload = JSON.parse(payloadStr);
    if (Date.now() > payload.exp) return false;

    return true;
  }

  async assertPolicyHashMatches(transactionId: string, proofPolicyHash: string): Promise<void> {
    const txn = await db('transactions')
      .join('policy_versions', 'transactions.policy_version_id', 'policy_versions.id')
      .select('policy_versions.policy_hash')
      .where('transactions.id', transactionId)
      .first();

    if (!txn) throw new Error(`Transaction ${transactionId} not found`);
    if (txn.policy_hash !== proofPolicyHash) {
      throw new Error(`Policy hash mismatch. Expected ${txn.policy_hash}, got ${proofPolicyHash}`);
    }
  }
}
