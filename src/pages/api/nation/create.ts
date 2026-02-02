import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { gcnEntryId, mintAddress, emoji, flagUri, walletAddress } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!gcnEntryId && !mintAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either gcnEntryId or mintAddress required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate emoji (single character or emoji)
    if (emoji && emoji.length > 2) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Emoji must be a single character',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get GCN entry
    let gcnEntry;
    if (gcnEntryId) {
      const result = await sql`
        SELECT * FROM gcn_entries WHERE id = ${gcnEntryId}
      `;
      gcnEntry = result[0];
    } else {
      const result = await sql`
        SELECT * FROM gcn_entries WHERE mint_address = ${mintAddress}
      `;
      gcnEntry = result[0];
    }

    if (!gcnEntry) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GCN entry not found. Apply for GCN first.',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify wallet owns this GCN
    if (gcnEntry.creator_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the GCN creator can found this nation',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if nation already exists for this GCN
    const existingNation = await sql`
      SELECT id FROM nations WHERE gcn_entry_id = ${gcnEntry.id}
    `;

    if (existingNation.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nation already founded for this GCN',
        nationId: existingNation[0].id,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Create nation
    const nationEmoji = emoji || gcnEntry.nation_name.charAt(0).toUpperCase();

    const result = await sql`
      INSERT INTO nations (
        gcn_entry_id,
        mint_address,
        name,
        emoji,
        flag_uri,
        founder_wallet
      ) VALUES (
        ${gcnEntry.id},
        ${gcnEntry.mint_address},
        ${gcnEntry.nation_name},
        ${nationEmoji},
        ${flagUri || null},
        ${walletAddress}
      )
      RETURNING *
    `;

    const nation = result[0];

    return new Response(JSON.stringify({
      success: true,
      message: 'Nation founded successfully!',
      nation: {
        id: nation.id,
        name: nation.name,
        emoji: nation.emoji,
        mint_address: nation.mint_address,
        founder_wallet: nation.founder_wallet,
        total_territory_count: 0,
        defense_rating: 100,
        attack_rating: 100,
      },
      nextSteps: [
        'Claim your first territory on the map',
        'Stake tokens to increase defense',
        'Form alliances with other nations',
      ],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET endpoint to list nations or get by wallet
export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const wallet = url.searchParams.get('wallet');

    if (wallet) {
      const result = await sql`
        SELECT
          n.*,
          g.nation_name as gcn_name,
          g.soul_description,
          g.road_id as gcn_road,
          g.stewardship_level
        FROM nations n
        JOIN gcn_entries g ON n.gcn_entry_id = g.id
        WHERE n.founder_wallet = ${wallet}
      `;

      return new Response(JSON.stringify({
        success: true,
        nations: result,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Leaderboard
    const result = await sql`
      SELECT
        n.*,
        g.soul_description,
        g.stewardship_level,
        (SELECT COUNT(*) FROM territories t WHERE t.nation_id = n.id) as territory_count
      FROM nations n
      JOIN gcn_entries g ON n.gcn_entry_id = g.id
      ORDER BY n.total_territory_count DESC, n.total_staked DESC
      LIMIT 50
    `;

    return new Response(JSON.stringify({
      success: true,
      nations: result,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
