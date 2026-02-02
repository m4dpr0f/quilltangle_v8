import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

// This endpoint records token in DB after client-side minting
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { mintAddress, name, symbol, supply, decimals = 6, description, creatorWallet } = body;
    
    if (!mintAddress || !name || !symbol || !supply || !creatorWallet) {
      return new Response(JSON.stringify({
        success: false, error: 'Missing required fields'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const sql = getDb();
    
    // Record in database
    await sql`
      INSERT INTO tokens (mint_address, name, symbol, decimals, total_supply, creator_wallet, realm, description, is_gcn_entry)
      VALUES (${mintAddress}, ${name}, ${symbol.toUpperCase()}, ${decimals}, ${supply}, ${creatorWallet}, 'GCN', ${description || ''}, true)
      ON CONFLICT (mint_address) DO NOTHING
    `;
    
    const tokenResult = await sql`SELECT id FROM tokens WHERE mint_address = ${mintAddress}`;
    const tokenId = tokenResult[0]?.id;
    
    if (tokenId) {
      // Hybrid approach: MAX(1% of supply, 1M tokens)
      const MIN_DEPOSIT_TOKENS = 1_000_000;
      const percentDeposit = supply * 0.01;
      const requiredTokens = Math.max(percentDeposit, MIN_DEPOSIT_TOKENS);
      const reciprocityAmount = Math.floor(requiredTokens * Math.pow(10, decimals));

      await sql`
        INSERT INTO reciprocity_pool (token_id, mint_address, deposited_amount, available_amount, depositor_wallet)
        VALUES (${tokenId}, ${mintAddress}, ${reciprocityAmount}, ${reciprocityAmount}, ${creatorWallet})
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO metaphysics_index (token_id, mint_address) VALUES (${tokenId}, ${mintAddress})
        ON CONFLICT DO NOTHING
      `;
    }
    
    return new Response(JSON.stringify({
      success: true,
      mintAddress,
      message: 'Token registered in 8xM'
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error: any) {
    console.error('Token registration error:', error);
    return new Response(JSON.stringify({
      success: false, error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
