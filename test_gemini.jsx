const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
    console.log("Starting Gemini API Test (Latest SDK)...");

    // API Key from .env.local
    const API_KEY = "AIzaSyDkaB6a_JETrVEMGNgl4GJBD5EHRUJjxuE";

    if (!API_KEY || API_KEY.startsWith("ENTER_YOUR")) {
        console.error("❌ Error: Invalid API Key. Please check your .env.local file.");
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = "Hello Gemini! If you can read this, respond with 'Success: I am working correctly!'.";

        console.log("Sending prompt to Gemini using latest ai.models.generateContent...");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt
        });

        const text = response.text;

        console.log("\n--- Gemini's Response ---");
        console.log(text);
        console.log("-------------------------\n");

        if (text.includes("Success")) {
            console.log("✅ TEST PASSED: Gemini API is working perfectly with the latest SDK.");
        } else {
            console.log("⚠️ TEST PARTIAL: Gemini responded, but not with the expected text.");
        }
    } catch (error) {
        console.error("❌ TEST FAILED: Error calling Gemini API.");
        console.error(error.message);
        if (error.status) console.error("Status Code:", error.status);
    }
}

testGemini();
