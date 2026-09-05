import { OrgType, TxnState, VerificationVerdict, FailureCode } from './enums';
import { AgentResponse } from './agent';
import { Groth16Proof } from './proofs';

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AgentMessageRequest {
  message: string;
  transactionId?: string;
}

export interface AgentMessageResponse {
  response: AgentResponse;
  transactionId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Supplier discovery summary.
 * PRIVACY INVARIANT: Contains BOOLEANS only, never numeric financial values.
 */
export interface SupplierSummary {
  id: string;
  legalName: string;
  gstin: string | null;
  hasValidGst: boolean;
  hasVerifiedCredential: boolean;
  orgType: OrgType;
}

export interface SupplierSearchQuery {
  minWorkingCapitalPaise?: number;
  requireValidGst?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreatePolicyInput {
  templateId?: string;
  name: string;
  requiredThresholdPaise: number;
  requiredGstValid: boolean;
  maxCredentialAgeSeconds: number;
}

export interface CreatePolicyResponse {
  policyId: string;
  policyVersionId: string;
  policyHash: string;
}

export interface RequestCredentialInput {
  supplierOrgId: string;
  transactionId?: string;
}

export interface RequestProofInput {
  transactionId: string;
  supplierOrgId: string;
}

export interface SubmitProofInput {
  proofRequestId: string;
  proof: Groth16Proof;
  publicSignals: string[];
}

export interface ProofStatusResponse {
  proofRequestId: string;
  transactionId: string;
  verdict: VerificationVerdict;
  failureCode?: FailureCode | null;
  verifiedAt?: string | Date | null;
}

export interface AuthorizePaymentInput {
  transactionId: string;
}

export interface AuthorizePaymentResponse {
  transactionId: string;
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number | bigint | string;
  currency: string;
  status: string;
}

export interface TransactionResponse {
  id: string;
  buyerOrgId: string;
  supplierOrgId?: string | null;
  policyVersionId?: string | null;
  amountPaise: number | bigint | string;
  state: TxnState;
  orderNonce: string;
  authorizedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
