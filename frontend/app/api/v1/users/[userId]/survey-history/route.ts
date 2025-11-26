import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/users/${userId}/survey-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Transform backend response to match frontend expectations
    // Backend returns: { userId, surveyHistory, totalSessions }
    // Frontend expects: { userId, surveys, totalSurveys }
    const transformedData = {
      userId: data.userId,
      surveys: data.surveyHistory || [],
      totalSurveys: data.totalSessions || 0,
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
