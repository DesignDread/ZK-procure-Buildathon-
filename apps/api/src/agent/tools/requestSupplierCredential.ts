import { registerTool } from '../toolRegistry.js';
import { requestSupplierCredentialSchema } from '../schemas/toolSchemas.js';

registerTool('request_supplier_credential', requestSupplierCredentialSchema, async (args, context) => {
  const { supplierId, transactionId } = args;
  
  return { 
    status: 'REQUESTED', 
    credentialId: `cred_${Date.now()}`,
    supplierId,
    transactionId,
    message: `Credential request sent to supplier ${supplierId}. Waiting for supplier to respond.`
  };
});
