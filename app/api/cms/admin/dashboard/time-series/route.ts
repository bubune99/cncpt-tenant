import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { withTenant } from '@/lib/cms/api/tenant';

type Metric = 'revenue' | 'orders' | 'traffic';
type Range = '7d' | '30d' | '90d';

function getDaysFromRange(range: Range): number {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 7;
  }
}

function generateDateBuckets(days: number): { start: Date; label: string }[] {
  const buckets: { start: Date; label: string }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({
      start: d,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return buckets;
}

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  const { searchParams } = request.nextUrl;
  const metric = (searchParams.get('metric') || 'revenue') as Metric;
  const range = (searchParams.get('range') || '7d') as Range;

  try {
    const days = getDaysFromRange(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const buckets = generateDateBuckets(days);

    if (metric === 'revenue') {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        select: { createdAt: true, total: true },
      });

      const data = buckets.map((b) => {
        const nextDay = new Date(b.start);
        nextDay.setDate(nextDay.getDate() + 1);
        const dayOrders = orders.filter(
          (o) => o.createdAt >= b.start && o.createdAt < nextDay
        );
        const total = dayOrders.reduce(
          (sum, o) => sum + (o.total ? Number(o.total) / 100 : 0),
          0
        );
        return { date: b.label, value: Math.round(total * 100) / 100 };
      });

      return NextResponse.json({ metric, range, data });
    }

    if (metric === 'orders') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      });

      const data = buckets.map((b) => {
        const nextDay = new Date(b.start);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = orders.filter(
          (o) => o.createdAt >= b.start && o.createdAt < nextDay
        ).length;
        return { date: b.label, value: count };
      });

      return NextResponse.json({ metric, range, data });
    }

    if (metric === 'traffic') {
      const events = await prisma.analyticsEvent
        .findMany({
          where: {
            createdAt: { gte: startDate },
            eventName: 'page_view',
          },
          select: { createdAt: true },
        })
        .catch(() => [] as { createdAt: Date }[]);

      const data = buckets.map((b) => {
        const nextDay = new Date(b.start);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = events.filter(
          (e) => e.createdAt >= b.start && e.createdAt < nextDay
        ).length;
        return { date: b.label, value: count };
      });

      return NextResponse.json({ metric, range, data });
    }

    return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
  } catch (error) {
    console.error('Failed to fetch time-series data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
  })
}
