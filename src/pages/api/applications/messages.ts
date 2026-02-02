import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { sendNotification, getContactInfo } from '../../../lib/notifications';

const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://8xm.quilu.xyz';

/**
 * Application Messages API
 *
 * GET: Fetch messages for an application
 * POST: Send a new message
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const applicationId = url.searchParams.get('applicationId');
    const wallet = url.searchParams.get('wallet');

    if (!applicationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing applicationId',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify wallet owns this application or is admin
    const app = await sql`
      SELECT id, creator_wallet, nation_name FROM gcn_applications WHERE id = ${applicationId}
    `;

    if (app.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Application not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if admin or owner
    const isOwner = app[0].creator_wallet === wallet;
    const adminCheck = await sql`
      SELECT 1 FROM portal_keepers WHERE wallet_address = ${wallet} AND is_active = true
    `;
    const isAdmin = adminCheck.length > 0;

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not authorized to view these messages',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch messages
    const messages = await sql`
      SELECT id, sender_type, sender_wallet, message, is_read, created_at
      FROM application_messages
      WHERE application_id = ${applicationId}
      ORDER BY created_at ASC
    `;

    // Mark messages as read for the viewer
    if (isOwner) {
      await sql`
        UPDATE application_messages
        SET is_read = TRUE
        WHERE application_id = ${applicationId} AND sender_type = 'admin' AND is_read = FALSE
      `;
    } else if (isAdmin) {
      await sql`
        UPDATE application_messages
        SET is_read = TRUE
        WHERE application_id = ${applicationId} AND sender_type = 'applicant' AND is_read = FALSE
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      messages,
      application: {
        id: app[0].id,
        nationName: app[0].nation_name,
      },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { applicationId, wallet, message } = body;

    if (!applicationId || !wallet || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Verify ownership or admin status
    const app = await sql`
      SELECT id, creator_wallet, nation_name FROM gcn_applications WHERE id = ${applicationId}
    `;

    if (app.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Application not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const isOwner = app[0].creator_wallet === wallet;
    const adminCheck = await sql`
      SELECT 1 FROM portal_keepers WHERE wallet_address = ${wallet} AND is_active = true
    `;
    const isAdmin = adminCheck.length > 0;

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not authorized to send messages',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const senderType = isAdmin ? 'admin' : 'applicant';

    // Insert message
    const result = await sql`
      INSERT INTO application_messages (application_id, sender_type, sender_wallet, message)
      VALUES (${applicationId}, ${senderType}, ${wallet}, ${message})
      RETURNING id, created_at
    `;

    // Send notification to the other party
    if (senderType === 'admin') {
      // Notify applicant
      const contact = await getContactInfo(applicationId);
      if (contact) {
        await sendNotification({
          applicationId,
          applicantWallet: app[0].creator_wallet,
          nationName: app[0].nation_name,
          eventType: 'new_message',
          title: '💬 New Message from Review Team',
          message: message.length > 100 ? message.substring(0, 100) + '...' : message,
          actionUrl: `${APP_URL}/apply/status?id=${applicationId}`,
        }, contact);
      }
    }
    // TODO: Notify admins when applicant sends message (via Discord webhook to admin channel)

    return new Response(JSON.stringify({
      success: true,
      messageId: result[0].id,
      createdAt: result[0].created_at,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Message send error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
