import { registerTool } from '../toolRegistry.js';
import { searchSuppliersSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('search_suppliers', searchSuppliersSchema, async (args, context) => {
  // The DB uses "organizations" table with org_type = 'SUPPLIER'
  let query = db('organizations')
    .select('id', 'legal_name as name', 'gstin', 'org_type')
    .where('org_type', 'SUPPLIER');

  const suppliers = await query;
  return { suppliers, count: suppliers.length };
});
