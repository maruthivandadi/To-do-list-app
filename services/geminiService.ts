import { GoogleGenAI, Type } from "@google/genai";
import { TimetableResponse } from "../types";

// Robust API Key retrieval for various environments
const getApiKey = () => {
  let key = "";

  // 1. Try Vite (common in Vercel deployments)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || "";
    }
  } catch (e) {}

  if (key) return key;

  // 2. Try Standard Process Env (CRA, Next.js, Node)
  try {
    if (typeof process !== 'undefined' && process.env) {
      key = process.env.REACT_APP_API_KEY || process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || "";
    }
  } catch (e) {}

  return key;
};

export const extractScheduleFromImage = async (
  base64Data: string,
  mimeType: string
): Promise<TimetableResponse> => {
  const apiKey = getApiKey();

  // Check key at runtime
  if (!apiKey || apiKey === "dummy_key_to_prevent_init_crash") {
    throw new Error(
      "API_KEY_MISSING" 
    );
  }

  // Initialize AI instance here to ensure we use the current key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analyze this image (or PDF) of a school timetable. 
            Extract the class schedule into a structured JSON format.
            For each class, identify the Day of the week (e.g., 'Monday'), the Subject Name, the Start Time (HH:MM 24hr format), and End Time (HH:MM 24hr format).
            If the end time is not explicitly stated, assume the class lasts 1 hour.
            If a room number is visible, include it.
            Normalize all times to 24-hour format (e.g., 2pm -> 14:00).
            Ignore breaks or lunch if they are not labelled as a class.
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  room: { type: Type.STRING, nullable: true },
                },
                required: ["day", "subject", "startTime", "endTime"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response received from AI service.");

    // Clean up potential markdown formatting (e.g. ```json ... ```)
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
        return JSON.parse(cleanedText) as TimetableResponse;
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text:", text);
        throw new Error("Failed to parse AI response. Please try again with a clearer image.");
    }
    
  } catch (error: any) {
    console.error("Error extracting schedule:", error);
    if (error.message.includes("403") || error.message.includes("API key")) {
         throw new Error("INVALID_API_KEY");
    }
    throw new Error(error.message || "Failed to analyze image.");
  }
};