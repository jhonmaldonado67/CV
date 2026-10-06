import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function list() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    console.log("Modelos disponibles:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Error obteniendo modelos:", error.message);
  }
}
list();
