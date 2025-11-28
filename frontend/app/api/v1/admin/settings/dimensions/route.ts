import { NextRequest, NextResponse } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  try {
    const response = await proxyGet(request, '/api/v1/admin/settings/dimensions');
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyPost(request, '/api/v1/admin/settings/dimensions', body);
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
