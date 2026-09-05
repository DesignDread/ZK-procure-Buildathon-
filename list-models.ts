import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './apps/api/src/config/env.js';

const ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(data.models.map((m: any) => m.name).join('\n'));
  } catch (e) {
    console.error(e);
  }
}

listModels();
