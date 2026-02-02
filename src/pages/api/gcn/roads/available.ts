import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

const DICE_TYPES = ['D2', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];
const DIRECTIONS = ['OUT', 'UP', 'DWN', 'U45', 'D45'];

// TEK8 Guild element mapping
const DICE_ELEMENTS: Record<string, { element: string; emoji: string; description: string }> = {
  'D2': { element: 'Coin', emoji: '🪙', description: 'Binary decisions, fortune' },
  'D4': { element: 'Fire', emoji: '🔥', description: 'Passion, transformation, aggression' },
  'D6': { element: 'Earth', emoji: '🌍', description: 'Stability, foundation, tradition' },
  'D8': { element: 'Air', emoji: '💨', description: 'Movement, intellect, change' },
  'D10': { element: 'Chaos', emoji: '🌀', description: 'Unpredictability, wild magic' },
  'D12': { element: 'Ether', emoji: '✨', description: 'Spirit, divine intervention' },
  'D20': { element: 'Water', emoji: '💧', description: 'Adaptation, flow, emotion' },
  'D100': { element: 'Order', emoji: '⚖️', description: 'Precision, fate, destiny' },
};

const DIRECTION_INFO: Record<string, { fullName: string; realm: string; description: string }> = {
  'OUT': { fullName: 'Outward', realm: 'QLX', description: 'Music & Sound (SEED Pillar)' },
  'UP': { fullName: 'Upward', realm: 'QLY', description: 'Marketing & Growth (EGG Pillar)' },
  'DWN': { fullName: 'Downward', realm: 'QLY', description: 'Community & Roots (EGG Pillar)' },
  'U45': { fullName: 'Diagonal Up', realm: 'QLZ', description: 'Technology & Innovation (METEORITE Pillar)' },
  'D45': { fullName: 'Diagonal Down', realm: 'QLZ', description: 'Integration & Systems (METEORITE Pillar)' },
};

export const GET: APIRoute = async () => {
  try {
    const sql = getDb();

    // Get all claimed roads with nation info
    const claimedRoads = await sql`
      SELECT
        g.road_id,
        g.nation_name,
        g.soul_description,
        g.creator_wallet,
        g.status,
        g.submitted_at,
        n.emoji as nation_emoji,
        n.total_territory_count,
        n.defense_bonus,
        t.status as territory_status,
        t.defense_level,
        t.total_staked
      FROM gcn_entries g
      LEFT JOIN nations n ON n.gcn_entry_id = g.id
      LEFT JOIN territories t ON t.road_id = g.road_id
      WHERE g.status != 'rejected'
    `;

    const claimedMap = new Map();
    for (const r of claimedRoads) {
      claimedMap.set(r.road_id, {
        nationName: r.nation_name,
        nationEmoji: r.nation_emoji,
        creatorWallet: r.creator_wallet,
        status: r.status,
        submittedAt: r.submitted_at,
        territoryStatus: r.territory_status,
        defenseLevel: r.defense_level,
        totalStaked: r.total_staked,
        totalTerritories: r.total_territory_count,
      });
    }

    // Build complete road list with all info
    const allRoads = [];
    for (let y = 0; y < DIRECTIONS.length; y++) {
      for (let x = 0; x < DICE_TYPES.length; x++) {
        const dice = DICE_TYPES[x];
        const dir = DIRECTIONS[y];
        const roadId = dice + dir;
        const claimed = claimedMap.get(roadId);
        const diceInfo = DICE_ELEMENTS[dice];
        const dirInfo = DIRECTION_INFO[dir];

        allRoads.push({
          roadId,
          diceType: dice,
          direction: dir,
          realm: dirInfo.realm,
          gridX: x,
          gridY: y,
          available: !claimed,

          // Element info
          element: diceInfo.element,
          elementEmoji: diceInfo.emoji,
          elementDescription: diceInfo.description,

          // Direction info
          directionName: dirInfo.fullName,
          realmDescription: dirInfo.description,

          // Claimed info (if claimed)
          ...(claimed ? {
            nationName: claimed.nationName,
            nationEmoji: claimed.nationEmoji,
            claimedBy: claimed.creatorWallet,
            claimStatus: claimed.status,
            claimedAt: claimed.submittedAt,
            territoryStatus: claimed.territoryStatus || 'claimed',
            defenseLevel: claimed.defenseLevel || 0,
            totalStaked: claimed.totalStaked || '0',
          } : {}),
        });
      }
    }

    // Calculate stats
    const stats = {
      totalRoads: 40,
      availableCount: allRoads.filter(r => r.available).length,
      claimedCount: allRoads.filter(r => !r.available).length,
      byRealm: {
        QLX: allRoads.filter(r => r.realm === 'QLX'),
        QLY: allRoads.filter(r => r.realm === 'QLY'),
        QLZ: allRoads.filter(r => r.realm === 'QLZ'),
      },
    };

    return new Response(JSON.stringify({
      success: true,
      ...stats,
      roads: allRoads,
      diceElements: DICE_ELEMENTS,
      directions: DIRECTION_INFO,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Roads API error:', error);
    return new Response(JSON.stringify({
      success: false, error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
