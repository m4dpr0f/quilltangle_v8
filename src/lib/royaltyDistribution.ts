/**
 * Royalty Distribution System
 *
 * Automatically collects Token-2022 transfer fees and distributes to:
 * - Creator wallet (configurable %)
 * - Top 10 token holders (remaining %)
 *
 * This runs as a cron job / scheduled task
 */

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createHarvestWithheldTokensToMintInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
  createTransferCheckedInstruction,
  getMint,
  getAccount,
  getTransferFeeConfig,
} from '@solana/spl-token';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export interface DistributionConfig {
  tokenMint: string;
  creatorWallet: string;
  creatorSharePercent: number;      // e.g., 50 = 50% to creator
  distributeToHolders: boolean;     // Enable top 10 holder distribution
  topHolderCount: number;           // How many top holders (default 10)
}

export interface DistributionResult {
  success: boolean;
  totalCollected: bigint;
  creatorAmount: bigint;
  holderDistributions: { wallet: string; amount: bigint }[];
  signature?: string;
  error?: string;
}

/**
 * Get top token holders for a mint
 * Uses Helius or similar RPC for token holder data
 */
export async function getTopHolders(
  connection: Connection,
  mintAddress: string,
  count: number = 10
): Promise<{ address: string; balance: bigint }[]> {
  try {
    // Use getTokenLargestAccounts RPC method
    const mintPubkey = new PublicKey(mintAddress);
    const largestAccounts = await connection.getTokenLargestAccounts(mintPubkey);

    const holders: { address: string; balance: bigint }[] = [];

    for (const account of largestAccounts.value.slice(0, count)) {
      try {
        // Get the owner of this token account
        const tokenAccount = await getAccount(
          connection,
          account.address,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );

        holders.push({
          address: tokenAccount.owner.toBase58(),
          balance: tokenAccount.amount,
        });
      } catch (e) {
        // Skip accounts we can't read
        continue;
      }
    }

    return holders;
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return [];
  }
}

/**
 * Calculate distribution amounts
 */
export function calculateDistribution(
  totalFees: bigint,
  creatorSharePercent: number,
  holderBalances: { address: string; balance: bigint }[]
): { creatorAmount: bigint; holderAmounts: { address: string; amount: bigint }[] } {
  // Creator gets their configured percentage
  const creatorAmount = (totalFees * BigInt(creatorSharePercent)) / 100n;

  // Remaining goes to holders proportionally
  const holderPool = totalFees - creatorAmount;

  if (holderBalances.length === 0 || holderPool <= 0n) {
    return { creatorAmount: totalFees, holderAmounts: [] };
  }

  // Calculate total balance of top holders
  const totalHolderBalance = holderBalances.reduce(
    (sum, h) => sum + h.balance,
    0n
  );

  if (totalHolderBalance === 0n) {
    return { creatorAmount: totalFees, holderAmounts: [] };
  }

  // Distribute proportionally based on holdings
  const holderAmounts = holderBalances.map(holder => ({
    address: holder.address,
    amount: (holderPool * holder.balance) / totalHolderBalance,
  })).filter(h => h.amount > 0n);

  return { creatorAmount, holderAmounts };
}

/**
 * Harvest and distribute royalties for a token
 *
 * This is meant to be called by a cron job or manually
 */
export async function harvestAndDistribute(
  config: DistributionConfig,
  payerKeypair: Keypair // Server wallet that pays for transactions
): Promise<DistributionResult> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const mintPubkey = new PublicKey(config.tokenMint);
    const creatorPubkey = new PublicKey(config.creatorWallet);

    // Get mint info with transfer fee config
    const mintInfo = await getMint(
      connection,
      mintPubkey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    const feeConfig = getTransferFeeConfig(mintInfo);
    if (!feeConfig) {
      return {
        success: false,
        totalCollected: 0n,
        creatorAmount: 0n,
        holderDistributions: [],
        error: 'Token does not have transfer fee extension',
      };
    }

    // Get withheld amount from mint (after harvesting)
    const withheldAmount = feeConfig.withheldAmount;

    if (withheldAmount === 0n) {
      return {
        success: true,
        totalCollected: 0n,
        creatorAmount: 0n,
        holderDistributions: [],
        error: 'No fees to collect',
      };
    }

    // Build transaction
    const transaction = new Transaction();

    // 1. Withdraw withheld tokens from mint to creator's token account
    const creatorAta = await getAssociatedTokenAddress(
      mintPubkey,
      creatorPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // If distributing to holders, we need to calculate shares
    let holderDistributions: { wallet: string; amount: bigint }[] = [];

    if (config.distributeToHolders && config.creatorSharePercent < 100) {
      // Get top holders
      const topHolders = await getTopHolders(
        connection,
        config.tokenMint,
        config.topHolderCount || 10
      );

      // Filter out creator from holders list (they get their share separately)
      const filteredHolders = topHolders.filter(
        h => h.address !== config.creatorWallet
      );

      // Calculate distribution
      const distribution = calculateDistribution(
        withheldAmount,
        config.creatorSharePercent,
        filteredHolders
      );

      // Withdraw all to creator first (they'll redistribute)
      transaction.add(
        createWithdrawWithheldTokensFromMintInstruction(
          mintPubkey,
          creatorAta,
          creatorPubkey, // withdraw authority
          [], // no multisig
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Add transfers to each holder
      for (const holder of distribution.holderAmounts) {
        const holderPubkey = new PublicKey(holder.address);
        const holderAta = await getAssociatedTokenAddress(
          mintPubkey,
          holderPubkey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        // Transfer their share
        transaction.add(
          createTransferCheckedInstruction(
            creatorAta,          // from
            mintPubkey,          // mint
            holderAta,           // to
            creatorPubkey,       // owner (creator signs)
            holder.amount,       // amount
            mintInfo.decimals,   // decimals
            [],                  // no multisig
            TOKEN_2022_PROGRAM_ID
          )
        );

        holderDistributions.push({
          wallet: holder.address,
          amount: holder.amount,
        });
      }

      return {
        success: true,
        totalCollected: withheldAmount,
        creatorAmount: distribution.creatorAmount,
        holderDistributions,
      };
    } else {
      // Just withdraw everything to creator
      transaction.add(
        createWithdrawWithheldTokensFromMintInstruction(
          mintPubkey,
          creatorAta,
          creatorPubkey,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      return {
        success: true,
        totalCollected: withheldAmount,
        creatorAmount: withheldAmount,
        holderDistributions: [],
      };
    }

  } catch (error: any) {
    console.error('Royalty distribution error:', error);
    return {
      success: false,
      totalCollected: 0n,
      creatorAmount: 0n,
      holderDistributions: [],
      error: error.message,
    };
  }
}

/**
 * Build a harvest transaction for client signing
 * Returns serialized transaction for wallet to sign
 */
export async function buildHarvestTransaction(
  tokenMint: string,
  creatorWallet: string
): Promise<{ success: boolean; transaction?: string; withheldAmount?: string; error?: string }> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const mintPubkey = new PublicKey(tokenMint);
    const creatorPubkey = new PublicKey(creatorWallet);

    // Get mint info
    const mintInfo = await getMint(
      connection,
      mintPubkey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );

    const feeConfig = getTransferFeeConfig(mintInfo);
    if (!feeConfig) {
      return { success: false, error: 'No transfer fee config on this token' };
    }

    const withheldAmount = feeConfig.withheldAmount;

    // Get creator's token account
    const creatorAta = await getAssociatedTokenAddress(
      mintPubkey,
      creatorPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Build transaction
    const transaction = new Transaction();

    // Withdraw withheld tokens to creator
    transaction.add(
      createWithdrawWithheldTokensFromMintInstruction(
        mintPubkey,
        creatorAta,
        creatorPubkey, // withdraw authority (creator must sign)
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    // Set transaction params
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = creatorPubkey;

    // Serialize
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    return {
      success: true,
      transaction: serializedTx,
      withheldAmount: withheldAmount.toString(),
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
