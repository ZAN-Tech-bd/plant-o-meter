/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ZAN TECH · PLANT-O-METER™ ENTERPRISE AGRITECH IOT SUITE
 * Telemetry Ingestion Engine & Industrial Admin Gateway
 *
 * Copyright (c) 2026 ZAN Tech. All Rights Reserved.
 * Proprietary & Confidential — ZAN Tech Engineering Division
 * ══════════════════════════════════════════════════════════════════════════════
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';

import { initDb } from './db.js';
import readingsRoutes from './routes/readings.js';
import suggestTreeRoutes from './routes/suggest-tree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0'; // listen on all network interfaces

// ─── Build Fastify app ────────────────────────────────────────────────────────
const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
await fastify.register(cors, {
  origin: true, // allow any local web client
  methods: ['GET', 'POST', 'OPTIONS'],
});

// ─── Static files for Admin Panel ─────────────────────────────────────────────
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/',
});

// Redirect /admin to /
fastify.get('/admin', async (_req, reply) => {
  return reply.redirect('/');
});

// ─── Health check ─────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({
  status: 'ok',
  service: 'plant-o-meter-server',
  time: new Date().toISOString(),
}));

// ─── Feature routes ───────────────────────────────────────────────────────────
await fastify.register(readingsRoutes);
await fastify.register(suggestTreeRoutes);

// ─── Initialise database then start server ────────────────────────────────────
try {
  await initDb();
  await fastify.listen({ port: PORT, host: HOST });

  console.log(`\n🌱 Plant-o-Meter All-in-One Server running!`);
  console.log(`   Admin Panel Dashboard : http://localhost:${PORT}`);
  console.log(`   Health check          : http://localhost:${PORT}/health`);
  console.log(`   Latest reading API    : http://localhost:${PORT}/api/readings/latest\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
