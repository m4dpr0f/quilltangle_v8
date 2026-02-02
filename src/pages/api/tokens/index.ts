import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const gcnOnly = url.searchParams.get('gcnOnly') === 'true';
  
  try {
    const sql = getDb();
    let tokens;
    
    if (gcnOnly) {
      tokens = await sql`SELECT * FROM tokens WHERE is_gcn_entry = true ORDER BY created_at DESC`;
    } else {
      tokens = await sql`SELECT * FROM tokens ORDER BY created_at DESC`;
    }
    
    return new Response(JSON.stringify({ success: true, tokens }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
