import { NextRequest, NextResponse } from 'next/server';
import { proxyGet } from '@/lib/api-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const assessmentPeriod = searchParams.get('assessmentPeriod');

  let backendPath = `/api/v1/health-checks/team/${teamId}`;
  if (assessmentPeriod) {
    backendPath += `?assessmentPeriod=${encodeURIComponent(assessmentPeriod)}`;
  }

  try {
    const response = await proxyGet(request, backendPath);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    );
  }
}
