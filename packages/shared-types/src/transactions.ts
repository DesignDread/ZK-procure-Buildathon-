import { TxnState, TransitionCause } from './enums';

export interface Transaction {
  id: string;
  buyerOrgId: string;
  supplierOrgId?: string | null;
  policyVersionId?: string | null;
  amountPaise: number | bigint | string;
  state: TxnState;
  orderNonce: string;
  authorizedAt?: string | Date | null;
  authorizationToken?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TransactionTransition {
  id: string;
  transactionId: string;
  fromState?: TxnState | null;
  toState: TxnState;
  causedBy: TransitionCause | string;
  reason?: string | null;
  createdAt: string | Date;
}
