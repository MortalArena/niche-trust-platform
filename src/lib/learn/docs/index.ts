import type { LearnDoc } from '../types';

const DOCS: LearnDoc[] = [
  {
    slug: '',
    title: 'Niche Trust documentation',
    description:
      'Build on a Polymarket-style expert marketplace: wallet trust, paid groups, encrypted chat, and agent APIs.',
    blocks: [
      {
        type: 'p',
        text: 'Build on a parallel marketplace for prediction traders and paid experts — wallet trust, encrypted groups, and agent APIs. We are not a trading exchange; Polymarket order placement is documented on docs.polymarket.com.',
      },
      {
        type: 'hero',
        title: 'Developer quickstart',
        description:
          'Run locally, connect a wallet, subscribe to a group, and call GET /api/agent/v1/feed with an nt_live_ key — usually under 10 minutes.',
        ctaHref: '/learn/quickstart',
        ctaLabel: 'Get started →',
      },
      {
        type: 'links',
        items: [
          { href: '/learn/documentation-scope', label: 'What we document vs Polymarket →' },
          { href: '/learn/api-reference', label: 'API reference →' },
        ],
      },
      { type: 'h2', text: 'What ships today' },
      {
        type: 'ul',
        items: [
          'REST agent API with `nt_live_` API keys (`/api/agent/v1/feed`)',
          'Matrix encrypted rooms per paid group',
          '5% platform commission on subscriptions',
          'Polymarket Gamma browse + Kalshi/Manifold platform pages',
          'Polymarket Intelligence Engine — live leaderboard + Edge Score (refreshed every 5 min)',
          'Example MCP config + Agent Skill files in the repo (optional integrations)',
        ],
      },
    ],
  },
  {
    slug: 'intelligence-engine',
    title: 'Intelligence engine',
    description:
      'Data pipeline + wallet analytics + precomputed rankings — the core moat of Niche Trust.',
    blocks: [
      {
        type: 'p',
        text: 'This is not a chat app first. It is a Bloomberg-style reputation layer for Polymarket traders: discover wallets, score them, rank them, and let users compete for status.',
      },
      { type: 'h2', text: 'Architecture (4 phases)' },
      {
        type: 'ol',
        items: [
          'Data collection — Polymarket Gamma + Data API (trades, positions, profiles). Incremental sync every 5 minutes.',
          'Wallet intelligence — ROI, win rate, volume, risk, consistency, timing proxy, Edge Score.',
          'Ranking engine — precomputed boards: Top Edge, Highest ROI, Best Win Rate, Most Consistent, Smart Money Volume.',
          'Live UI — /leaderboard reads from PostgreSQL cache (fast, no live API on page load).',
        ],
      },
      { type: 'h2', text: 'Edge Score formula' },
      {
        type: 'code',
        language: 'text',
        code: `EDGE =
  40% ROI (normalized)
+ 25% Consistency
+ 15% Risk management (inverse drawdown)
+ 10% Timing activity
+ 10% Trade volume / month`,
      },
      { type: 'h2', text: 'Cron on production' },
      {
        type: 'p',
        text: 'Vercel cron hits GET /api/cron/refresh-leaderboard every 5 minutes (requires CRON_SECRET). Health: GET /api/intelligence/status',
      },
      {
        type: 'links',
        items: [
          { href: '/leaderboard', label: 'Open Intelligence leaderboard →' },
          { href: '/api/intelligence/status', label: 'Pipeline status JSON →' },
        ],
      },
    ],
  },
  {
    slug: 'documentation-scope',
    title: 'What we document (vs Polymarket)',
    description:
      'Deep review: which Polymarket-style topics belong in Niche Trust Learn, and which stay on docs.polymarket.com.',
    blocks: [
      {
        type: 'callout',
        variant: 'warning',
        title: 'Niche Trust ≠ Polymarket',
        text: 'Polymarket docs describe a CLOB trading exchange (orders, orderbook, bridge, relayer, WebSockets for trading). Niche Trust is an expert marketplace that browses public market data and sells private signals — we do not replicate their trading API.',
      },
      { type: 'h2', text: 'Do NOT document on Niche Trust (use Polymarket official docs)' },
      {
        type: 'ul',
        items: [
          'Authentication for Polymarket trading / API keys for CLOB',
          'Rate limits, geographic restrictions, TypeScript/Python CLOB SDKs',
          'POST orders, cancel orders, order scoring, heartbeat, gasless txs',
          'Orderbook & pricing for execution (midpoint, spread, batch prices for trading)',
          'Trades, builder leaderboard, maker rebates, rewards programs',
          'Bridge deposits/withdrawals, relayer, CTF tokens on Polymarket',
          'WebSocket market/user/sports channels for live trading',
          'Polymarket profile positions, accounting ZIP, sports metadata APIs',
        ],
      },
      { type: 'h2', text: 'Document on Niche Trust (our product)' },
      {
        type: 'ul',
        items: [
          'Wallet sign-in (Solana + EVM) and session auth',
          'Expert groups, subscriptions, 5% platform fee, admin payouts',
          'Matrix encrypted chat for subscribers',
          'Agent API (nt_live_ keys) + optional MCP/Skill examples',
          'Wallet trust scores (analyze/sync)',
          'On-chain prediction publish/verify (Solana memo)',
          'Our read-only Polymarket Gamma proxies + /polymarket UI',
          'Kalshi & Manifold browse pages',
          'Search, comments, reviews, bots marketplace',
        ],
      },
      { type: 'h2', text: 'Overlap — explain, do not duplicate' },
      {
        type: 'table',
        headers: ['Topic', 'Polymarket docs', 'Niche Trust Learn'],
        rows: [
          ['List events / markets', 'Full Gamma + CLOB reference', 'Only our GET /api/polymarket/* proxies + link out'],
          ['Search', 'Their search API', 'GET /api/search (groups + experts + PM events)'],
          ['User profile', 'PM wallet positions & PnL', '/trader/[wallet] trust + expert groups'],
          ['Comments', 'PM market comments API', 'Group public comments only'],
          ['Leaderboard', 'PM trader leaderboard', '/experts + trust scores'],
        ],
      },
      {
        type: 'links',
        items: [
          { href: 'https://docs.polymarket.com/', label: 'Polymarket official documentation ↗' },
          { href: '/learn/polymarket-data', label: 'Our Polymarket browse layer →' },
        ],
      },
    ],
  },
  {
    slug: 'authentication',
    title: 'Authentication',
    description: 'How users and agents authenticate on Niche Trust.',
    blocks: [
      { type: 'h2', text: 'Human users (browser)' },
      {
        type: 'p',
        text: 'Sign in at /connect via Auth.js — Solana (SIWS) or EVM wallet. Session cookie used for dashboard, group subscribe, API key management.',
      },
      { type: 'h2', text: 'AI agents (automation)' },
      {
        type: 'p',
        text: 'Create an API key at /learn/agent-api. Send Authorization: Bearer nt_live_... on GET /api/agent/v1/feed. Keys are hashed server-side; plaintext shown once at creation.',
      },
      { type: 'h2', text: 'Admin' },
      {
        type: 'p',
        text: 'Admin routes require a wallet in ADMIN_WALLET_ADDRESSES after normal sign-in.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'We do not issue Polymarket CLOB API keys — trading auth is entirely on Polymarket’s side.',
      },
    ],
  },
  {
    slug: 'polymarket-data',
    title: 'Polymarket data (read-only)',
    description: 'What Niche Trust exposes for browsing — not for placing orders.',
    blocks: [
      {
        type: 'p',
        text: 'The /polymarket page and category nav use Polymarket’s public Gamma API (events, tags). Niche Trust proxies a subset for the UI and search — we do not operate a CLOB or accept orders.',
      },
      { type: 'h2', text: 'Our endpoints' },
      {
        type: 'ul',
        items: [
          'GET /api/polymarket/events — event list (query: limit, tag_slug, active)',
          'GET /api/polymarket/tags — category tags',
          'POST /api/polymarket/sync — internal/cron cache refresh',
        ],
      },
      { type: 'h2', text: 'For trading or live orderbook' },
      {
        type: 'p',
        text: 'Use Polymarket’s CLOB API, SDKs, and WebSockets documented at docs.polymarket.com. Link your users there for deposits, orders, and positions.',
      },
      {
        type: 'code',
        language: 'bash',
        code: `# Example: browse via Niche Trust (read-only)
curl "http://localhost:3000/api/polymarket/events?limit=5"`,
      },
    ],
  },
  {
    slug: 'quickstart',
    title: 'Quickstart',
    description: 'Run the app locally and complete your first flows in under 10 minutes.',
    blocks: [
      { type: 'h2', text: '1. Prerequisites' },
      {
        type: 'ul',
        items: ['Node 20+', 'pnpm', 'Docker (PostgreSQL + Redis)', 'A Solana or EVM wallet for /connect'],
      },
      { type: 'h2', text: '2. Start infrastructure' },
      {
        type: 'code',
        language: 'bash',
        filename: 'terminal',
        code: `cd niche-trust-platform
pnpm install
pnpm docker:up
pnpm db:push
npx prisma generate
pnpm dev`,
      },
      { type: 'h2', text: '3. Open the app' },
      {
        type: 'p',
        text: 'Visit http://localhost:3000 — homepage, markets, and expert groups should load. Use /learn for all documentation (this section).',
      },
      { type: 'h2', text: '4. Sign in' },
      {
        type: 'ol',
        items: [
          'Go to /connect and sign in with Solana (Phantom) or EVM wallet.',
          'Open /dashboard — customer vs expert tabs.',
          'Experts: create a group at /groups/new.',
        ],
      },
      { type: 'h2', text: '5. Test the agent API' },
      {
        type: 'ol',
        items: [
          'Subscribe to a paid group (or create one as expert).',
          'Open /learn/agent-api and create an API key.',
          'Run the curl example on that page — expect HTTP 200 with JSON.',
        ],
      },
      {
        type: 'links',
        items: [
          { href: '/learn/environment', label: 'Environment variables →' },
          { href: '/learn/encrypted-chat', label: 'Matrix encrypted chat →' },
        ],
      },
    ],
  },
  {
    slug: 'platform-overview',
    title: 'Platform overview',
    description: 'How the main pieces fit together.',
    blocks: [
      { type: 'h2', text: 'User roles' },
      {
        type: 'ul',
        items: [
          'Subscriber — pays for expert groups, reviews, encrypted chat, agent feed access.',
          'Expert — owns groups, publishes signals, receives 95% of subscription after 5% platform fee.',
          'Admin — payout queue and platform settings (wallet allowlist).',
        ],
      },
      { type: 'h2', text: 'Main routes' },
      {
        type: 'ul',
        items: [
          '/ — homepage & search',
          '/polymarket — live Polymarket events',
          '/groups — paid expert groups',
          '/experts — leaderboard & profiles',
          '/trader/[wallet] — on-chain trust metrics',
          '/learn — documentation (you are here)',
          '/developers — redirects to agent API tools',
        ],
      },
      { type: 'h2', text: 'Data you cannot read' },
      {
        type: 'p',
        text: 'Expert signal plaintext and Matrix messages are end-to-end encrypted. The platform stores ciphertext, hashes, and payment metadata only.',
      },
    ],
  },
  {
    slug: 'wallet-trust',
    title: 'Wallet trust scores',
    description: 'On-chain analysis surfaced on expert and trader profiles.',
    blocks: [
      {
        type: 'p',
        text: 'When a wallet is linked, the platform computes trust score, ROI, win rate, and risk level from on-chain activity (per chain). View results on /trader/[wallet] and in the dashboard.',
      },
      { type: 'h2', text: 'Sync a wallet' },
      {
        type: 'p',
        text: 'Authenticated users can trigger analysis via the dashboard or POST /api/wallet/sync. Requires ETHERSCAN_API_KEY (and related env) for EVM chains.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A wallet with zero trades shows 0% metrics — that is expected until on-chain history exists.',
      },
    ],
  },
  {
    slug: 'expert-groups',
    title: 'Expert groups & subscriptions',
    description: 'Paid groups, public listings, and subscriber reviews.',
    blocks: [
      { type: 'h2', text: 'Create a group' },
      {
        type: 'ol',
        items: [
          'Sign in → /groups/new',
          'Set name, category, monthly/yearly USD price, public/private',
          'A Matrix room is created when Matrix is configured (see Encrypted chat)',
        ],
      },
      { type: 'h2', text: 'Subscribe' },
      {
        type: 'ol',
        items: [
          'Open /groups/[id] → Subscribe',
          'Pay platform wallet (Polygon/Solana) per payment instructions',
          'After verification, you get chat access + agent feed entitlement',
        ],
      },
      { type: 'h2', text: 'Public comments vs private chat' },
      {
        type: 'ul',
        items: [
          'Comments tab — public discussion on the group page',
          'Encrypted chat tab — Matrix E2EE, subscribers + expert only',
        ],
      },
    ],
  },
  {
    slug: 'encrypted-chat',
    title: 'Encrypted chat (Matrix)',
    description: 'Private Megolm-encrypted rooms for each paid group.',
    blocks: [
      { type: 'h2', text: 'Where to find chat' },
      {
        type: 'ol',
        items: [
          'Subscribe to a group (or own it as expert)',
          'Open /groups/[id]',
          'Click the Encrypted chat tab',
        ],
      },
      { type: 'h2', text: 'Matrix setup (server)' },
      {
        type: 'p',
        text: 'Configure MATRIX_HOMESERVER, MATRIX_ADMIN_TOKEN, and NEXT_PUBLIC_MATRIX_ELEMENT_URL in .env. Without these, the UI shows a configuration notice instead of the embed.',
      },
      { type: 'h2', text: 'Matrix ID (user)' },
      {
        type: 'ol',
        items: [
          'Create an account on your Element/Web client',
          'Save @user:homeserver in the dashboard (Matrix ID field)',
          'After payment, the platform invites your ID to the group room',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Not the same as the agent API',
        text: 'Chat is real-time Matrix. The agent API returns encrypted signal payloads for bots — many teams use both.',
      },
    ],
  },
  {
    slug: 'payments',
    title: 'Payments & commission',
    description: '5% platform fee, expert balance, and admin payouts.',
    blocks: [
      {
        type: 'p',
        text: 'Subscribers pay the platform treasury wallet first. After on-chain verification, 95% is credited to the expert balance and 5% is retained as platform revenue.',
      },
      { type: 'h2', text: 'Expert payouts' },
      {
        type: 'p',
        text: 'Experts request withdrawal from /dashboard; admins approve in /admin. Set PLATFORM_WALLET_POLYGON, PLATFORM_WALLET_SOLANA, and ADMIN_WALLET_ADDRESSES.',
      },
    ],
  },
  {
    slug: 'agent-api',
    title: 'Agent REST API',
    description: 'Universal HTTP integration for bots and LLM agents — no MCP required.',
    blocks: [
      {
        type: 'p',
        text: 'This is the primary integration. Any tool that can send HTTP + Bearer auth works: Python, Node, n8n, LangChain, custom trading bots.',
      },
      { type: 'h2', text: 'Step 1 — Create a key' },
      { type: 'agent-keys' },
      { type: 'h2', text: 'Step 2 — Subscribe' },
      {
        type: 'p',
        text: 'Your key only returns data for groups you actively subscribe to. Without a subscription you will get HTTP 403.',
      },
      { type: 'h2', text: 'Step 3 — Call the feed' },
      {
        type: 'code',
        language: 'bash',
        code: `curl -s -H "Authorization: Bearer nt_live_YOUR_KEY" \\
  "http://localhost:3000/api/agent/v1/feed"`,
      },
      { type: 'h2', text: 'Response shape' },
      {
        type: 'code',
        language: 'json',
        code: `{
  "groups": [{ "id": "...", "name": "...", "matrixRoomId": "!" }],
  "signals": [{
    "groupId": "...",
    "encryptedPayload": "<ciphertext>",
    "contentHash": "...",
    "createdAt": "2026-05-23T..."
  }]
}`,
      },
      { type: 'h2', text: 'Optional query' },
      {
        type: 'code',
        language: 'bash',
        code: 'curl -H "Authorization: Bearer nt_live_..." "http://localhost:3000/api/agent/v1/feed?since=2026-05-01T00:00:00Z"',
      },
      {
        type: 'links',
        items: [
          { href: '/learn/api-reference', label: 'Full API reference →' },
          { href: '/learn/mcp', label: 'Optional MCP wrapper →' },
        ],
      },
    ],
  },
  {
    slug: 'mcp',
    title: 'MCP (Model Context Protocol)',
    description: 'Optional IDE integration — not required for production agents.',
    blocks: [
      {
        type: 'callout',
        variant: 'warning',
        title: 'MCP is not built into the running app',
        text: 'Niche Trust does not ship a hosted MCP server today. You get a REST API. MCP is an optional wrapper you can add for Cursor/Claude Desktop so tools appear in the IDE automatically.',
      },
      { type: 'h2', text: 'What exists in the repo' },
      {
        type: 'ul',
        items: [
          'public/learn/examples/cursor-mcp.json — sample Cursor MCP config stub',
          'docs/examples/mcp-minimal-server.mjs — Node script that calls /api/agent/v1/feed',
          'This page — step-by-step setup',
        ],
      },
      { type: 'h2', text: 'When to use MCP' },
      {
        type: 'ul',
        items: [
          'You develop inside Cursor and want the model to call "fetch expert feed" as a tool',
          'You do NOT need MCP for production bots — use REST directly',
        ],
      },
      { type: 'h2', text: 'Step 1 — Download the example config' },
      {
        type: 'p',
        text: 'Open /learn/examples/cursor-mcp.json in your browser or copy from public/learn/examples/cursor-mcp.json in the repo.',
      },
      {
        type: 'links',
        items: [{ href: '/learn/examples/cursor-mcp.json', label: 'cursor-mcp.json →' }],
      },
      { type: 'h2', text: 'Step 2 — Test the feed without MCP' },
      {
        type: 'code',
        language: 'bash',
        code: `export NT_API_KEY=nt_live_your_key
export NT_BASE_URL=http://localhost:3000
node docs/examples/mcp-minimal-server.mjs`,
      },
      { type: 'h2', text: 'Step 3 — Wire a real MCP server (advanced)' },
      {
        type: 'p',
        text: 'Implement an MCP server (e.g. @modelcontextprotocol/sdk) with one tool: niche_trust_feed → proxies to GET /api/agent/v1/feed with the user Bearer token. Point Cursor mcp.json at that process.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'We may ship an official @niche-trust/mcp-server package later. Until then, REST + the example script above is the supported path.',
      },
    ],
  },
  {
    slug: 'skills',
    title: 'Agent skills (optional)',
    description: 'Instruction files for Cursor/Claude — separate from the running platform.',
    blocks: [
      {
        type: 'callout',
        variant: 'warning',
        title: 'Skills are not installed automatically',
        text: 'A "Skill" is a markdown file (SKILL.md) that teaches an AI assistant how to use your API. Niche Trust does not load skills at runtime — you copy them into your agent harness (Cursor, Claude Code, etc.).',
      },
      { type: 'h2', text: 'Example skill file in this repo' },
      {
        type: 'links',
        items: [
          {
            href: '/learn/examples/niche-trust-agent.SKILL.md',
            label: 'Download niche-trust-agent.SKILL.md →',
          },
        ],
      },
      { type: 'h2', text: 'Install in Cursor (example)' },
      {
        type: 'ol',
        items: [
          'Copy public/learn/examples/niche-trust-agent.SKILL.md',
          'Paste into your user or project skills folder (see Cursor docs: Agent Skills)',
          'Restart the agent session',
          'Ask: "Pull my Niche Trust feed using my nt_live key"',
        ],
      },
      { type: 'h2', text: 'Skills vs MCP vs REST' },
      {
        type: 'ul',
        items: [
          'REST API — required for real automation; works everywhere',
          'Skill — teaches the model what to call; no code runs by itself',
          'MCP — exposes tools to the IDE; optional wrapper around REST',
        ],
      },
    ],
  },
  {
    slug: 'external-platforms',
    title: 'Polymarket, Kalshi, Manifold',
    description: 'External market data shown alongside expert groups.',
    blocks: [
      {
        type: 'ul',
        items: [
          '/polymarket — Gamma API live events (same family as docs.polymarket.com data source)',
          '/platforms/kalshi — Kalshi events + parsed parlay legs',
          '/platforms/manifold — Manifold questions',
        ],
      },
      {
        type: 'p',
        text: 'Experts tag groups by category so subscribers discover niches parallel to these markets. External APIs are read-only browse — trading happens on each platform.',
      },
      {
        type: 'links',
        items: [{ href: 'https://docs.polymarket.com/', label: 'Polymarket official docs (external) →' }],
      },
    ],
  },
  {
    slug: 'api-reference',
    title: 'API reference',
    description: 'All first-party Niche Trust HTTP routes. For Polymarket trading APIs see docs.polymarket.com.',
    blocks: [
      {
        type: 'callout',
        variant: 'info',
        text: 'This catalog is only Niche Trust. It is intentionally smaller than Polymarket’s CLOB reference — we do not host their order, bridge, or WebSocket trading APIs.',
      },
      { type: 'api-catalog' },
    ],
  },
  {
    slug: 'environment',
    title: 'Environment variables',
    description: 'Required and optional configuration.',
    blocks: [
      {
        type: 'code',
        language: 'env',
        code: `# Core
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# Payments
PLATFORM_WALLET_POLYGON=
PLATFORM_WALLET_SOLANA=
ADMIN_WALLET_ADDRESSES=

# Matrix chat
MATRIX_HOMESERVER=
MATRIX_ADMIN_TOKEN=
NEXT_PUBLIC_MATRIX_ELEMENT_URL=

# On-chain analysis
ETHERSCAN_API_KEY=
MEMO_SIGNER_SECRET=`,
      },
    ],
  },
];

const BY_SLUG = new Map(DOCS.map((d) => [d.slug, d]));

export function getLearnDoc(slug: string): LearnDoc | undefined {
  return BY_SLUG.get(slug);
}

export function getAllLearnSlugs(): string[] {
  return DOCS.map((d) => d.slug).filter(Boolean);
}
