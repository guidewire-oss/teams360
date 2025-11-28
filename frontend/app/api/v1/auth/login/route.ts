import { NextRequest, NextResponse } from 'next/server';
import { proxyPost } from '@/lib/api-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyPost(request, '/api/v1/auth/login', body);
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
