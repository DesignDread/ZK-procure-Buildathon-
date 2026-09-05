import { OrgType, UserRole } from './enums';

export interface Organization {
  id: string;
  legalName: string;
  orgType: OrgType;
  gstin?: string | null;
  canonicalCompanyId: string;
  razorpayLinkedAccountId?: string | null;
  createdAt: string | Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: string | Date;
}

export interface IdentityCommitment {
  id: string;
  organizationId: string;
  commitment: string;
  saltHash: string;
  createdAt: string | Date;
}
