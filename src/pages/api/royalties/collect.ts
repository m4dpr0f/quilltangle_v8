import type { APIRoute } from 'astro';
import { buildHarvestTransaction, getTopHolders } from '../../../lib/royaltyDistribution';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getMint, getTransferFeeConfig } from '@solana/spl-token';

const RPC_URL = import.meta.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/**
 * Royalty Collection API
 *
 * GET: Check available royalties to collect
 * POST: Build transaction to collect royalties
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const tokenMint = url.searchParams.get('mint');

    if (!tokenMint) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing mint parameter',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const mintPubkey = new PublicKey(tokenMint);

    // Get mint info with fee config
    const mintInfo = await getMint(
      connection,
      mintPubkey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    const feeConfig = getTransferFeeConfig(mintInfo);

    if (!feeConfig) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This token does not have transfer fees enabled',
        isToken2022: false,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get fee details
    const withheldAmount = feeConfig.withheldAmount;
    const feeBasisPoints = feeConfig.newerTransferFee.transferFeeBasisPoints;
    const maxFee = feeConfig.newerTransferFee.maximumFee;

    // Get top holders for distribution preview
    const topHolders = await getTopHolders(connection, tokenMint, 10);

    return new Response(JSON.stringify({
      success: true,
      tokenMint,
      decimals: mintInfo.decimals,
      feeConfig: {
        basisPoints: feeBasisPoints,
        percent: feeBasisPoints / 100,
        maxFee: maxFee.toString(),
      },
      withheld: {
        amount: withheldAmount.toString(),
        formatted: Number(withheldAmount) / Math.pow(10, mintInfo.decimals),
      },
      topHolders: topHolders.map(h => ({
        wallet: h.address,
        balance: h.balance.toString(),
        sharePercent: topHolders.length > 0
          ? Number((h.balance * 10000n) / topHolders.reduce((sum, x) => sum + x.balance, 0n)) / 100
          : 0,
      })),
      withdrawAuthority: feeConfig.withdrawWithheldAuthority?.toBase58() || null,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Royalty check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * Build transaction to collect royalties
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tokenMint, creatorWallet, distributeToHolders, creatorSharePercent } = body;

    if (!tokenMint || !creatorWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing tokenMint or creatorWallet',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Build the harvest transaction
    const result = await buildHarvestTransaction(tokenMint, creatorWallet);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // If distributing to holders, include that info
    let distributionPreview = null;
    if (distributeToHolders && creatorSharePercent < 100) {
      const connection = new Connection(RPC_URL, 'confirmed');
      const topHolders = await getTopHolders(connection, tokenMint, 10);

      const withheldBigInt = BigInt(result.withheldAmount || '0');
      const creatorAmount = (withheldBigInt * BigInt(creatorSharePercent || 50)) / 100n;
      const holderPool = withheldBigInt - creatorAmount;

      const totalHolderBalance = topHolders.reduce((sum, h) => sum + h.balance, 0n);

      distributionPreview = {
        creatorAmount: creatorAmount.toString(),
        holderPool: holderPool.toString(),
        holders: topHolders.map(h => ({
          wallet: h.address,
          amount: totalHolderBalance > 0n
            ? ((holderPool * h.balance) / totalHolderBalance).toString()
            : '0',
        })),
      };
    }

    return new Response(JSON.stringify({
      success: true,
      transaction: result.transaction,
      withheldAmount: result.withheldAmount,
      distributionPreview,
      message: 'Sign this transaction to collect your royalties!',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Royalty collection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
