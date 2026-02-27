import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { verifyToken } from '../users/index.js';
import { TravelAgent } from '../agent/index.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

/**
 * WebSocket handler for real-time chat communication.
 * Provides a persistent connection for the chat interface.
 */
export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const agent = new TravelAgent();

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      const authWs = ws as AuthenticatedSocket;
      if (authWs.isAlive === false) {
        authWs.terminate();
        continue;
      }
      authWs.isAlive = false;
      authWs.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle authentication
        if (message.type === 'auth') {
          try {
            const payload = verifyToken(message.token);
            ws.userId = payload.userId;
            ws.send(JSON.stringify({
              type: 'auth_success',
              userId: payload.userId,
            }));
          } catch {
            ws.send(JSON.stringify({
              type: 'auth_error',
              error: 'Invalid token',
            }));
          }
          return;
        }

        // Require authentication for all other messages
        if (!ws.userId) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Not authenticated. Send {type: "auth", token: "..."} first.',
          }));
          return;
        }

        // Handle chat messages
        if (message.type === 'chat') {
          // Send typing indicator
          ws.send(JSON.stringify({ type: 'typing', isTyping: true }));

          try {
            const response = await agent.chat(ws.userId, message.content);
            ws.send(JSON.stringify({
              type: 'chat_response',
              message: response,
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Failed to process message',
            }));
          } finally {
            ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
          }
          return;
        }

        // Handle calendar scan
        if (message.type === 'scan_calendar') {
          ws.send(JSON.stringify({ type: 'typing', isTyping: true }));

          try {
            const result = await agent.scanCalendar(ws.userId);
            ws.send(JSON.stringify({
              type: 'calendar_scan',
              travelNeeds: result.travelNeeds,
              summary: result.summary,
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Calendar scan failed',
            }));
          } finally {
            ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
          }
          return;
        }

        ws.send(JSON.stringify({
          type: 'error',
          error: `Unknown message type: ${message.type}`,
        }));
      } catch {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format. Send JSON.',
        }));
      }
    });

    ws.on('close', () => {
      // Cleanup
    });

    // Welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to BusinessTravelSearch. Send {type: "auth", token: "..."} to authenticate.',
    }));
  });

  console.log('[WebSocket] Server initialized on /ws');
  return wss;
}
