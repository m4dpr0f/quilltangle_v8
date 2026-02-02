import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { notifyStatusChange } from '../../../lib/notifications';

// Admin wallets that can review applications - loaded from environment
// Set ADMIN_WALLETS as comma-separated list of wallet addresses
function getAdminWallets(): string[] {
  const envWallets = import.meta.env.ADMIN_WALLETS ||
    (typeof process !== 'undefined' && process.env?.ADMIN_WALLETS);

  if (!envWallets) return [];

  return envWallets.split(',').map((w: string) => w.trim()).filter(Boolean);
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const sql = getDb();
    const wallet = url.searchParams.get('wallet');
    const status = url.searchParams.get('status') || 'submitted';

    // Check if admin
    const adminWallets = getAdminWallets();
    const isAdmin = wallet && adminWallets.includes(wallet);

    let applications;

    if (isAdmin) {
      // Admins see all applications with requested status
      applications = await sql`
        SELECT
          a.*,
          ip.name as proposed_instrument_name,
          ip.proposed_element as proposed_instrument_element,
          ip.cultural_origin as proposed_instrument_origin,
          ip.description as proposed_instrument_desc
        FROM gcn_applications a
        LEFT JOIN instrument_proposals ip ON ip.proposer_wallet = a.creator_wallet
        WHERE a.status = ${status}
        ORDER BY a.created_at DESC
      `;
    } else if (wallet) {
      // Non-admins only see their own applications
      applications = await sql`
        SELECT * FROM gcn_applications
        WHERE creator_wallet = ${wallet}
        ORDER BY created_at DESC
      `;
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get instrument proposals for review
    let instrumentProposals = [];
    if (isAdmin) {
      instrumentProposals = await sql`
        SELECT * FROM instrument_proposals
        WHERE status IS NULL OR status = 'pending'
        ORDER BY created_at DESC
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      isAdmin,
      applications,
      instrumentProposals,
      counts: isAdmin ? await getStatusCounts(sql) : undefined
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { applicationId, action, walletAddress, notes, scheduleInterview } = body;

    // Verify admin
    const adminWallets = getAdminWallets();
    if (!walletAddress || !adminWallets.includes(walletAddress)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Admin access required'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    if (!applicationId || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing applicationId or action'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get the application
    const appResult = await sql`
      SELECT * FROM gcn_applications WHERE id = ${applicationId}
    `;

    if (appResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Application not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const app = appResult[0];
    let newStatus = app.status;
    let message = '';

    switch (action) {
      case 'schedule_interview':
        newStatus = 'interview_scheduled';
        await sql`
          UPDATE gcn_applications
          SET status = 'interview_scheduled', video_interview_scheduled = ${scheduleInterview}, updated_at = NOW()
          WHERE id = ${applicationId}
        `;
        message = `Interview scheduled for ${scheduleInterview}`;

        // Send notification
        await notifyStatusChange(
          applicationId,
          app.nation_name,
          'interview_scheduled',
          `Your interview is scheduled for ${new Date(scheduleInterview).toLocaleString()}`
        );
        break;

      case 'mark_interviewed':
        await sql`
          UPDATE gcn_applications
          SET video_interview_completed = true, updated_at = NOW()
          WHERE id = ${applicationId}
        `;
        message = 'Interview marked as completed';
        break;

      case 'approve':
        newStatus = 'approved';
        await sql`
          UPDATE gcn_applications
          SET status = 'approved', reviewer_notes = ${notes || null}, updated_at = NOW()
          WHERE id = ${applicationId}
        `;

        // Create the nation entry
        if (app.road_id) {
          // Insert into gcn_entries
          await sql`
            INSERT INTO gcn_entries (
              road_id, creator_wallet, gcn_name, tek8_guild, status, created_at
            ) VALUES (
              ${app.road_id}, ${app.creator_wallet}, ${app.nation_name}, ${app.tek8_guild}, 'active', NOW()
            )
            ON CONFLICT (road_id) DO NOTHING
          `;

          // Create nation
          await sql`
            INSERT INTO nations (
              mint_address, name, emoji, founder_wallet, total_territory_count, created_at
            ) VALUES (
              ${app.token_mint_address || `pending_${app.id}`},
              ${app.nation_name},
              '🏴',
              ${app.creator_wallet},
              0,
              NOW()
            )
            ON CONFLICT (mint_address) DO NOTHING
          `;
        }
        message = `Application approved! Nation "${app.nation_name}" created.`;

        // Send notification
        await notifyStatusChange(applicationId, app.nation_name, 'approved', notes);
        break;

      case 'reject':
        newStatus = 'rejected';
        await sql`
          UPDATE gcn_applications
          SET status = 'rejected', reviewer_notes = ${notes || null}, updated_at = NOW()
          WHERE id = ${applicationId}
        `;
        message = 'Application rejected';

        // Send notification
        await notifyStatusChange(applicationId, app.nation_name, 'rejected', notes);
        break;

      case 'request_changes':
        newStatus = 'changes_requested';
        await sql`
          UPDATE gcn_applications
          SET status = 'changes_requested', reviewer_notes = ${notes || null}, updated_at = NOW()
          WHERE id = ${applicationId}
        `;
        message = 'Changes requested from applicant';

        // Send notification
        await notifyStatusChange(applicationId, app.nation_name, 'changes_requested', notes);
        break;

      case 'add_notes':
        await sql`
          UPDATE gcn_applications
          SET reviewer_notes = COALESCE(reviewer_notes, '') || E'\n' || ${notes}, updated_at = NOW()
          WHERE id = ${applicationId}
        `;
        message = 'Notes added';
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      message,
      application: {
        id: applicationId,
        status: newStatus
      }
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

async function getStatusCounts(sql: any) {
  const result = await sql`
    SELECT status, COUNT(*) as count
    FROM gcn_applications
    GROUP BY status
  `;

  const counts: Record<string, number> = {
    submitted: 0,
    approved: 0,
    rejected: 0,
    changes_requested: 0
  };

  result.forEach((row: any) => {
    counts[row.status] = parseInt(row.count);
  });

  return counts;
}
