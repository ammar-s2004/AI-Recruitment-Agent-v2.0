import { GoogleGenAI } from "@google/genai";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { conversation } = await req.json();
    const conversationText = typeof conversation === 'string' ? conversation : JSON.stringify(conversation, null, 2);
    const FINAL_PROMPT = FEEDBACK_PROMPT.replace("{{conversation}}", conversationText);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: FINAL_PROMPT,
            generationConfig: {
                temperature: 1.0,
            }
        });

        console.log("Gemini Feedback Response:", response.text);

        // Return in the same format as before { role: "assistant", content: ... }
        return NextResponse.json({
            role: "assistant",
            content: response.text
        });
    } catch (e) {
        console.error("Gemini Feedback API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}