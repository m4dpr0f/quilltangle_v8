/**
 * Treasury Gifts API
 *
 * Allows GCN token holders to gift tokens to the Commons Treasury.
 *
 * GET: List gifts, leaderboard, user's gift history
 * POST: Prepare gift transaction for signing
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Treasury addresses
const TREASURIES: Record<string, { name: string; pubkey: string; realm: string }> = {
  QLX: {
    name: 'QLX Treasury (SEED Pillar)',
    pubkey: process.env.TREASURY_QLX_PUBKEY || 'E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj',
    realm: 'QLX',
  },
  QLY: {
    name: 'QLY Treasury (EGG Pillar)',
    pubkey: process.env.TREASURY_QLY_PUBKEY || 'E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj',
    realm: 'QLY',
  },
  QLZ: {
    name: 'QLZ Treasury (METEORITE Pillar)',
    pubkey: process.env.TREASURY_QLZ_PUBKEY || 'E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj',
    realm: 'QLZ',
  },
  COMMONS: {
    name: 'Commons Treasury',
    pubkey: process.env.TREASURY_8XM_PUBKEY || 'E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj',
    realm: 'GCN',
  },
};

// Gift tier thresholds (in token units with 6 decimals)
const GIFT_TIERS = [
  { name: 'World Tree', minAmount: 10_000_000_000, emoji: '🌍' },
  { name: 'Forest', minAmount: 1_000_000_000, emoji: '🌲' },
  { name: 'Grove', minAmount: 100_000_000, emoji: '🌳' },
  { name: 'Sapling', minAmount: 10_000_000, emoji: '🌿' },
  { name: 'Seedling', minAmount: 1_000_000, emoji: '🌱' },
];

function getGiftTier(amount: number): { name: string; emoji: string } {
  for (const tier of GIFT_TIERS) {
    if (amount >= tier.minAmount) {
      return tier;
    }
  }
  return { name: 'Seedling', emoji: '🌱' };
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'leaderboard';
  const wallet = url.searchParams.get('wallet');

  const sql = neon(process.env.DATABASE_URL_8XM!);

  try {
    if (action === 'treasuries') {
      // Return available treasuries
      return new Response(JSON.stringify({
        success: true,
        treasuries: Object.entries(TREASURIES).map(([key, t]) => ({
          id: key,
          name: t.name,
          address: t.pubkey,
          realm: t.realm,
        })),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'leaderboard') {
      // Get top givers
      const leaderboard = await sql`
        SELECT
          from_wallet,
          SUM(amount) as total_gifted,
          COUNT(*) as gift_count,
          MAX(confirmed_at) as last_gift_at
        FROM gifts
        WHERE status = 'confirmed'
        GROUP BY from_wallet
        ORDER BY total_gifted DESC
        LIMIT 50
      `;

      // Add tier info
      const enriched = leaderboard.map((entry: any) => {
        const tier = getGiftTier(Number(entry.total_gifted));
        return {
          ...entry,
          tier: tier.name,
          tierEmoji: tier.emoji,
        };
      });

      return new Response(JSON.stringify({
        success: true,
        leaderboard: enriched,
        tiers: GIFT_TIERS,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'history' && wallet) {
      // Get user's gift history
      const gifts = await sql`
        SELECT
          g.*,
          n.name as nation_name,
          n.emoji as nation_emoji
        FROM gifts g
        LEFT JOIN nations n ON g.nation_id = n.id
        WHERE g.from_wallet = ${wallet}
        ORDER BY g.created_at DESC
        LIMIT 50
      `;

      // Calculate user's total and tier
      const totalGifted = gifts
        .filter((g: any) => g.status === 'confirmed')
        .reduce((sum: number, g: any) => sum + Number(g.amount), 0);
      const tier = getGiftTier(totalGifted);

      return new Response(JSON.stringify({
        success: true,
        gifts,
        totalGifted,
        tier: tier.name,
        tierEmoji: tier.emoji,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'by-nation') {
      // Get gifts aggregated by nation
      const nationGifts = await sql`
        SELECT
          n.id,
          n.name,
          n.emoji,
          COALESCE(SUM(g.amount), 0) as total_gifted,
          COUNT(g.id) as gift_count
        FROM nations n
        LEFT JOIN gifts g ON g.nation_id = n.id AND g.status = 'confirmed'
        GROUP BY n.id, n.name, n.emoji
        ORDER BY total_gifted DESC
        LIMIT 50
      `;

      return new Response(JSON.stringify({
        success: true,
        nations: nationGifts,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Gifts API error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      action,
      fromWallet,
      treasuryId,
      tokenMint,
      amount,
      message,
      isAnonymous,
      txSignature,
      giftId,
    } = body;

    const sql = neon(process.env.DATABASE_URL_8XM!);
    const connection = new Connection(RPC_URL, 'confirmed');

    if (action === 'prepare') {
      // Prepare gift transaction
      if (!fromWallet || !treasuryId || !tokenMint || !amount) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields: fromWallet, treasuryId, tokenMint, amount',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const treasury = TREASURIES[treasuryId];
      if (!treasury) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid treasury ID',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const fromPubkey = new PublicKey(fromWallet);
      const treasuryPubkey = new PublicKey(treasury.pubkey);
      const mintPubkey = new PublicKey(tokenMint);

      // Get token info to determine program
      let tokenProgram = TOKEN_2022_PROGRAM_ID;
      try {
        const accountInfo = await connection.getAccountInfo(mintPubkey);
        if (accountInfo?.owner.equals(TOKEN_PROGRAM_ID)) {
          tokenProgram = TOKEN_PROGRAM_ID;
        }
      } catch {}

      // Get associated token addresses
      const fromAta = await getAssociatedTokenAddress(mintPubkey, fromPubkey, false, tokenProgram);
      const treasuryAta = await getAssociatedTokenAddress(mintPubkey, treasuryPubkey, false, tokenProgram);

      const transaction = new Transaction();

      // Check if treasury ATA exists
      const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta);
      if (!treasuryAtaInfo) {
        // Create treasury ATA (user pays)
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            treasuryAta,
            treasuryPubkey,
            mintPubkey,
            tokenProgram
          )
        );
      }

      // Add transfer instruction
      const amountBigInt = BigInt(Math.floor(amount * 1_000_000)); // Assuming 6 decimals
      transaction.add(
        createTransferInstruction(
          fromAta,
          treasuryAta,
          fromPubkey,
          amountBigInt,
          [],
          tokenProgram
        )
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = fromPubkey;

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString('base64');

      // Get token info for recording
      let tokenSymbol = null;
      const tokenInfo = await sql`
        SELECT symbol FROM token_launches WHERE token_mint = ${tokenMint}
        UNION
        SELECT symbol FROM tokens WHERE mint_address = ${tokenMint}
        LIMIT 1
      `;
      if (tokenInfo.length > 0) {
        tokenSymbol = tokenInfo[0].symbol;
      }

      // Look up nation for user
      let nationId = null;
      const nations = await sql`
        SELECT id FROM nations WHERE founder_wallet = ${fromWallet} LIMIT 1
      `;
      if (nations.length > 0) {
        nationId = nations[0].id;
      }

      // Create pending gift record
      const [gift] = await sql`
        INSERT INTO gifts (
          from_wallet, to_treasury, amount, token_mint, token_symbol,
          nation_id, message, is_anonymous, status
        ) VALUES (
          ${fromWallet}, ${treasury.pubkey}, ${amountBigInt.toString()}, ${tokenMint}, ${tokenSymbol},
          ${nationId}, ${message || null}, ${isAnonymous || false}, 'pending'
        )
        RETURNING id
      `;

      const tier = getGiftTier(Number(amountBigInt));

      return new Response(JSON.stringify({
        success: true,
        transaction: serialized,
        giftId: gift.id,
        treasury: treasury.name,
        tier: tier.name,
        tierEmoji: tier.emoji,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'confirm') {
      // Confirm gift after transaction
      if (!giftId || !txSignature) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing giftId or txSignature',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify transaction on chain
      const txInfo = await connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo || txInfo.meta?.err) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Transaction not found or failed',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update gift record
      await sql`
        UPDATE gifts SET
          status = 'confirmed',
          tx_signature = ${txSignature},
          confirmed_at = NOW()
        WHERE id = ${giftId}
      `;

      // Get updated gift info for tier calculation
      const [gift] = await sql`SELECT * FROM gifts WHERE id = ${giftId}`;
      const tier = getGiftTier(Number(gift.amount));

      // Update gift tier
      await sql`UPDATE gifts SET gift_tier = ${tier.name} WHERE id = ${giftId}`;

      return new Response(JSON.stringify({
        success: true,
        message: 'Gift confirmed!',
        tier: tier.name,
        tierEmoji: tier.emoji,
        txSignature,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Gifts POST error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
