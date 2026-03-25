import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardLayout, saveAdminDashboardLayout } from '@/lib/cms/dashboard';
import type { AdminDashboardLayout } from '@/lib/cms/dashboard/types';
import { withAuth } from '@/lib/cms/permissions/middleware';

export const GET = withAuth(async (_request, _context) => {
  try {
    const layout = await getAdminDashboardLayout();
    return NextResponse.json(layout);
  } catch (error) {
    console.error('Failed to load admin dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to load layout' },
      { status: 500 }
    );
  }
})

export const PUT = withAuth(async (request, _context) => {
  try {
    const body = (await request.json()) as AdminDashboardLayout;
    const saved = await saveAdminDashboardLayout(body);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Failed to save admin dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to save layout' },
      { status: 500 }
    );
  }
})
