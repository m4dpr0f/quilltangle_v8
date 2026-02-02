/**
 * Multi-Channel Notification Service
 *
 * Sends notifications to applicants via:
 * - Discord webhook
 * - Telegram bot
 * - Email (via Resend or similar)
 * - In-app messages
 *
 * Privacy-conscious: Only sends to channels user opted into
 */

import { getDb } from './db';

// Environment variables for notification channels
const DISCORD_WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN;
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://8xm.quilu.xyz';

export interface NotificationPayload {
  applicationId: number;
  applicantWallet: string;
  nationName: string;
  eventType: 'status_change' | 'new_message' | 'interview_scheduled' | 'approved' | 'rejected';
  title: string;
  message: string;
  actionUrl?: string;
}

export interface ContactInfo {
  email?: string;
  telegram?: string;
  discord?: string;
  preferences: {
    email: boolean;
    telegram: boolean;
    discord: boolean;
    in_app: boolean;
  };
}

/**
 * Send notification to all enabled channels
 */
export async function sendNotification(
  payload: NotificationPayload,
  contact: ContactInfo
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];
  const sql = getDb();

  // Always create in-app notification
  if (contact.preferences.in_app) {
    try {
      await sql`
        INSERT INTO application_messages (application_id, sender_type, message, is_read)
        VALUES (${payload.applicationId}, 'admin', ${`[${payload.eventType.toUpperCase()}] ${payload.message}`}, FALSE)
      `;
      sent.push('in_app');
    } catch (e) {
      failed.push('in_app');
    }
  }

  // Discord webhook
  if (contact.preferences.discord && DISCORD_WEBHOOK_URL) {
    try {
      await sendDiscordNotification(payload);
      sent.push('discord');
    } catch (e) {
      console.error('Discord notification failed:', e);
      failed.push('discord');
    }
  }

  // Telegram (if user provided their chat ID)
  if (contact.preferences.telegram && contact.telegram && TELEGRAM_BOT_TOKEN) {
    try {
      await sendTelegramNotification(payload, contact.telegram);
      sent.push('telegram');
    } catch (e) {
      console.error('Telegram notification failed:', e);
      failed.push('telegram');
    }
  }

  // Email
  if (contact.preferences.email && contact.email && RESEND_API_KEY) {
    try {
      await sendEmailNotification(payload, contact.email);
      sent.push('email');
    } catch (e) {
      console.error('Email notification failed:', e);
      failed.push('email');
    }
  }

  // Log notification
  await sql`
    INSERT INTO notification_log (application_id, channel, event_type, payload, status, sent_at)
    VALUES (
      ${payload.applicationId},
      ${sent.join(',') || 'none'},
      ${payload.eventType},
      ${JSON.stringify(payload)},
      ${failed.length === 0 ? 'sent' : 'partial'},
      NOW()
    )
  `;

  return { sent, failed };
}

/**
 * Discord webhook notification
 */
async function sendDiscordNotification(payload: NotificationPayload): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const color = payload.eventType === 'approved' ? 0x00ff00 :
                payload.eventType === 'rejected' ? 0xff0000 :
                payload.eventType === 'new_message' ? 0x0099ff : 0xffaa00;

  const embed = {
    title: payload.title,
    description: payload.message,
    color,
    fields: [
      { name: 'Nation', value: payload.nationName, inline: true },
      { name: 'Event', value: payload.eventType.replace('_', ' '), inline: true },
    ],
    footer: { text: '8xM Quillverse' },
    timestamp: new Date().toISOString(),
  };

  if (payload.actionUrl) {
    embed.fields.push({ name: 'Action', value: `[View Details](${payload.actionUrl})`, inline: false });
  }

  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
    }),
  });
}

/**
 * Telegram bot notification
 */
async function sendTelegramNotification(payload: NotificationPayload, chatId: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;

  const emoji = payload.eventType === 'approved' ? '✅' :
                payload.eventType === 'rejected' ? '❌' :
                payload.eventType === 'new_message' ? '💬' : '📋';

  const text = `${emoji} *${payload.title}*\n\n${payload.message}\n\n🏛️ Nation: ${payload.nationName}`;

  const keyboard = payload.actionUrl ? {
    inline_keyboard: [[{ text: 'View Details', url: payload.actionUrl }]]
  } : undefined;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }),
  });
}

/**
 * Email notification via Resend
 */
async function sendEmailNotification(payload: NotificationPayload, email: string): Promise<void> {
  if (!RESEND_API_KEY) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">${payload.title}</h2>
      <p>${payload.message}</p>
      <p><strong>Nation:</strong> ${payload.nationName}</p>
      ${payload.actionUrl ? `<p><a href="${payload.actionUrl}" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">8xM Quillverse • Rainbow Roads</p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: '8xM Quillverse <noreply@8xm.quilu.xyz>',
      to: email,
      subject: payload.title,
      html,
    }),
  });
}

/**
 * Get contact info for an application
 */
export async function getContactInfo(applicationId: number): Promise<ContactInfo | null> {
  const sql = getDb();

  const result = await sql`
    SELECT contact_email, contact_telegram, contact_discord, notification_prefs
    FROM gcn_applications
    WHERE id = ${applicationId}
  `;

  if (result.length === 0) return null;

  const app = result[0];
  return {
    email: app.contact_email,
    telegram: app.contact_telegram,
    discord: app.contact_discord,
    preferences: app.notification_prefs || { email: true, telegram: false, discord: false, in_app: true },
  };
}

/**
 * Send status change notification
 */
export async function notifyStatusChange(
  applicationId: number,
  nationName: string,
  newStatus: string,
  notes?: string
): Promise<void> {
  const contact = await getContactInfo(applicationId);
  if (!contact) return;

  const statusMessages: Record<string, { title: string; message: string }> = {
    approved: {
      title: '🎉 Application Approved!',
      message: `Congratulations! Your application for "${nationName}" has been approved. Welcome to the Quillverse!`,
    },
    rejected: {
      title: 'Application Update',
      message: `Your application for "${nationName}" was not approved at this time. ${notes || 'Please contact us for more details.'}`,
    },
    changes_requested: {
      title: '📝 Changes Requested',
      message: `We'd like some updates to your application for "${nationName}". ${notes || 'Please check the details.'}`,
    },
    interview_scheduled: {
      title: '📅 Interview Scheduled',
      message: `Your interview for "${nationName}" has been scheduled. ${notes || 'Check your application for details.'}`,
    },
  };

  const info = statusMessages[newStatus] || {
    title: 'Application Update',
    message: `Your application status has been updated to: ${newStatus}`,
  };

  await sendNotification({
    applicationId,
    applicantWallet: '',
    nationName,
    eventType: newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'status_change',
    title: info.title,
    message: info.message,
    actionUrl: `${APP_URL}/apply/status`,
  }, contact);
}
