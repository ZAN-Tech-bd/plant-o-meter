/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ZAN TECH · PLANT-O-METER™ ENTERPRISE AGRITECH IOT SUITE
 * Autonomous Agronomic Decision Support & Agro-Forestry Recommendation Engine
 *
 * Copyright (c) 2026 ZAN Tech. All Rights Reserved.
 * Proprietary & Confidential — ZAN Tech Engineering Division
 * ══════════════════════════════════════════════════════════════════════════════
 */

import Groq from 'groq-sdk';

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        'GROQ_API_KEY is not configured in server/.env. Provide an authorized Groq Cloud API key.'
      );
    }
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

/**
 * Executes agronomic evaluation of real-time soil telemetry.
 * Returns { trees: [{ name, reason }], summary }
 *
 * @param {{ moisture: number, temperature: number, ph: number }} reading
 */
export async function suggestTrees(reading) {
  const { moisture, temperature, ph } = reading;

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

  const completion = await getClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

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
