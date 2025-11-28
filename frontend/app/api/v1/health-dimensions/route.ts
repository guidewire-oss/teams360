import { NextRequest, NextResponse } from 'next/server';
import { proxyGet } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  try {
    const response = await proxyGet(request, '/api/v1/health-dimensions');
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
