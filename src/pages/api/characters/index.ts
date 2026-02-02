/**
 * Character Storage API
 *
 * GET - List characters for a wallet
 * POST - Save a new character
 * PUT - Update an existing character
 * DELETE - Delete a character
 */

import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const prerender = false;

// GET - List characters
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const sql = getDb();
    const walletAddress = url.searchParams.get('wallet');
    const system = url.searchParams.get('system'); // 'pf1e', 'mm3', 'dicegodz'
    const publicOnly = url.searchParams.get('public') === 'true';
    const characterId = url.searchParams.get('id');

    // If ID provided, get specific character
    if (characterId) {
      const results = await sql`
        SELECT id, wallet_address, system, name, data, created_at, updated_at, is_public, tek8_element, thumbnail_url
        FROM characters
        WHERE id = ${parseInt(characterId)}
      `;

      if (results.length === 0) {
        return new Response(JSON.stringify({ error: 'Character not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(results[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // List characters
    let results;
    if (publicOnly) {
      // Public gallery
      if (system) {
        results = await sql`
          SELECT id, wallet_address, system, name, created_at, is_public, tek8_element, thumbnail_url,
                 data->>'race' as race, data->>'class' as class, data->>'level' as level,
                 data->>'archetype' as archetype, data->>'powerLevel' as power_level
          FROM characters
          WHERE is_public = true AND system = ${system}
          ORDER BY created_at DESC
          LIMIT 50
        `;
      } else {
        results = await sql`
          SELECT id, wallet_address, system, name, created_at, is_public, tek8_element, thumbnail_url,
                 data->>'race' as race, data->>'class' as class, data->>'level' as level,
                 data->>'archetype' as archetype, data->>'powerLevel' as power_level
          FROM characters
          WHERE is_public = true
          ORDER BY created_at DESC
          LIMIT 50
        `;
      }
    } else if (walletAddress) {
      // User's characters
      if (system) {
        results = await sql`
          SELECT id, wallet_address, system, name, data, created_at, updated_at, is_public, tek8_element, thumbnail_url
          FROM characters
          WHERE wallet_address = ${walletAddress} AND system = ${system}
          ORDER BY updated_at DESC
        `;
      } else {
        results = await sql`
          SELECT id, wallet_address, system, name, data, created_at, updated_at, is_public, tek8_element, thumbnail_url
          FROM characters
          WHERE wallet_address = ${walletAddress}
          ORDER BY updated_at DESC
        `;
      }
    } else {
      return new Response(JSON.stringify({ error: 'Wallet address required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ characters: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch characters' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Save new character
export const POST: APIRoute = async ({ request }) => {
  try {
    const sql = getDb();
    const body = await request.json();

    const { walletAddress, system, name, data, isPublic, tek8Element, thumbnailUrl } = body;

    if (!walletAddress || !system || !name || !data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate system type
    const validSystems = ['pf1e', 'mm3', 'dicegodz'];
    if (!validSystems.includes(system)) {
      return new Response(JSON.stringify({ error: 'Invalid system type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await sql`
      INSERT INTO characters (wallet_address, system, name, data, is_public, tek8_element, thumbnail_url)
      VALUES (${walletAddress}, ${system}, ${name}, ${JSON.stringify(data)}, ${isPublic || false}, ${tek8Element || null}, ${thumbnailUrl || null})
      RETURNING id, created_at
    `;

    return new Response(JSON.stringify({
      success: true,
      characterId: results[0].id,
      createdAt: results[0].created_at,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving character:', error);
    return new Response(JSON.stringify({ error: 'Failed to save character' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT - Update existing character
export const PUT: APIRoute = async ({ request }) => {
  try {
    const sql = getDb();
    const body = await request.json();

    const { characterId, walletAddress, name, data, isPublic, tek8Element, thumbnailUrl } = body;

    if (!characterId || !walletAddress) {
      return new Response(JSON.stringify({ error: 'Character ID and wallet required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    const existing = await sql`
      SELECT id FROM characters WHERE id = ${characterId} AND wallet_address = ${walletAddress}
    `;

    if (existing.length === 0) {
      return new Response(JSON.stringify({ error: 'Character not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`
      UPDATE characters
      SET
        name = COALESCE(${name}, name),
        data = COALESCE(${data ? JSON.stringify(data) : null}, data),
        is_public = COALESCE(${isPublic}, is_public),
        tek8_element = COALESCE(${tek8Element}, tek8_element),
        thumbnail_url = COALESCE(${thumbnailUrl}, thumbnail_url)
      WHERE id = ${characterId} AND wallet_address = ${walletAddress}
    `;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return new Response(JSON.stringify({ error: 'Failed to update character' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Delete character
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const sql = getDb();
    const body = await request.json();

    const { characterId, walletAddress } = body;

    if (!characterId || !walletAddress) {
      return new Response(JSON.stringify({ error: 'Character ID and wallet required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await sql`
      DELETE FROM characters
      WHERE id = ${characterId} AND wallet_address = ${walletAddress}
      RETURNING id
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Character not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete character' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
