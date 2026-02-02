import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  rollDie,
  calculatePower,
  isDefenseExpired,
  DICE_TO_ELEMENT,
} from '../../../lib/combat';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { contestId, burnAmount, walletAddress } = body;

    // Validate required fields
    if (!contestId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: contestId, walletAddress',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get contest with full details
    const contestResult = await sql`
      SELECT
        tc.*,
        t.road_id,
        t.dice_type as territory_dice,
        t.defense_level,
        t.total_staked,
        dn.id as defender_nation_id,
        dn.name as defender_name,
        dn.emoji as defender_emoji,
        dn.mint_address as defender_mint,
        dn.founder_wallet as defender_wallet,
        an.name as attacker_name,
        an.emoji as attacker_emoji
      FROM territory_contests tc
      JOIN territories t ON tc.territory_id = t.id
      JOIN nations dn ON tc.defender_nation_id = dn.id
      JOIN nations an ON tc.attacker_nation_id = an.id
      WHERE tc.id = ${contestId}
    `;

    if (contestResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Contest not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const contest = contestResult[0];

    // Check contest status
    if (contest.status === 'resolved') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Contest already resolved',
        winner: contest.winner_nation_id,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (contest.status === 'cancelled') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Contest was cancelled',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check deadline
    if (isDefenseExpired(contest.defense_deadline)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Defense deadline has passed. Contest will auto-resolve.',
        deadline: contest.defense_deadline,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify defender owns this nation
    if (contest.defender_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only the defending nation founder can defend',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if already defended
    if (contest.tokens_burned_defense > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Defense already submitted. Awaiting resolution.',
        existingDefense: Number(contest.tokens_burned_defense),
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Roll defender's dice (uses territory's dice type)
    const defenderDice = contest.territory_dice;
    const defenderRoll = rollDie(defenderDice);

    // Calculate defense power (includes defense_level bonus)
    const defenseBonus = contest.defense_level * 0.5; // 0.5 power per defense level
    const defensePower = calculatePower(burnAmount || 0, defenderRoll, 1.0, defenseBonus);

    // Get attacker's roll data
    const attackRollData = typeof contest.attack_dice_roll === 'string'
      ? JSON.parse(contest.attack_dice_roll)
      : contest.attack_dice_roll;

    const attackPower = Number(contest.attack_power);

    // Determine winner
    const winner = attackPower > defensePower ? 'attacker' : 'defender';
    const margin = Math.abs(attackPower - defensePower);

    // Update contest with defense and resolution
    await sql`
      UPDATE territory_contests
      SET
        tokens_burned_defense = ${burnAmount || 0},
        defense_dice_roll = ${JSON.stringify({
          die: defenderRoll.die,
          element: defenderRoll.element,
          roll: defenderRoll.roll,
          maxValue: defenderRoll.maxValue,
          critical: defenderRoll.critical,
          fumble: defenderRoll.fumble,
        })},
        defense_power = ${defensePower},
        status = 'resolved',
        winner_nation_id = ${winner === 'attacker' ? contest.attacker_nation_id : contest.defender_nation_id},
        resolution_notes = ${JSON.stringify({
          margin,
          attack_power: attackPower,
          defense_power: defensePower,
          defense_bonus: defenseBonus,
        })},
        resolved_at = NOW()
      WHERE id = ${contestId}
    `;

    // Record defender's burn (if any)
    if (burnAmount > 0) {
      await sql`
        INSERT INTO token_burns (nation_id, wallet_address, token_mint, amount, burn_type, effect_target, power_generated)
        VALUES (
          ${contest.defender_nation_id},
          ${walletAddress},
          ${contest.defender_mint},
          ${burnAmount},
          'defense',
          ${`contest:${contestId}`},
          ${defensePower}
        )
      `;
    }

    // Handle territory transfer if attacker won
    if (winner === 'attacker') {
      // Transfer territory to attacker
      await sql`
        UPDATE territories
        SET
          nation_id = ${contest.attacker_nation_id},
          controller_wallet = ${contest.attacker_wallet},
          status = 'claimed',
          defense_level = GREATEST(0, defense_level - 20),
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

      // Deactivate defender's stakes
      await sql`
        UPDATE territory_stakes
        SET is_active = false, unstaked_at = NOW()
        WHERE territory_id = ${contest.territory_id} AND nation_id = ${contest.defender_nation_id}
      `;
    } else {
      // Defender won - restore territory status
      await sql`
        UPDATE territories
        SET
          status = ${contest.defense_level >= 100 ? 'fortified' : 'claimed'},
          defense_level = defense_level + 5,
          updated_at = NOW()
        WHERE id = ${contest.territory_id}
      `;

      // Boost defender's defense rating
      await sql`
        UPDATE nations
        SET defense_rating = defense_rating + 10, updated_at = NOW()
        WHERE id = ${contest.defender_nation_id}
      `;
    }

    // Log event
    await sql`
      INSERT INTO territory_events (territory_id, event_type, actor_nation_id, actor_wallet, details)
      VALUES (
        ${contest.territory_id},
        ${winner === 'attacker' ? 'captured' : 'defended'},
        ${winner === 'attacker' ? contest.attacker_nation_id : contest.defender_nation_id},
        ${winner === 'attacker' ? contest.attacker_wallet : walletAddress},
        ${JSON.stringify({
          contest_id: contestId,
          winner,
          margin,
          attack_power: attackPower,
          defense_power: defensePower,
          attacker: contest.attacker_name,
          defender: contest.defender_name,
        })}
      )
    `;

    // Generate narrative
    let narrative = '';
    if (winner === 'attacker') {
      narrative = `${contest.attacker_emoji} ${contest.attacker_name} CONQUERS ${contest.road_id}! `;
      narrative += `Attack: ${attackPower.toFixed(1)} vs Defense: ${defensePower.toFixed(1)}. `;
      narrative += `${contest.defender_emoji} ${contest.defender_name} loses control.`;
    } else {
      narrative = `${contest.defender_emoji} ${contest.defender_name} DEFENDS ${contest.road_id}! `;
      narrative += `Defense: ${defensePower.toFixed(1)} vs Attack: ${attackPower.toFixed(1)}. `;
      narrative += `${contest.attacker_emoji} ${contest.attacker_name}'s invasion fails.`;
    }

    if (defenderRoll.critical) {
      narrative += ' CRITICAL DEFENSE!';
    }

    return new Response(JSON.stringify({
      success: true,
      message: winner === 'defender' ? 'Territory successfully defended!' : 'Territory lost to attacker.',
      result: {
        winner,
        winnerNation: winner === 'attacker' ? contest.attacker_name : contest.defender_name,
        winnerEmoji: winner === 'attacker' ? contest.attacker_emoji : contest.defender_emoji,
        margin: margin.toFixed(1),
        attackPower: attackPower.toFixed(1),
        defensePower: defensePower.toFixed(1),
        defenseBonus: defenseBonus.toFixed(1),
        defenseRoll: {
          die: defenderRoll.die,
          element: defenderRoll.element,
          roll: defenderRoll.roll,
          max: defenderRoll.maxValue,
          critical: defenderRoll.critical,
          fumble: defenderRoll.fumble,
        },
        burnAmount: burnAmount || 0,
      },
      narrative,
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
