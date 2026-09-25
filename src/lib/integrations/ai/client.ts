import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 10_000;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Graceful-degradation boundary for every AI call in the app (Build Spec v2
 * Phase 06) — missing key, network failure, timeout, refusal, and bad parses
 * all collapse to null instead of throwing, so every caller can fall back to
 * the deterministic wizard/path behavior with no special-casing. Schema
 * enforcement happens via Zod's own safeParse rather than the provider's
 * native structured-output mode, so swapping providers (this one runs on
 * Gemini's free tier) never has to also match a provider-specific schema
 * dialect — only "does this JSON match the Zod shape" has to hold.
 */
export async function generateStructured<T>(
  schemaName: string,
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
): Promise<T | null> {
  const gemini = getClient();
  if (!gemini) return null;

  try {
    const response = await Promise.race([
      gemini.models.generateContent({
        model: MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          // Without this, Gemini free-styles the JSON shape (e.g. a bare
          // array of IDs instead of the { topicIds: [...] } the Zod schema
          // expects) — schema.safeParse then silently rejects it and every
          // caller sees "no suggestions," indistinguishable from an actual
          // AI failure. Constraining the shape up front avoids that.
          responseSchema: z.toJSONSchema(schema) as Record<string, unknown>,
        },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI call timed out")), TIMEOUT_MS)),
    ]);

    const content = response.text;
    if (typeof content !== "string") return null;

    const parsed = schema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error(`AI call failed (${schemaName}):`, error);
    return null;
  }
}
