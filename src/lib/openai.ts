// src/lib/openai.ts
import OpenAI from 'openai';

// This automatically picks up process.env.OPENAI_API_KEY
// from the .env file we secured earlier.
export const openai = new OpenAI();
