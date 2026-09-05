export const ALLOWED_TOOLS = [
  'parse_procurement_request',
  'get_policy_templates',
  'create_compliance_policy',
  'search_suppliers',
  'create_transaction',
  'request_supplier_credential',
  'check_credential_status',
  'request_zk_proof',
  'verify_zk_proof',
  'get_transaction_status',
  'propose_payment',
  'get_payment_status',
  'handle_verification_failure',
  'suggest_valid_policy_alternative'
] as const;

export type ToolName = typeof ALLOWED_TOOLS[number];

interface ToolDefinition {
  schema: any;
  handler: (args: any, context: any) => Promise<any>;
}

const registry = new Map<string, ToolDefinition>();

export function registerTool(name: string, schema: any, handler: (args: any, context: any) => Promise<any>) {
  if (!ALLOWED_TOOLS.includes(name as ToolName)) {
    throw new Error(`Tool ${name} is not in the allowed tools list.`);
  }
  registry.set(name, { schema, handler });
}

export async function executeTool(name: string, args: any, context: any): Promise<any> {
  if (!ALLOWED_TOOLS.includes(name as ToolName)) {
    throw new Error(`Execution rejected: Tool ${name} is not allowed.`);
  }
  const tool = registry.get(name);
  if (!tool) {
    throw new Error(`Tool ${name} is allowed but not registered.`);
  }
  // Simplified validation here, assumes proper schema checks in a real prod env
  return await tool.handler(args, context);
}

export function getToolDeclarations(): any[] {
  const declarations: any[] = [];
  for (const [name, def] of registry.entries()) {
    declarations.push({
      name,
      description: def.schema.description,
      parameters: def.schema.parameters
    });
  }
  return declarations;
}
