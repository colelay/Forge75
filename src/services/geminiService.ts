import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will not work.");
      // We can return null or throw, but let's return a dummy object or handle it in the caller
      // For now, let's just initialize it with a dummy key to prevent crash, 
      // but calls will fail.
      ai = new GoogleGenAI({ apiKey: "dummy_key" }); 
    } else {
      ai = new GoogleGenAI({ apiKey });
    }
  }
  return ai;
}

export async function generateQuote(religious: boolean) {
  const client = getAiClient();
  const today = new Date().toISOString().split('T')[0];
  const jitter = Math.random().toString(36).substring(7);
  const prompt = religious 
    ? `Provide a powerful, random motivational Bible verse (NLT or NIV) for today (${today}). 
       Jitter: ${jitter}. 
       Focus on strength, endurance, and discipline for someone doing a 75-day hard challenge. 
       CRITICAL: Do NOT pick the most common verses (like Philippians 4:13 or Jeremiah 29:11) every time. 
       Pick from a wide variety of scriptures across the Old and New Testaments.`
    : `Provide a powerful, random motivational quote for today (${today}). 
       Jitter: ${jitter}. 
       Focus on discipline, resilience, and mental toughness for someone doing a 75-day hard challenge. 
       Avoid the most cliché quotes; provide something fresh and impactful.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        seed: Math.floor(Math.random() * 1000000),
        responseMimeType: "application/json",
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
  } catch (error) {
    console.error("Error generating quote:", error);
    return { quote: "Keep pushing forward.", author: "Forge75" };
  }
}

export async function fetchSpecificVerse(reference: string) {
  const client = getAiClient();
  const prompt = `Provide the Bible verse for the reference "${reference}" in the NLT (New Living Translation) version. 
  Also provide a brief explanation of what it means and a reflection prompt for someone on a 75-day hard challenge.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        seed: Math.floor(Math.random() * 1000000),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            reference: { type: Type.STRING },
            meaning: { type: Type.STRING },
            reflectionPrompt: { type: Type.STRING }
          },
          required: ["quote", "reference", "meaning"]
        }
      }
    });

    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching specific verse:", error);
    throw error;
  }
}

export async function generateRecipes(category: string, macros: any, diabetes: boolean, dietaryRestrictions?: string) {
  const client = getAiClient();
  const prompt = `Generate 3 healthy recipe suggestions for the category "${category}" that fit these daily macro targets: Protein: ${macros.protein}g, Carbs: ${macros.carbs}g, Fat: ${macros.fat}g. 
  ${diabetes ? "The user has diabetes, so ensure low glycemic index and low sugar." : ""}
  ${dietaryRestrictions ? `IMPORTANT: The user DOES NOT eat these foods: ${dietaryRestrictions}. Ensure recipes are strictly free from these ingredients.` : ""}
  Include macros for each meal.`;

  try {
    const response = await client.models.generateContent({
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
  } catch (error) {
    console.error("Error generating recipes:", error);
    return [];
  }
}

export async function scanNutrition(input: string | { data: string; mimeType: string }) {
  const client = getAiClient();
  
  const prompt = "Analyze this food and provide estimated nutrition facts (calories, protein, carbs, fat). Be as accurate as possible based on common serving sizes. If it's an image, identify the food first. If it's text, use the description.";

  const contents: any[] = [];
  if (typeof input === 'string') {
    contents.push({ text: `${prompt}\n\nFood: ${input}` });
  } else {
    contents.push({
      parts: [
        { text: prompt },
        { inlineData: { data: input.data, mimeType: input.mimeType } }
      ]
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        seed: Math.floor(Math.random() * 1000000),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 1" }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat"]
        }
      }
    });

    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error scanning nutrition:", error);
    throw error;
  }
}
