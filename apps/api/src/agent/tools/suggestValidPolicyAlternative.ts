import { registerTool } from '../toolRegistry.js';
import { suggestValidPolicyAlternativeSchema } from '../schemas/toolSchemas.js';

registerTool('suggest_valid_policy_alternative', suggestValidPolicyAlternativeSchema, async (args, context) => {
  // Return demo alternatives
  return {
    alternatives: [
      { id: 'tmpl-revenue-1cr', name: 'Revenue > 1 Crore', threshold_paise: 100000000 },
      { id: 'tmpl-gst-valid', name: 'Valid GST Registration', threshold_paise: 0 },
    ],
    note: 'These are alternative policy tiers the buyer can approve.'
  };
});
