import React from 'react';

type StateType = 
  | 'AUTHORIZED' | 'PAYMENT_SUCCESS' | 'SETTLED'
  | 'DRAFT' | 'POLICY_CREATED' | 'SUPPLIER_SELECTED' | 'AWAITING_CREDENTIAL' | 'PROOF_GENERATING' | 'VERIFYING' | 'PAYMENT_PENDING'
  | 'PROOF_INVALID' | 'CREDENTIAL_EXPIRED' | 'IDENTITY_MISMATCH' | 'POLICY_FAILED' | 'PAYMENT_FAILED' | 'PAYMENT_TIMEOUT' | 'CANCELLED'
  | 'DISPUTED';

const StateBadge = ({ state }: { state: StateType }) => {
  const getStyle = (s: StateType) => {
    if (['AUTHORIZED', 'PAYMENT_SUCCESS', 'SETTLED'].includes(s)) 
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (['PROOF_INVALID', 'CREDENTIAL_EXPIRED', 'IDENTITY_MISMATCH', 'POLICY_FAILED', 'PAYMENT_FAILED', 'PAYMENT_TIMEOUT', 'CANCELLED'].includes(s))
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (['DISPUTED'].includes(s))
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStyle(state)}`}>
      {state.replace(/_/g, ' ')}
    </span>
  );
};

export default StateBadge;
