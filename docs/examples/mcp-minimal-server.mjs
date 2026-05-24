#!/usr/bin/env node
/**
 * Minimal MCP-style HTTP bridge for Niche Trust agent feed.
 * Not a full MCP SDK server — demonstrates how Cursor could call your API.
 *
 * Usage:
 *   NT_API_KEY=nt_live_xxx NT_BASE_URL=http://localhost:3000 node docs/examples/mcp-minimal-server.mjs
 */
const BASE = process.env.NT_BASE_URL ?? 'http://localhost:3000';
const KEY = process.env.NT_API_KEY;
if (!KEY) {
  console.error('Set NT_API_KEY=nt_live_...');
  process.exit(1);
}

const res = await fetch(`${BASE}/api/agent/v1/feed`, {
  headers: { Authorization: `Bearer ${KEY}` },
});
const data = await res.json();
console.log(JSON.stringify({ status: res.status, ...data }, null, 2));
