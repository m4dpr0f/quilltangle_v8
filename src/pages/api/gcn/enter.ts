import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tokenAddress, roadId, nationName, soulDescription, creatorWallet } = body;
    
    if (!tokenAddress || !roadId || !nationName || !soulDescription || !creatorWallet) {
      return new Response(JSON.stringify({
        success: false, error: 'Missing required fields'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const roadRegex = /^D(2|4|6|8|10|12|20|100)(OUT|UP|DWN|U45|D45)$/;
    if (!roadRegex.test(roadId)) {
      return new Response(JSON.stringify({
        success: false, error: 'Invalid road ID format'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (soulDescription.length < 50 || soulDescription.length > 1000) {
      return new Response(JSON.stringify({
        success: false, error: 'Soul description must be 50-1000 characters'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const sql = getDb();
    
    const tokenResult = await sql`
      SELECT t.id, t.symbol, rp.deposited_amount
      FROM tokens t
      LEFT JOIN reciprocity_pool rp ON t.id = rp.token_id
      WHERE t.mint_address = ${tokenAddress}
    `;
    
    if (tokenResult.length === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'Token not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!tokenResult[0].deposited_amount) {
      return new Response(JSON.stringify({
        success: false, error: 'Token must have 1% in reciprocity pool'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const existingEntry = await sql`SELECT id FROM gcn_entries WHERE road_id = ${roadId} AND status != 'rejected'`;
    if (existingEntry.length > 0) {
      return new Response(JSON.stringify({
        success: false, error: 'Road already claimed'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const diceMatch = roadId.match(/D(\d+)/);
    const dirMatch = roadId.match(/(OUT|UP|DWN|U45|D45)$/);
    
    await sql`
      INSERT INTO gcn_entries (token_id, mint_address, road_id, dice_type, direction, nation_name, soul_description, creator_wallet, status)
      VALUES (${tokenResult[0].id}, ${tokenAddress}, ${roadId}, ${'D' + diceMatch[1]}, ${dirMatch[1]}, ${nationName}, ${soulDescription}, ${creatorWallet}, 'submitted')
    `;
    
    await sql`UPDATE tokens SET is_gcn_entry = true WHERE id = ${tokenResult[0].id}`;
    
    return new Response(JSON.stringify({
      success: true,
      entry: { tokenAddress, roadId, nationName, status: 'submitted' }
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false, error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
