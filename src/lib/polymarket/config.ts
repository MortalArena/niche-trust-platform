/**
 * Official Polymarket API bases (docs.polymarket.com/api-reference/introduction)
 * - Gamma: markets, events, tags, profiles (public, no auth)
 * - Data: positions, trades, activity (public, no auth)
 * - CLOB: orderbook + trading (auth required for orders — we do not place orders)
 */

export const POLYMARKET = {
  gamma: 'https://gamma-api.polymarket.com',
  data: 'https://data-api.polymarket.com',
  clob: 'https://clob.polymarket.com',
  site: 'https://polymarket.com',
} as const;

export const GAMMA = {
  events: '/events',
  markets: '/markets',
  tags: '/tags',
  publicProfile: '/public-profile',
  search: '/public-search',
} as const;

export const DATA = {
  trades: '/trades',
  positions: '/positions',
  activity: '/activity',
  value: '/value',
  closedPositions: '/closed-positions',
} as const;
