import { QUESTIONS_PROMPT, QUESTIONS_PROMPT_WITH_RESUME } from "@/services/Constants";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key to access storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function waitForFileActive(ai, fileName) {
  let file = await ai.files.get({ name: fileName });
  let attempts = 0;
  while (file.state === "PROCESSING" && attempts < 20) {
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: fileName });
    attempts++;
  }
  if (file.state !== "ACTIVE") {
    throw new Error(`File ${fileName} did not become ACTIVE. State: ${file.state}`);
  }
  return file;
}

export async function POST(req) {
  const { jobposition, jobdescription, duration, type, candidateEmail } = await req.json();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let uploadedFileName = null;

  try {
    // --- Check if candidate has a CV uploaded ---
    let cvFileData = null;

    if (candidateEmail) {
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("cv_file_path")
        .eq("email", candidateEmail)
        .single();

      if (userData?.cv_file_path) {
        // Download CV from Supabase Storage
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from("cv-uploads")
          .download(userData.cv_file_path);

        if (!downloadError && fileData) {
          // Convert to buffer
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Google File API
          const uploadResult = await ai.files.upload({
            file: new Blob([buffer], { type: "application/pdf" }),
            config: { mimeType: "application/pdf", displayName: `candidate_cv_${candidateEmail}` },
          });

          uploadedFileName = uploadResult.name;

          // Wait for file to be ACTIVE
          const activeFile = await waitForFileActive(ai, uploadedFileName);
          cvFileData = { fileUri: activeFile.uri, mimeType: "application/pdf" };
        }
      }
    }

    // --- Build prompt ---
    const promptTemplate = cvFileData ? QUESTIONS_PROMPT_WITH_RESUME : QUESTIONS_PROMPT;
    const FINAL_PROMPT = promptTemplate
      .replace("{{jobTitle}}", jobposition)
      .replace("{{jobDescription}}", jobdescription)
      .replace("{{duration}}", duration)
      .replace("{{type}}", type);

    // --- Build contents ---
    let contents;
    if (cvFileData) {
      contents = [
        {
          parts: [
            { text: FINAL_PROMPT },
            { fileData: cvFileData },
          ],
        },
      ];
    } else {
      contents = FINAL_PROMPT;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      generationConfig: {
        temperature: 1.0,
      },
    });

    console.log("Gemini Response:", response.text);

    return NextResponse.json({ content: response.text, hasResume: !!cvFileData });
  } catch (e) {
    console.error("AI Model API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    // Cleanup: delete the uploaded file from Google File API
    if (uploadedFileName) {
      try {
        await ai.files.delete({ name: uploadedFileName });
      } catch (cleanupErr) {
        console.warn("Failed to delete Google File API file:", cleanupErr.message);
      }
    }
  }
}