/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ZAN TECH · PLANT-O-METER™ ENTERPRISE AGRITECH IOT SUITE
 * Autonomous Agronomic Decision Support & Agro-Forestry Recommendation Engine
 *
 * Copyright (c) 2026 ZAN Tech. All Rights Reserved.
 * Proprietary & Confidential — ZAN Tech Engineering Division
 * ══════════════════════════════════════════════════════════════════════════════
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in server/.env. Provide an authorized Google Gemini API key.'
    );
  }
  return { apiKey, model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' };
}

/**
 * Executes agronomic evaluation of real-time soil telemetry.
 * Returns { trees: [{ name, reason }], summary }
 *
 * @param {{ moisture: number, temperature: number, ph: number }} reading
 */
export async function suggestTrees(reading) {
  const { moisture, temperature, ph } = reading;
  const { apiKey, model } = getConfig();

  const prompt = `You are an expert agronomic decision engine and agro-forestry specialist analyzing soil conditions for Bangladesh agricultural regions.
Analyze the following physicochemical parameters:
- Volumetric Soil Moisture: ${moisture.toFixed(1)}% VWC
- Sub-surface Temperature: ${temperature.toFixed(1)}°C
- Active Soil pH: ${ph.toFixed(2)}

Recommend exactly 3 tree species or high-value perennial cultivars optimally suited to these precise soil conditions and indigenous to Bangladesh's agro-ecological zones.
For each plant, provide:
1. "name": The common name followed by its botanical/scientific name in parentheses (e.g., "Jackfruit (Artocarpus heterophyllus)").
2. "reason": A concise, technically sound, professional agronomic rationale detailing why this species thrives in this moisture, thermal, and pH profile.

Provide a "summary": A brief, authoritative agronomic verdict characterizing the current soil quality and overall planting suitability.

Respond STRICTLY with valid JSON (no markdown formatting, no code blocks):
{
  "trees": [
    { "name": "Common Name (Botanical Name)", "reason": "Professional agronomic rationale." },
    { "name": "Common Name (Botanical Name)", "reason": "Professional agronomic rationale." },
    { "name": "Common Name (Botanical Name)", "reason": "Professional agronomic rationale." }
  ],
  "summary": "Executive agronomic assessment of current soil conditions."
}`;

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  });

  // Try the configured model first, then fall back if it is overloaded,
  // rate-limited, or retired (503 / 429 / 404).
  const models = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  let res;
  let lastError;
  for (const m of models) {
    res = await fetch(`${GEMINI_BASE_URL}/${m}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body,
    });
    if (res.ok) break;
    const errBody = await res.text();
    lastError = new Error(`Gemini API error ${res.status} (${m}): ${errBody.slice(0, 300)}`);
    if (![404, 429, 503].includes(res.status)) throw lastError;
  }
  if (!res.ok) throw lastError;

  const data = await res.json();
  const raw =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || '{}';

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Inference engine delivered malformed JSON response: ${raw.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.trees) || !parsed.summary) {
    throw new Error(`Schema mismatch in advisory response: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  return parsed;
}
