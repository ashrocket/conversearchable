import { loadConfig } from './config/index.js';
import { createApp } from './web/server.js';

/**
 * BusinessTravelSearch - Application Entry Point
 *
 * An LLM-powered business travel booking agent that:
 * - Connects to your calendar to detect travel needs
 * - Searches for real flights via Duffel API
 * - Ranks results honestly based on YOUR preferences, not commissions
 * - Links directly to airlines for booking (no hidden markups)
 * - Learns from your choices to improve recommendations
 * - Coordinates group travel for teams
 */

async function main() {
  console.log('');
  console.log('  ========================================');
  console.log('  BusinessTravelSearch v0.1.0');
  console.log('  Honest AI-Powered Travel Assistant');
  console.log('  ========================================');
  console.log('');

  // Load and validate configuration
  const config = loadConfig();

  // Create the application
  const { server } = createApp();

  // Start the server
  server.listen(config.PORT, () => {
    console.log(`[Server] Running on http://localhost:${config.PORT}`);
    console.log(`[Server] Environment: ${config.NODE_ENV}`);
    console.log('');
    console.log('  Open http://localhost:' + config.PORT + ' in your browser');
    console.log('  Use "Quick Demo" to get started without an account');
    console.log('');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed.');
      process.exit(0);
    });
    // Force exit after 5 seconds
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
