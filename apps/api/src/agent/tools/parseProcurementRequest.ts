import { registerTool } from '../toolRegistry.js';
import { parseProcurementRequestSchema } from '../schemas/toolSchemas.js';

// This tool is called BY the LLM itself — so the LLM can do the parsing inline.
// No need for a separate Gemini call (which would use a dead model anyway).
registerTool('parse_procurement_request', parseProcurementRequestSchema, async (args, context) => {
  // Return the raw text back — the orchestrator LLM will parse it as part of its reasoning
  return {
    rawText: args.nl_text,
    hint: 'Use the information from this text to call create_transaction with the right supplier and amount. Search for suppliers first if needed.',
    message: 'Procurement request received. Please search for suppliers and create a transaction.'
  };
});
