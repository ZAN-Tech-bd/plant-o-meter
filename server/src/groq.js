// ─── groq.js ──────────────────────────────────────────────────────────────────
// Wraps the Groq API call for tree suggestions.
// Uses the OpenAI-compatible SDK endpoint.

import Groq from 'groq-sdk';

// Client is lazily initialised so the server still starts without a key
// (useful for testing the rest of the API offline).
let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        'GROQ_API_KEY is not set. Copy server/.env.example → server/.env and add your key.'
      );
    }
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

/**
 * Ask Groq to suggest trees/plants suited to the given sensor reading.
 * Returns { trees: [{ name, reason }], summary } or throws on error.
 *
 * @param {{ moisture: number, temperature: number, ph: number }} reading
 */
export async function suggestTrees(reading) {
  const { moisture, temperature, ph } = reading;

  const prompt = `You are an agricultural assistant helping school children understand plants.
Given these soil conditions:
- Soil moisture: ${moisture.toFixed(1)}%
- Soil/water temperature: ${temperature.toFixed(1)}°C
- Estimated soil pH: ${ph.toFixed(1)}

Suggest exactly 3 trees or plants that are well-suited to these exact conditions AND are common or native to Bangladesh.
For each plant, give one short, fun sentence explaining why it likes these conditions — use simple words a 10-year-old can understand.
Also write one short encouraging sentence for the kids looking at this display.

Respond with ONLY valid JSON, no markdown, no extra text. Use this exact shape:
{
  "trees": [
    { "name": "Plant Name", "reason": "Kid-friendly one-sentence reason." },
    { "name": "Plant Name", "reason": "Kid-friendly one-sentence reason." },
    { "name": "Plant Name", "reason": "Kid-friendly one-sentence reason." }
  ],
  "summary": "One encouraging sentence for kids."
}`;

  const completion = await getClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Groq returned non-JSON response: ${raw.slice(0, 200)}`);
  }

  // Validate shape
  if (!Array.isArray(parsed.trees) || !parsed.summary) {
    throw new Error(`Unexpected Groq response shape: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  return parsed;
}
