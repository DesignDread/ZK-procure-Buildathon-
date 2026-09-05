import { registerTool } from '../toolRegistry.js';
import { getPolicyTemplatesSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('get_policy_templates', getPolicyTemplatesSchema, async (args, context) => {
  try {
    const templates = await db('policy_templates').select('*');
    return { templates, count: templates.length };
  } catch {
    // policy_templates may not exist yet — return demo templates
    return {
      templates: [
        { id: 'tmpl-revenue-5cr', name: 'Revenue > 5 Crore', threshold_paise: 500000000, metric: 'annual_revenue' },
        { id: 'tmpl-revenue-1cr', name: 'Revenue > 1 Crore', threshold_paise: 100000000, metric: 'annual_revenue' },
        { id: 'tmpl-gst-valid', name: 'Valid GST Registration', threshold_paise: 0, metric: 'gst_status' },
      ],
      count: 3,
      note: 'Demo templates (DB table not yet populated)'
    };
  }
});
