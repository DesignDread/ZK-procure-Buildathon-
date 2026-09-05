export const createTransactionSchema = {
  description: "Create a new procurement transaction with a selected supplier and amount. This MUST be called before requesting ZK proofs or payments.",
  parameters: {
    type: "object",
    properties: {
      supplierOrgId: { type: "string", description: "The UUID of the selected supplier organization" },
      amountPaise: { type: "number", description: "The transaction amount in paise (e.g. 500000000 for 50 lakhs)" },
      description: { type: "string", description: "Short description of the procurement" }
    },
    required: ["supplierOrgId", "amountPaise"]
  }
};

export const parseProcurementRequestSchema = {
  description: "Parse a natural language procurement request into structured JSON data",
  parameters: {
    type: "object",
    properties: {
      nl_text: { type: "string", description: "The natural language text to parse" }
    },
    required: ["nl_text"]
  }
};

export const getPolicyTemplatesSchema = {
  description: "Get all available policy templates",
  parameters: { type: "object", properties: {}, required: [] }
};

export const createCompliancePolicySchema = {
  description: "Create a compliance policy version from a template",
  parameters: {
    type: "object",
    properties: {
      templateId: { type: "string" },
      transactionAmountPaise: { type: "number" }
    },
    required: ["templateId", "transactionAmountPaise"]
  }
};

export const searchSuppliersSchema = {
  description: "Search for suppliers based on criteria",
  parameters: {
    type: "object",
    properties: {
      hasValidGst: { type: "boolean" },
      hasVerifiedCredential: { type: "boolean" }
    }
  }
};

export const requestSupplierCredentialSchema = {
  description: "Request a credential from a supplier for a transaction",
  parameters: {
    type: "object",
    properties: {
      supplierId: { type: "string" },
      transactionId: { type: "string" }
    },
    required: ["supplierId", "transactionId"]
  }
};

export const checkCredentialStatusSchema = {
  description: "Check the status of a credential request",
  parameters: {
    type: "object",
    properties: { credentialId: { type: "string" } },
    required: ["credentialId"]
  }
};

export const requestZkProofSchema = {
  description: "Request a Zero-Knowledge proof generation for a transaction",
  parameters: {
    type: "object",
    properties: { transactionId: { type: "string" } },
    required: ["transactionId"]
  }
};

export const verifyZkProofSchema = {
  description: "Check the verification result of a ZK proof (Read-only)",
  parameters: {
    type: "object",
    properties: { proofRequestId: { type: "string" } },
    required: ["proofRequestId"]
  }
};

export const getTransactionStatusSchema = {
  description: "Get the current full state of a transaction",
  parameters: {
    type: "object",
    properties: { transactionId: { type: "string" } },
    required: ["transactionId"]
  }
};

export const proposePaymentSchema = {
  description: "Propose a payment to the human for approval. Does NOT execute payment.",
  parameters: {
    type: "object",
    properties: { transactionId: { type: "string" } },
    required: ["transactionId"]
  }
};

export const getPaymentStatusSchema = {
  description: "Get the payment status of a transaction",
  parameters: {
    type: "object",
    properties: { transactionId: { type: "string" } },
    required: ["transactionId"]
  }
};

export const handleVerificationFailureSchema = {
  description: "Get structured reasons for a proof failure",
  parameters: {
    type: "object",
    properties: { proofRequestId: { type: "string" } },
    required: ["proofRequestId"]
  }
};

export const suggestValidPolicyAlternativeSchema = {
  description: "Suggest alternative policies if the current one fails",
  parameters: {
    type: "object",
    properties: { policyId: { type: "string" } },
    required: ["policyId"]
  }
};
