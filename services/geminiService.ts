import { GoogleGenAI, Type } from "@google/genai";
import { TimetableResponse } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const extractScheduleFromImage = async (
  base64Data: string,
  mimeType: string
): Promise<TimetableResponse> => {
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
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as TimetableResponse;
  } catch (error) {
    console.error("Error extracting schedule:", error);
    throw error;
  }
};
