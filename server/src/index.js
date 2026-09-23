// ─── index.js ─────────────────────────────────────────────────────────────────
// Plant-o-Meter backend entry point.
// Fastify + libsql SQLite — no cloud dependencies except the Groq API call.

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import { initDb } from './db.js';
import readingsRoutes    from './routes/readings.js';
import suggestTreeRoutes from './routes/suggest-tree.js';

const PORT   = Number(process.env.PORT ?? 4000);
const HOST   = process.env.HOST ?? '0.0.0.0';   // listen on all interfaces so ESP32 can reach us
const ORIGIN = process.env.DASHBOARD_ORIGIN ?? 'http://localhost:3000';

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
  origin: [ORIGIN, /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/],   // dashboard + any LAN IP
  methods: ['GET', 'POST', 'OPTIONS'],
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

  console.log(`\n🌱 Plant-o-Meter server running at http://localhost:${PORT}`);
  console.log(`   Dashboard CORS origin : ${ORIGIN}`);
  console.log(`   Health check          : http://localhost:${PORT}/health`);
  console.log(`   Latest reading        : http://localhost:${PORT}/api/readings/latest\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
