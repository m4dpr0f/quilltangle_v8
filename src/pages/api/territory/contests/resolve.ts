import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { isDefenseExpired } from '../../../../lib/combat';

/**
 * Auto-resolve expired contests where defender didn't respond.
 * Attacker wins by default if defense deadline passed.
 *
 * Can be called by:
 * - Cron job (scheduled)
 * - Manual trigger
 * - On-demand when viewing contest
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { contestId } = body; // Optional: resolve specific contest

    const sql = getDb();

    // Find expired contests
    let expiredContests;
    if (contestId) {
      expiredContests = await sql`
        SELECT
          tc.*,
          t.road_id,
          t.defense_level,
          an.name as attacker_name,
          an.emoji as attacker_emoji,
          dn.name as defender_name,
          dn.emoji as defender_emoji,
          dn.founder_wallet as defender_wallet
        FROM territory_contests tc
        JOIN territories t ON tc.territory_id = t.id
        JOIN nations an ON tc.attacker_nation_id = an.id
        JOIN nations dn ON tc.defender_nation_id = dn.id
        WHERE tc.id = ${contestId}
        AND tc.status IN ('pending', 'active')
      `;
    } else {
      expiredContests = await sql`
        SELECT
          tc.*,
          t.road_id,
          t.defense_level,
          an.name as attacker_name,
          an.emoji as attacker_emoji,
          dn.name as defender_name,
          dn.emoji as defender_emoji,
          dn.founder_wallet as defender_wallet
        FROM territory_contests tc
        JOIN territories t ON tc.territory_id = t.id
        JOIN nations an ON tc.attacker_nation_id = an.id
        JOIN nations dn ON tc.defender_nation_id = dn.id
        WHERE tc.status IN ('pending', 'active')
        AND tc.defense_deadline < NOW()
        AND tc.tokens_burned_defense = 0
      `;
    }

    const resolved: any[] = [];
    const errors: any[] = [];

    for (const contest of expiredContests) {
      try {
        // Verify deadline passed and no defense submitted
        if (!isDefenseExpired(contest.defense_deadline)) {
          if (!contestId) continue; // Skip if not specifically requested
        }

        if (Number(contest.tokens_burned_defense) > 0) {
          // Defense was submitted, shouldn't be here
          continue;
        }

        // Attacker wins by default (no defense)
        const attackPower = Number(contest.attack_power);
        const defensePower = 0; // No defense submitted

        // Update contest as resolved
        await sql`
          UPDATE territory_contests
          SET
            tokens_burned_defense = 0,
            defense_power = 0,
            status = 'resolved',
            winner_nation_id = ${contest.attacker_nation_id},
            resolution_notes = ${JSON.stringify({
              auto_resolved: true,
              reason: 'defense_timeout',
              attack_power: attackPower,
              defense_power: 0,
            })},
            resolved_at = NOW()
          WHERE id = ${contest.id}
        `;

        // Transfer territory to attacker
        await sql`
          UPDATE territories
          SET
            nation_id = ${contest.attacker_nation_id},
            controller_wallet = ${contest.attacker_wallet},
            status = 'claimed',
            defense_level = GREATEST(0, defense_level - 30),
            total_staked = 0,
            updated_at = NOW()
          WHERE id = ${contest.territory_id}
        `;

        // Update nation territory counts
        await sql`
          UPDATE nations
          SET total_territory_count = total_territory_count + 1, updated_at = NOW()
          WHERE id = ${contest.attacker_nation_id}
        `;
        await sql`
          UPDATE nations
          SET total_territory_count = GREATEST(0, total_territory_count - 1), updated_at = NOW()
          WHERE id = ${contest.defender_nation_id}
        `;

        // Deactivate all defender stakes
        await sql`
          UPDATE territory_stakes
          SET is_active = false, unstaked_at = NOW()
          WHERE territory_id = ${contest.territory_id} AND nation_id = ${contest.defender_nation_id}
        `;

        // Reset territory total staked
        await sql`
          UPDATE nations
          SET total_staked = GREATEST(0, total_staked - ${contest.total_staked || 0}), updated_at = NOW()
          WHERE id = ${contest.defender_nation_id}
        `;

        // Log event
        await sql`
          INSERT INTO territory_events (territory_id, event_type, actor_nation_id, actor_wallet, details)
          VALUES (
            ${contest.territory_id},
            'captured',
            ${contest.attacker_nation_id},
            ${contest.attacker_wallet},
            ${JSON.stringify({
              contest_id: contest.id,
              winner: 'attacker',
              reason: 'defense_timeout',
              attack_power: attackPower,
              attacker: contest.attacker_name,
              defender: contest.defender_name,
            })}
          )
        `;

        resolved.push({
          contestId: contest.id,
          territory: contest.road_id,
          winner: contest.attacker_name,
          winnerEmoji: contest.attacker_emoji,
          reason: 'Defense timeout - no response within 24 hours',
        });

      } catch (err: any) {
        errors.push({
          contestId: contest.id,
          error: err.message,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Resolved ${resolved.length} expired contest(s)`,
      resolved,
      errors: errors.length > 0 ? errors : undefined,
      checked: expiredContests.length,
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

// GET endpoint to check for expiring contests
export const GET: APIRoute = async () => {
  try {
    const sql = getDb();

    // Get contests expiring within next hour
    const expiringSoon = await sql`
      SELECT
        tc.id,
        tc.defense_deadline,
        t.road_id,
        an.name as attacker_name,
        an.emoji as attacker_emoji,
        dn.name as defender_name,
        dn.emoji as defender_emoji
      FROM territory_contests tc
      JOIN territories t ON tc.territory_id = t.id
      JOIN nations an ON tc.attacker_nation_id = an.id
      JOIN nations dn ON tc.defender_nation_id = dn.id
      WHERE tc.status IN ('pending', 'active')
      AND tc.tokens_burned_defense = 0
      AND tc.defense_deadline < NOW() + INTERVAL '1 hour'
      ORDER BY tc.defense_deadline ASC
    `;

    // Get already expired (need resolution)
    const expired = await sql`
      SELECT COUNT(*) as count
      FROM territory_contests
      WHERE status IN ('pending', 'active')
      AND tokens_burned_defense = 0
      AND defense_deadline < NOW()
    `;

    return new Response(JSON.stringify({
      success: true,
      expiringSoon: expiringSoon.map((c: any) => ({
        ...c,
        minutesRemaining: Math.max(0, Math.floor((new Date(c.defense_deadline).getTime() - Date.now()) / 60000)),
      })),
      expiredCount: Number(expired[0].count),
      needsResolution: Number(expired[0].count) > 0,
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
