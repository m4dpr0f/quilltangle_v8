import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Cancel a pending token launch
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { launchId } = body;

    if (!launchId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing launchId',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Only cancel if still pending
    const result = await sql`
      UPDATE token_launches
      SET phase = 'cancelled'
      WHERE id = ${launchId}
        AND phase IN ('pending_signature', 'preparation', 'seeding')
      RETURNING id, name, symbol
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Launch not found or already processed',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      cancelled: result[0],
      message: 'Launch cancelled successfully',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Cancel launch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
