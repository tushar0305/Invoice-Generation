import { NextResponse } from 'next/server';

// Analytics endpoint removed — return 410 Gone so clients stop posting.
export async function POST() {
  return new NextResponse(JSON.stringify({ error: 'Analytics disabled' }), {
    status: 410,
    headers: { 'content-type': 'application/json' },
  });
}
