import { ActorType } from './enums';

export type AgentToolName =
  | 'parse_procurement_request'
  | 'get_policy_templates'
  | 'create_compliance_policy'
  | 'search_suppliers'
  | 'request_supplier_credential'
  | 'check_credential_status'
  | 'request_zk_proof'
  | 'verify_zk_proof'
  | 'get_transaction_status'
  | 'propose_payment'
  | 'get_payment_status'
  | 'handle_verification_failure'
  | 'suggest_valid_policy_alternative';

export interface AgentToolCall {
  toolName: AgentToolName | string;
  arguments: Record<string, unknown>;
}

export interface AgentResponse {
  reasoningSummary: string;
  toolCalls: AgentToolCall[];
  userMessage: string;
}

export interface AgentRun {
  id: string;
  transactionId?: string | null;
  initiatedBy: string;
  userMessage: string;
  startedAt: string | Date;
  endedAt?: string | Date | null;
}

export interface AgentAction {
  id: string;
  agentRunId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: Record<string, unknown> | null;
  allowed: boolean;
  createdAt: string | Date;
}

export interface AuditLog {
  id: string;
  actorType: ActorType | string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
  createdAt: string | Date;
}
