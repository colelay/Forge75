import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateQuote(religious: boolean) {
  const today = new Date().toISOString().split('T')[0];
  const prompt = religious 
    ? `Provide a powerful motivational Bible verse (NLT or NIV) for today (${today}) about how trusting in God gives strength and endurance for someone doing a 75-day hard challenge.`
    : `Provide a powerful motivational quote for today (${today}) for someone doing a 75-day hard challenge.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      seed: parseInt(today.replace(/-/g, '')),
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          reference: { type: Type.STRING, description: "Bible verse reference if religious, otherwise author name" },
          author: { type: Type.STRING, description: "Author name if not religious" }
        },
        required: ["quote"]
      }
    }
  });

  const text = response.text?.trim() || "{}";
  return JSON.parse(text);
}

export async function generateRecipes(category: string, macros: any, diabetes: boolean) {
  const prompt = `Generate 3 healthy recipe suggestions for the category "${category}" that fit these daily macro targets: Protein: ${macros.protein}g, Carbs: ${macros.carbs}g, Fat: ${macros.fat}g. 
  ${diabetes ? "The user has diabetes, so ensure low glycemic index and low sugar." : ""}
  Include macros for each meal.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            instructions: { type: Type.STRING },
            macros: {
              type: Type.OBJECT,
              properties: {
                p: { type: Type.NUMBER },
                c: { type: Type.NUMBER },
                f: { type: Type.NUMBER },
                cal: { type: Type.NUMBER }
              }
            },
            isSnack: { type: Type.BOOLEAN }
          }
        }
      }
    }
  });

  const text = response.text?.trim() || "[]";
  return JSON.parse(text);
}
