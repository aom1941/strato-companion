#!/usr/bin/env node
import { runMcpServer } from './mcp/server.js';
import { runCli } from './cli/commander.js';

const mode = process.argv[2];

if (mode === 'mcp') {
  runMcpServer().catch((err) => {
    console.error('Fatal MCP Server Error:', err);
    process.exit(1);
  });
} else {
  // Wenn 'cli' übergeben wird oder keine spezifische Mode-Flag
  if (mode === 'cli') {
    // Entferne 'cli' Argument für Commander Parsing
    process.argv.splice(2, 1);
  }
  runCli();
}
