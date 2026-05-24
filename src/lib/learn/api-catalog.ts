/** Niche Trust first-party API routes — not Polymarket CLOB */

export interface ApiEndpoint {
  method: string;
  path: string;
  auth: string;
  description: string;
}

export const NICHE_TRUST_API_SECTIONS: { title: string; endpoints: ApiEndpoint[] }[] = [
  {
    title: 'Agent (AI bots)',
    endpoints: [
      {
        method: 'GET',
        path: '/api/agent/v1/feed',
        auth: 'Bearer nt_live_...',
        description: 'Encrypted signals for subscribed groups',
      },
      {
        method: 'POST',
        path: '/api/agent/keys',
        auth: 'Session (wallet login)',
        description: 'Create API key (secret shown once)',
      },
      {
        method: 'DELETE',
        path: '/api/agent/keys/[id]',
        auth: 'Session',
        description: 'Revoke API key',
      },
    ],
  },
  {
    title: 'Groups & subscriptions',
    endpoints: [
      { method: 'GET', path: '/api/groups', auth: 'Public', description: 'List public groups' },
      { method: 'POST', path: '/api/groups', auth: 'Session', description: 'Create expert group' },
      { method: 'GET', path: '/api/groups/[id]', auth: 'Public', description: 'Group details' },
      { method: 'PATCH', path: '/api/groups/[id]', auth: 'Session (owner)', description: 'Update group' },
      {
        method: 'POST',
        path: '/api/groups/[id]/subscribe',
        auth: 'Session',
        description: 'Start subscription + payment flow',
      },
      {
        method: 'GET',
        path: '/api/groups/[id]/payment-instructions',
        auth: 'Session',
        description: 'Platform wallet payment details',
      },
      {
        method: 'GET/POST',
        path: '/api/groups/[id]/comments',
        auth: 'Session',
        description: 'Public group comments',
      },
      {
        method: 'GET/POST',
        path: '/api/groups/[id]/reviews',
        auth: 'Session (verified subscriber)',
        description: 'Star reviews after paid subscription',
      },
    ],
  },
  {
    title: 'Wallet trust',
    endpoints: [
      { method: 'GET', path: '/api/wallets', auth: 'Session', description: 'Linked wallets' },
      { method: 'POST', path: '/api/wallets', auth: 'Session', description: 'Link wallet' },
      { method: 'DELETE', path: '/api/wallets/[id]', auth: 'Session', description: 'Unlink wallet' },
      { method: 'POST', path: '/api/wallet/sync', auth: 'Session', description: 'Refresh on-chain analysis' },
      { method: 'POST', path: '/api/wallet/analyze', auth: 'Session', description: 'Run trust score job' },
    ],
  },
  {
    title: 'Predictions (on-chain attest)',
    endpoints: [
      { method: 'POST', path: '/api/prediction/publish', auth: 'Session', description: 'Publish encrypted prediction hash' },
      {
        method: 'GET',
        path: '/api/prediction/verify/[hash]',
        auth: 'Public',
        description: 'Verify Solana memo attestation',
      },
    ],
  },
  {
    title: 'Market browse (read-only proxies)',
    endpoints: [
      {
        method: 'GET',
        path: '/api/polymarket/events',
        auth: 'Public',
        description: 'Proxy to Gamma API — events list (browse UI)',
      },
      { method: 'GET', path: '/api/polymarket/tags', auth: 'Public', description: 'Polymarket category tags' },
      { method: 'POST', path: '/api/polymarket/sync', auth: 'Admin/cron', description: 'Internal sync job' },
      { method: 'GET', path: '/api/markets/categories', auth: 'Public', description: 'Expert group categories' },
      { method: 'GET', path: '/api/search', auth: 'Public', description: 'Search events, groups, experts' },
    ],
  },
  {
    title: 'User & expert',
    endpoints: [
      { method: 'GET/PATCH', path: '/api/expert/profile', auth: 'Session', description: 'Expert headline, service types' },
      { method: 'GET/POST', path: '/api/user/matrix', auth: 'Session', description: 'Save Matrix ID for chat invites' },
      { method: 'GET', path: '/api/bots', auth: 'Public', description: 'Expert bots marketplace list' },
    ],
  },
  {
    title: 'Admin',
    endpoints: [
      { method: 'GET', path: '/api/admin/stats', auth: 'Admin wallet', description: 'Platform stats' },
      { method: 'GET/POST', path: '/api/admin/payouts', auth: 'Admin', description: 'Expert payout queue' },
      { method: 'GET/PATCH', path: '/api/admin/settings', auth: 'Admin', description: 'Platform settings' },
    ],
  },
  {
    title: 'System',
    endpoints: [
      { method: 'GET', path: '/api/health', auth: 'Public', description: 'Health check' },
      { method: 'GET/POST', path: '/api/auth/[...nextauth]', auth: 'OAuth/wallet', description: 'Sign-in (SIWS / EVM)' },
      { method: 'POST', path: '/api/cron', auth: 'Secret header', description: 'Scheduled jobs' },
    ],
  },
];
