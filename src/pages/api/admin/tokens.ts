import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * Admin Token Verification API
 *
 * Pump.fun-style token vetting system.
 * Only verified tokens appear prominently; unverified require disclaimer.
 *
 * GET: List tokens by verification status
 * POST: Perform verification actions (verify, flag, reject, feature)
 */

// Admin wallets that can review tokens - loaded from environment
// Set ADMIN_WALLETS as comma-separated list of wallet addresses
function getAdminWallets(): string[] {
  const envWallets = import.meta.env.ADMIN_WALLETS ||
    (typeof process !== 'undefined' && process.env?.ADMIN_WALLETS);

  if (!envWallets) return [];

  return envWallets.split(',').map((w: string) => w.trim()).filter(Boolean);
}

// Verification statuses
type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'flagged' | 'rejected';

export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const wallet = url.searchParams.get('wallet');
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Check if admin
    const adminWallets = getAdminWallets();
    const isAdmin = wallet && adminWallets.includes(wallet);

    if (!isAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Admin access required'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Get tokens with requested verification status
    const tokens = await sql`
      SELECT
        id,
        creator_wallet,
        name,
        symbol,
        description,
        image_url,
        total_supply,
        token_mint,
        pool_address,
        phase,
        tek8_guild,
        nation_name,
        verification_status,
        verification_notes,
        verified_at,
        verified_by,
        is_featured,
        created_at,
        live_at
      FROM token_launches
      WHERE verification_status = ${status}
      AND phase IN ('live', 'graduated')
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Get counts by status
    const counts = await getStatusCounts(sql);

    return new Response(JSON.stringify({
      success: true,
      isAdmin: true,
      tokens,
      counts,
      currentFilter: status
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Admin tokens GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tokenId, action, walletAddress, notes } = body;

    // Verify admin
    const adminWallets = getAdminWallets();
    if (!walletAddress || !adminWallets.includes(walletAddress)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Admin access required'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    if (!tokenId || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing tokenId or action'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get the token
    const tokenResult = await sql`
      SELECT * FROM token_launches WHERE id = ${tokenId}
    `;

    if (tokenResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const token = tokenResult[0];
    let newStatus: VerificationStatus = token.verification_status;
    let message = '';

    switch (action) {
      case 'start_review':
        // Mark as under review
        newStatus = 'under_review';
        await sql`
          UPDATE token_launches
          SET
            verification_status = 'under_review',
            verification_notes = COALESCE(verification_notes, '') || ${notes ? '\n[Review started] ' + notes : ''}
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" is now under review`;
        break;

      case 'verify':
        // Approve and make visible
        newStatus = 'verified';
        await sql`
          UPDATE token_launches
          SET
            verification_status = 'verified',
            verification_notes = COALESCE(verification_notes, '') || ${notes ? '\n[Verified] ' + notes : '\n[Verified]'},
            verified_at = NOW(),
            verified_by = ${walletAddress}
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" verified and now visible to all users`;
        break;

      case 'flag':
        // Mark as suspicious/concerning
        newStatus = 'flagged';
        await sql`
          UPDATE token_launches
          SET
            verification_status = 'flagged',
            verification_notes = COALESCE(verification_notes, '') || ${'\n[Flagged] ' + (notes || 'No reason provided')},
            verified_by = ${walletAddress}
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" has been flagged`;
        break;

      case 'reject':
        // Reject - will not appear in public listings
        newStatus = 'rejected';
        await sql`
          UPDATE token_launches
          SET
            verification_status = 'rejected',
            verification_notes = COALESCE(verification_notes, '') || ${'\n[Rejected] ' + (notes || 'No reason provided')},
            verified_by = ${walletAddress},
            is_featured = false
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" has been rejected`;
        break;

      case 'feature':
        // Feature a verified token prominently
        if (token.verification_status !== 'verified') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Only verified tokens can be featured'
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        await sql`
          UPDATE token_launches
          SET is_featured = true
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" is now featured`;
        break;

      case 'unfeature':
        // Remove from featured
        await sql`
          UPDATE token_launches
          SET is_featured = false
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" removed from featured`;
        break;

      case 'reset':
        // Reset to pending (undo verification)
        newStatus = 'pending';
        await sql`
          UPDATE token_launches
          SET
            verification_status = 'pending',
            verification_notes = COALESCE(verification_notes, '') || ${'\n[Reset to pending] ' + (notes || '')},
            verified_at = NULL,
            verified_by = NULL,
            is_featured = false
          WHERE id = ${tokenId}
        `;
        message = `Token "${token.symbol}" reset to pending`;
        break;

      case 'add_notes':
        // Just add notes without changing status
        await sql`
          UPDATE token_launches
          SET verification_notes = COALESCE(verification_notes, '') || ${'\n[Note] ' + notes}
          WHERE id = ${tokenId}
        `;
        message = 'Notes added';
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid action: ${action}. Valid actions: start_review, verify, flag, reject, feature, unfeature, reset, add_notes`
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get updated token data
    const updatedToken = await sql`
      SELECT
        id, name, symbol, verification_status, is_featured, verified_at, verified_by
      FROM token_launches
      WHERE id = ${tokenId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message,
      token: updatedToken[0]
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Admin tokens POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

async function getStatusCounts(sql: any) {
  const result = await sql`
    SELECT verification_status, COUNT(*) as count
    FROM token_launches
    WHERE phase IN ('live', 'graduated')
    GROUP BY verification_status
  `;

  const counts: Record<string, number> = {
    pending: 0,
    under_review: 0,
    verified: 0,
    flagged: 0,
    rejected: 0
  };

  result.forEach((row: any) => {
    if (row.verification_status && counts.hasOwnProperty(row.verification_status)) {
      counts[row.verification_status] = parseInt(row.count);
    }
  });

  // Also count featured tokens
  const featuredResult = await sql`
    SELECT COUNT(*) as count FROM token_launches
    WHERE is_featured = true AND verification_status = 'verified'
  `;
  counts.featured = parseInt(featuredResult[0]?.count || 0);

  return counts;
}
