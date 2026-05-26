export const en = {
  brand: 'Niche Trust',
  nav: {
    trending: 'Trending',
    breaking: 'Breaking',
    new: 'New',
    politics: 'Politics',
    sports: 'Sports',
    crypto: 'Crypto',
    esports: 'Esports',
    finance: 'Finance',
    geopolitics: 'Geopolitics',
    tech: 'Tech',
    culture: 'Culture',
    economy: 'Economy',
    weather: 'Weather',
    elections: 'Elections',
    more: 'More',
    markets: 'Markets',
    groups: 'Expert groups',
    experts: 'Experts',
    leaderboard: 'Intelligence',
    platforms: 'Platforms',
    polymarket: 'Polymarket live',
    dashboard: 'Dashboard',
    admin: 'Admin',
    bots: 'Bots',
    developers: 'Agents API',
    learn: 'Learn',
  },
  header: {
    searchPlaceholder: 'Search markets & experts…',
    howItWorks: 'How it works',
    login: 'Log in',
    signup: 'Sign up',
    signOut: 'Sign out',
  },
  markets: {
    allMarkets: 'All markets',
    liveFromPolymarket: 'Live from Polymarket Gamma API',
    expertCategories: 'Expert signal categories',
    volume24h: '24hr Volume',
    sortAll: 'All',
    sortActive: 'Active',
    hideSports: 'Hide sports',
    hideCrypto: 'Hide crypto',
    hideEarnings: 'Hide earnings',
    publicGroups: 'public groups',
    browseExperts: 'Browse experts in this niche',
  },
  card: {
    yes: 'Yes',
    no: 'No',
    vol: 'Vol.',
    monthly: 'Monthly',
  },
  home: {
    title: 'Know who to trust. Pay who deserves it.',
    subtitle:
      'Polymarket-style categories, multi-chain wallet trust, verified subscriber reviews, and private expert signals.',
    cta: 'Get started',
    browse: 'Browse markets',
  },
  menu: {
    leaderboard: 'Leaderboard',
    rewards: 'Rewards',
    apis: 'APIs',
    darkMode: 'Dark mode',
    language: 'Language',
    accuracy: 'Accuracy',
    documentation: 'Documentation',
    helpCenter: 'Help center',
    terms: 'Terms of use',
  },
  footer: {
    tagline: 'Parallel marketplace for prediction traders & experts',
  },
};

export type Messages = {
  brand: string;
  nav: Record<string, string>;
  header: Record<string, string>;
  markets: Record<string, string>;
  card: Record<string, string>;
  home: Record<string, string>;
  menu: Record<string, string>;
  footer: Record<string, string>;
};
