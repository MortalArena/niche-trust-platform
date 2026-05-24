import { NextResponse } from 'next/server';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';

export async function GET() {
  return NextResponse.json({ categories: MARKET_CATEGORIES });
}
