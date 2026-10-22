import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session-server';

/**
 * Logout.
 *
 * The session cookies are httpOnly, so browser JavaScript cannot delete them.
 * This handler does it server-side.
 */
export async function DELETE(): Promise<Response> {
  await clearSession();
  return NextResponse.json({ success: true, data: null }, { status: 200 });
}
