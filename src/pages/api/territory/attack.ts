import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  rollDie,
  calculatePower,
  getElementalModifier,
  calculateMinimumBurn,
  getDefenseDeadline,
  DICE_TO_ELEMENT,
} from '../../../lib/combat';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { roadId, territoryId, burnAmount, attackerNationId, walletAddress, diceType } = body;

    // Validate required fields
    if (!walletAddress || !burnAmount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: walletAddress, burnAmount',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!roadId && !territoryId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either roadId or territoryId required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = getDb();

    // Get territory
    let territory;
    if (territoryId) {
      const result = await sql`
        SELECT t.*, n.name as nation_name, n.emoji as nation_emoji, n.founder_wallet
        FROM territories t
        LEFT JOIN nations n ON t.nation_id = n.id
        WHERE t.id = ${territoryId}
      `;
      territory = result[0];
    } else {
      const result = await sql`
        SELECT t.*, n.name as nation_name, n.emoji as nation_emoji, n.founder_wallet
        FROM territories t
        LEFT JOIN nations n ON t.nation_id = n.id
        WHERE t.road_id = ${roadId}
      `;
      territory = result[0];
    }

    if (!territory) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Territory not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Cannot attack unclaimed territory
    if (territory.status === 'unclaimed') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot attack unclaimed territory. Claim it instead!',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check for existing active contest
    const existingContest = await sql`
      SELECT id FROM territory_contests
      WHERE territory_id = ${territory.id}
      AND status IN ('pending', 'active')
    `;

    if (existingContest.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Territory is already under attack',
        contestId: existingContest[0].id,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get attacker's nation
    let attackerNation;
    if (attackerNationId) {
      const result = await sql`SELECT * FROM nations WHERE id = ${attackerNationId}`;
      attackerNation = result[0];
    } else {
      const result = await sql`SELECT * FROM nations WHERE founder_wallet = ${walletAddress}`;
      attackerNation = result[0];
    }

    if (!attackerNation) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You must have a nation to attack. Found one first!',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Cannot attack your own territory
    if (territory.nation_id === attackerNation.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot attack your own territory',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check minimum burn requirement
    const minBurn = calculateMinimumBurn(territory.defense_level, Number(territory.total_staked));
    if (burnAmount < minBurn) {
      return new Response(JSON.stringify({
        success: false,
        error: `Minimum burn required: ${minBurn.toLocaleString()} tokens`,
        minimumBurn: minBurn,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Determine dice type (default to attacker's choice or territory's dice)
    const attackDice = diceType || territory.dice_type;
    const defenderDice = territory.dice_type;

    // Roll attacker's dice
    const attackerRoll = rollDie(attackDice);

    // Calculate elemental modifier
    const elementalModifier = getElementalModifier(
      DICE_TO_ELEMENT[attackDice],
      DICE_TO_ELEMENT[defenderDice]
    );

    // Calculate attack power
    const attackPower = calculatePower(burnAmount, attackerRoll, elementalModifier);

    // Calculate defense deadline (24 hours)
    const defenseDeadline = getDefenseDeadline();

    // Create contest record
    const contestResult = await sql`
      INSERT INTO territory_contests (
        territory_id,
        attacker_nation_id,
        defender_nation_id,
        attacker_wallet,
        tokens_burned_attack,
        attack_dice_roll,
        attack_power,
        status,
        defense_deadline
      ) VALUES (
        ${territory.id},
        ${attackerNation.id},
        ${territory.nation_id},
        ${walletAddress},
        ${burnAmount},
        ${JSON.stringify({
          die: attackerRoll.die,
          element: attackerRoll.element,
          roll: attackerRoll.roll,
          maxValue: attackerRoll.maxValue,
          critical: attackerRoll.critical,
          fumble: attackerRoll.fumble,
          modifier: elementalModifier,
        })},
        ${attackPower},
        'pending',
        ${defenseDeadline}
      )
      RETURNING *
    `;

    const contest = contestResult[0];

    // Record burn
    await sql`
      INSERT INTO token_burns (nation_id, wallet_address, token_mint, amount, burn_type, effect_target, power_generated)
      VALUES (
        ${attackerNation.id},
        ${walletAddress},
        ${attackerNation.mint_address},
        ${burnAmount},
        'attack',
        ${`contest:${contest.id}`},
        ${attackPower}
      )
    `;

    // Update territory status to contested
    await sql`
      UPDATE territories
      SET status = 'contested', last_contested_at = NOW(), updated_at = NOW()
      WHERE id = ${territory.id}
    `;

    // Update attacker nation stats
    await sql`
      UPDATE nations
      SET attack_rating = attack_rating + ${Math.floor(burnAmount / 100000)}, updated_at = NOW()
      WHERE id = ${attackerNation.id}
    `;

    // Log event
    await sql`
      INSERT INTO territory_events (territory_id, event_type, actor_nation_id, actor_wallet, details)
      VALUES (
        ${territory.id},
        'attacked',
        ${attackerNation.id},
        ${walletAddress},
        ${JSON.stringify({
          contest_id: contest.id,
          burn_amount: burnAmount,
          attack_power: attackPower,
          dice_roll: attackerRoll,
          defender_nation: territory.nation_name,
        })}
      )
    `;

    // Generate attack narrative
    let narrative = `${attackerNation.emoji} ${attackerNation.name} attacks ${territory.nation_emoji} ${territory.nation_name}'s territory ${territory.road_id}!`;
    if (attackerRoll.critical) {
      narrative += ' CRITICAL HIT!';
    } else if (attackerRoll.fumble) {
      narrative += ' Weak opening...';
    }
    narrative += ` Attack power: ${attackPower.toFixed(1)}`;

    return new Response(JSON.stringify({
      success: true,
      message: 'Attack initiated! Defender has 24 hours to respond.',
      contest: {
        id: contest.id,
        territory: territory.road_id,
        attacker: {
          nation: attackerNation.name,
          emoji: attackerNation.emoji,
          power: attackPower,
        },
        defender: {
          nation: territory.nation_name,
          emoji: territory.nation_emoji,
          deadline: defenseDeadline,
        },
        diceRoll: {
          die: attackerRoll.die,
          element: attackerRoll.element,
          roll: attackerRoll.roll,
          max: attackerRoll.maxValue,
          critical: attackerRoll.critical,
          fumble: attackerRoll.fumble,
          elementalModifier,
        },
        burnAmount,
        attackPower,
        defenseDeadline,
        status: 'pending',
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
