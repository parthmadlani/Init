import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";

const MODEL = "mistral-small-latest";
const TIMEOUT_MS = 10_000;

let client: Mistral | null = null;

function getClient(): Mistral | null {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Mistral({ apiKey });
  return client;
}

/**
 * Graceful-degradation boundary for every AI call in the app (Build Spec v2
 * Phase 06) — missing key, network failure, timeout, refusal, and bad parses
 * all collapse to null instead of throwing, so every caller can fall back to
 * the deterministic wizard/path behavior with no special-casing.
 */
export async function generateStructured<T>(
  schemaName: string,
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
): Promise<T | null> {
  const mistral = getClient();
  if (!mistral) return null;

  try {
    const response = await mistral.chat.complete(
      {
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: schemaName,
            schemaDefinition: z.toJSONSchema(schema) as Record<string, unknown>,
            strict: true,
          },
        },
      },
      { timeoutMs: TIMEOUT_MS },
    );

    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = schema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error(`AI call failed (${schemaName}):`, error);
    return null;
  }
}
