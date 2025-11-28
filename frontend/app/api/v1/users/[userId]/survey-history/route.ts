import { NextRequest, NextResponse } from 'next/server';
import { proxyGet } from '@/lib/api-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const response = await proxyGet(request, `/api/v1/users/${userId}/survey-history`);
    const data = await response.json();

    // Pass through backend response directly - frontend expects same field names
    // Backend returns: { userId, surveyHistory, totalSessions }
    // Frontend expects: { userId, surveyHistory, totalSessions }
    const transformedData = {
      userId: data.userId,
      surveyHistory: data.surveyHistory || [],
      totalSessions: data.totalSessions || 0,
    };

    return NextResponse.json(transformedData, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    );
  }
}
