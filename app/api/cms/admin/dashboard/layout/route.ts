import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardLayout, saveAdminDashboardLayout } from '@/lib/cms/dashboard';
import type { AdminDashboardLayout } from '@/lib/cms/dashboard/types';
import { withTenant } from '@/lib/cms/api/tenant';

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
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
}

export async function PUT(request: NextRequest) {
  return withTenant(request, async () => {
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
}
