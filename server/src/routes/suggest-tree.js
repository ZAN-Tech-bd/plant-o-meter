// ─── routes/suggest-tree.js ───────────────────────────────────────────────────
// Fastify route plugin: calls Groq AI and returns tree suggestions.

import { getLatestReading } from '../db.js';
import { suggestTrees } from '../groq.js';

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function suggestTreeRoutes(fastify) {
  // ── POST /api/suggest-tree ─────────────────────────────────────────────────
  // Dashboard calls this when the "🌳 Suggest a Tree" button is clicked.
  // Optionally accepts { moisture, temperature, ph } in body; otherwise uses
  // the latest stored reading.
  fastify.post(
    '/api/suggest-tree',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            moisture:    { type: 'number', minimum: 0, maximum: 100 },
            temperature: { type: 'number', minimum: -40, maximum: 100 },
            ph:          { type: 'number', minimum: 0, maximum: 14 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      // Use body values if all three are provided; otherwise fall back to latest DB reading
      let reading =
        request.body &&
        request.body.moisture != null &&
        request.body.temperature != null &&
        request.body.ph != null
          ? request.body
          : await getLatestReading();

      if (!reading) {
        return reply.code(422).send({
          error:
            'No sensor data available yet. Make sure the ESP32 is sending readings.',
        });
      }

      fastify.log.info(
        {
          moisture: reading.moisture,
          temperature: reading.temperature,
          ph: reading.ph,
        },
        'Calling Groq for tree suggestions'
      );

      try {
        const result = await suggestTrees(reading);
        return reply.send(result);
      } catch (err) {
        fastify.log.error(err, 'Groq API call failed');
        return reply.code(502).send({
          error:
            'AI suggestion failed. Check your GROQ_API_KEY and internet connection.',
          detail: err.message,
        });
      }
    }
  );
}
