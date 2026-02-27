import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes.js';
import { setupWebSocket } from './websocket.js';
import { getConfig } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and configure the Express application and HTTP server.
 */
export function createApp() {
  const app = express();
  const config = getConfig();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for development
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Static files (chat UI)
  app.use(express.static(path.join(__dirname, '../../src/web/public')));

  // API routes
  app.use(router);

  // Serve the chat UI for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../src/web/public/index.html'));
  });

  // Create HTTP server
  const server = createServer(app);

  // Setup WebSocket
  setupWebSocket(server);

  return { app, server, config };
}
