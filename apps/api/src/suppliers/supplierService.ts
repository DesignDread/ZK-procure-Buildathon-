import { query } from '../config/database.js';

export interface SupplierFilters {
  hasValidGst?: boolean;
  hasVerifiedCredential?: boolean;
}

export interface SupplierSummary {
  id: string;
  name: string;
  hasValidGst: boolean;
  hasVerifiedCredential: boolean;
}

export async function searchSuppliers(filters: SupplierFilters): Promise<SupplierSummary[]> {
  let sql = `
    SELECT 
      o.id, 
      o.name,
      EXISTS(SELECT 1 FROM supplier_credentials sc WHERE sc.organization_id = o.id AND sc.credential_type = 'GST' AND sc.is_verified = true) as "hasValidGst",
      EXISTS(SELECT 1 FROM supplier_credentials sc WHERE sc.organization_id = o.id AND sc.is_verified = true) as "hasVerifiedCredential"
    FROM organizations o
    WHERE o.org_type = 'SUPPLIER'
  `;
  
  const res = await query(sql);
  let results = res.rows as SupplierSummary[];

  if (filters.hasValidGst) {
    results = results.filter(r => r.hasValidGst);
  }
  
  if (filters.hasVerifiedCredential) {
    results = results.filter(r => r.hasVerifiedCredential);
  }

  return results;
}

export async function getSupplierById(id: string): Promise<SupplierSummary | null> {
  const sql = `
    SELECT 
      o.id, 
      o.name,
      EXISTS(SELECT 1 FROM supplier_credentials sc WHERE sc.organization_id = o.id AND sc.credential_type = 'GST' AND sc.is_verified = true) as "hasValidGst",
      EXISTS(SELECT 1 FROM supplier_credentials sc WHERE sc.organization_id = o.id AND sc.is_verified = true) as "hasVerifiedCredential"
    FROM organizations o
    WHERE o.org_type = 'SUPPLIER' AND o.id = $1
  `;
  
  const res = await query(sql, [id]);
  return res.rows.length > 0 ? (res.rows[0] as SupplierSummary) : null;
}
