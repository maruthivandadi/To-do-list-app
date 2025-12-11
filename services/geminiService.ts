import { GoogleGenAI, Type } from "@google/genai";
import { TimetableResponse } from "../types";

// Safely access process.env to prevent ReferenceErrors in browser environments without shims
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const GEMINI_API_KEY = getApiKey();

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const extractScheduleFromImage = async (
  base64Data: string,
  mimeType: string
): Promise<TimetableResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing. Please configure the API_KEY environment variable in your deployment settings.");
  }

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
    // Pass through the specific error message
    throw new Error(error.message || "Failed to analyze image.");
  }
};