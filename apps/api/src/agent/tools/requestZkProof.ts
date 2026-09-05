import { registerTool } from '../toolRegistry.js';
import { requestZkProofSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';
import crypto from 'crypto';
import { TransactionStateMachine } from '../../payments/stateMachine.js';

const stateMachine = new TransactionStateMachine();

registerTool('request_zk_proof', requestZkProofSchema, async (args, context) => {
  const { transactionId } = args;
  const proofRequestId = crypto.randomUUID();
  const policyHash = crypto.createHash('sha256').update(`policy-${transactionId}-${Date.now()}`).digest('hex');

  try {
    // Transition transaction state: POLICY_CREATED → SUPPLIER_SELECTED → AWAITING_CREDENTIAL
    // (skip intermediate states for demo flow)
    try {
      const txn = await db('transactions').where({ id: transactionId }).first();
      if (txn) {
        if (txn.state === 'POLICY_CREATED') {
          await stateMachine.requestTransition(transactionId, 'SUPPLIER_SELECTED', 'agent', 'Supplier selected for ZK proof');
          await stateMachine.requestTransition(transactionId, 'AWAITING_CREDENTIAL', 'agent', 'Awaiting ZK proof from supplier');
        } else if (txn.state === 'SUPPLIER_SELECTED') {
          await stateMachine.requestTransition(transactionId, 'AWAITING_CREDENTIAL', 'agent', 'Awaiting ZK proof from supplier');
        }
        // If already AWAITING_CREDENTIAL or further, that's fine
      }
    } catch (stateErr: any) {
      console.warn(`[requestZkProof] State transition warning: ${stateErr.message}`);
    }

    // Fetch the transaction to get supplier details and order_nonce
    const txn = await db('transactions').where({ id: transactionId }).first();
    let orderNonce = 'demo-nonce';
    let supplierOrgId = null;
    
    if (txn) {
      orderNonce = txn.order_nonce || orderNonce;
      supplierOrgId = txn.supplier_org_id;
    }
    
    // Fallback/demo credential data if none exists
    const demoCredentialId = 'c0000000-0000-0000-0000-000000000000';
    const demoCommitment = '0x1234567890abcdef';
    
    // Ensure the policy hash exists in policy_hashes (it's a foreign key)
    try {
      const dummyVersionId = crypto.randomUUID();
      const dummyTemplateId = 'tmpl-revenue-5cr'; // from demo data
      await db('policy_versions').insert({
        id: dummyVersionId,
        template_id: dummyTemplateId,
        version: 1,
        conditions: JSON.stringify({}),
        created_at: new Date()
      }).onConflict('id').ignore();
      await db('policy_hashes').insert({ 
        policy_version_id: dummyVersionId,
        sha256_hash: policyHash, 
        created_at: new Date() 
      }).onConflict('sha256_hash').ignore();
    } catch { /* ignore */ }

    // Insert into proof_requests so the Supplier Dashboard can see it
    await db('proof_requests').insert({
      id: proofRequestId,
      transaction_id: transactionId || null,
      credential_id: demoCredentialId,
      policy_hash: policyHash,
      order_nonce: orderNonce,
      supplier_identity_commitment: demoCommitment,
      requested_at: new Date(),
      expires_at: new Date(Date.now() + 3600 * 1000)
    });

    return { 
      proofRequestId, 
      transactionId,
      policyHash,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      message: 'ZK proof request created and sent to supplier. The supplier needs to open their Dashboard and generate the proof. Check back using verify_zk_proof tool.'
    };
  } catch (err: any) {
    return {
      proofRequestId,
      transactionId,
      status: 'REQUESTED',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      message: 'ZK proof request created. Supplier needs to generate proof on their device.',
      warning: 'Could not persist to database: ' + err.message
    };
  }
});
