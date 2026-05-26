import { PageShell } from '@/components/ui/page-shell';
import { LeaderboardClient } from './leaderboard-client';

export const metadata = {
  title: 'Intelligence — Polymarket wallet rankings | Niche Trust',
  description:
    'Live Polymarket trader leaderboard with Edge Score, ROI, win rate, and precomputed ranking boards.',
};

export default function IntelligenceLeaderboardPage() {
  return (
    <PageShell>
      <LeaderboardClient />
    </PageShell>
  );
}
