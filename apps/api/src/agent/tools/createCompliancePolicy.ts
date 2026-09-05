import { registerTool } from '../toolRegistry.js';
import { createCompliancePolicySchema } from '../schemas/toolSchemas.js';
import crypto from 'crypto';

registerTool('create_compliance_policy', createCompliancePolicySchema, async (args, context) => {
  const { templateId, transactionAmountPaise } = args;
  
  const canonicalJson = JSON.stringify({ templateId, transactionAmountPaise });
  const policyHash = crypto.createHash('sha256').update(canonicalJson).digest('hex');

  return { 
    policyId: templateId, 
    policyHash, 
    status: 'CREATED',
    message: `Policy created from template ${templateId} for amount ${transactionAmountPaise} paise`
  };
});
