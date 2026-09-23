/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ZAN TECH · PLANT-O-METER™ ENTERPRISE AGRITECH IOT SUITE
 * Telemetry Ingestion & Real-Time Query API Routes
 *
 * Copyright (c) 2026 ZAN Tech. All Rights Reserved.
 * Proprietary & Confidential — ZAN Tech Engineering Division
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { insertReading, getLatestReading, getHistory } from '../db.js';

// JSON Schema for incoming sensor payload (Fastify validates this automatically)
const readingBodySchema = {
  type: 'object',
  required: ['moisture', 'temperature', 'ph'],
  properties: {
    deviceId:    { type: 'string', default: 'esp32-01' },
    moisture:    { type: 'number', minimum: 0, maximum: 100 },
    temperature: { type: 'number', minimum: -40, maximum: 100 },
    ph:          { type: 'number', minimum: 0, maximum: 14 },
    timestamp:   { anyOf: [{ type: 'string' }, { type: 'number' }] },
  },
  additionalProperties: false,
};

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function readingsRoutes(fastify) {
  // ── POST /api/readings ─────────────────────────────────────────────────────
  // ESP32 POSTs here every 5 seconds.
  fastify.post(
    '/api/readings',
    { schema: { body: readingBodySchema } },
    async (request, reply) => {
      const { deviceId = 'esp32-01', moisture, temperature, ph } = request.body;

      const id = await insertReading({ deviceId, moisture, temperature, ph });

      fastify.log.info({ id, moisture, temperature, ph }, 'Reading stored');

      return reply.code(201).send({ ok: true, id: Number(id) });
    }
  );

  // ── GET /api/readings/latest ───────────────────────────────────────────────
  // Dashboard polls this every 5 seconds to show live gauges.
  fastify.get('/api/readings/latest', async (_request, reply) => {
    const reading = await getLatestReading();
    if (!reading) {
      return reply
        .code(404)
        .send({ error: 'No readings yet — is the ESP32 connected?' });
    }
    return reply.send(reading);
  });

  // ── GET /api/readings/history?limit=50 ────────────────────────────────────
  // Dashboard fetches this for the line charts.
  fastify.get(
    '/api/readings/history',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
          },
        },
      },
    },
    async (request, reply) => {
      const { limit = 50 } = request.query;
      const rows = await getHistory(limit);
      return reply.send(rows);
    }
  );
}
