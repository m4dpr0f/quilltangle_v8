/**
 * Treasury Wallet Management
 *
 * Handles the 8xM Commons Treasury for reciprocity pool operations.
 * The treasury holds GCN tokens that can be swapped 1:1 with QLX.
 */

import { Keypair, PublicKey, Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// QLX token mint address
export const QLX_MINT = new PublicKey('4ag4s7uTViKSG4BjNiYeiuYmazwhzaJy3XUqU3Fg1P9F');

// Get treasury keypair from environment
export function getTreasuryKeypair(): Keypair | null {
  const keypairBase64 = process.env.TREASURY_8XM_KEYPAIR_BASE64;
  if (!keypairBase64) {
    console.warn('TREASURY_8XM_KEYPAIR_BASE64 not set');
    return null;
  }

  try {
    const keypairBytes = Buffer.from(keypairBase64, 'base64');
    return Keypair.fromSecretKey(new Uint8Array(keypairBytes));
  } catch (error) {
    console.error('Invalid treasury keypair:', error);
    return null;
  }
}

// Get RPC connection
export function getConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

// Get treasury public key (even without private key for read operations)
export function getTreasuryPublicKey(): PublicKey | null {
  // First try to get from keypair
  const keypair = getTreasuryKeypair();
  if (keypair) {
    return keypair.publicKey;
  }

  // Fallback to env variable for public key only
  const pubkeyStr = process.env.TREASURY_8XM_PUBKEY;
  if (pubkeyStr) {
    try {
      return new PublicKey(pubkeyStr);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get token balance for a wallet
 */
export async function getTokenBalance(
  connection: Connection,
  walletPubkey: PublicKey,
  mintPubkey: PublicKey
): Promise<bigint> {
  try {
    const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
    const account = await getAccount(connection, ata);
    return account.amount;
  } catch {
    return BigInt(0);
  }
}

/**
 * Get treasury balance for a specific token
 */
export async function getTreasuryBalance(mintAddress: string): Promise<{
  balance: bigint;
  formatted: number;
  decimals: number;
}> {
  const treasuryPubkey = getTreasuryPublicKey();
  if (!treasuryPubkey) {
    return { balance: BigInt(0), formatted: 0, decimals: 6 };
  }

  const connection = getConnection();
  const mintPubkey = new PublicKey(mintAddress);

  const balance = await getTokenBalance(connection, treasuryPubkey, mintPubkey);
  const decimals = 6; // Standard for most tokens

  return {
    balance,
    formatted: Number(balance) / Math.pow(10, decimals),
    decimals,
  };
}

/**
 * Build a reciprocity swap transaction
 *
 * For QLX → GCN:
 *   - User sends QLX to treasury (user signs)
 *   - Treasury sends GCN to user (treasury signs)
 *
 * For GCN → QLX:
 *   - User sends GCN to treasury (user signs)
 *   - Treasury sends QLX to user (treasury signs)
 */
export async function buildReciprocitySwapTransaction(params: {
  userWallet: string;
  fromMint: string;
  toMint: string;
  amount: number; // In token units (not raw)
  decimals?: number;
}): Promise<{
  success: boolean;
  transaction?: string; // Base64 encoded
  message?: string;
  error?: string;
  details?: {
    userSendsToken: string;
    userReceivesToken: string;
    amountRaw: string;
  };
}> {
  const { userWallet, fromMint, toMint, amount, decimals = 6 } = params;

  const treasuryKeypair = getTreasuryKeypair();
  if (!treasuryKeypair) {
    return {
      success: false,
      error: 'Treasury not configured. Contact admin.',
    };
  }

  try {
    const connection = getConnection();
    const userPubkey = new PublicKey(userWallet);
    const fromMintPubkey = new PublicKey(fromMint);
    const toMintPubkey = new PublicKey(toMint);
    const treasuryPubkey = treasuryKeypair.publicKey;

    const amountRaw = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    // Check treasury has enough of the "to" token
    const treasuryToBalance = await getTokenBalance(connection, treasuryPubkey, toMintPubkey);
    if (treasuryToBalance < amountRaw) {
      return {
        success: false,
        error: `Insufficient treasury balance. Available: ${Number(treasuryToBalance) / Math.pow(10, decimals)}`,
      };
    }

    // Get token accounts
    const userFromATA = await getAssociatedTokenAddress(fromMintPubkey, userPubkey);
    const userToATA = await getAssociatedTokenAddress(toMintPubkey, userPubkey);
    const treasuryFromATA = await getAssociatedTokenAddress(fromMintPubkey, treasuryPubkey);
    const treasuryToATA = await getAssociatedTokenAddress(toMintPubkey, treasuryPubkey);

    const instructions: TransactionInstruction[] = [];

    // Check if user's "to" token account exists, create if not
    try {
      await getAccount(connection, userToATA);
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          userPubkey, // payer
          userToATA,
          userPubkey,
          toMintPubkey
        )
      );
    }

    // Check if treasury's "from" token account exists, create if not
    try {
      await getAccount(connection, treasuryFromATA);
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          userPubkey, // user pays for treasury ATA
          treasuryFromATA,
          treasuryPubkey,
          fromMintPubkey
        )
      );
    }

    // Transfer FROM user TO treasury
    instructions.push(
      createTransferInstruction(
        userFromATA,
        treasuryFromATA,
        userPubkey, // User is the authority (will sign)
        amountRaw
      )
    );

    // Transfer FROM treasury TO user (treasury signs)
    instructions.push(
      createTransferInstruction(
        treasuryToATA,
        userToATA,
        treasuryPubkey, // Treasury is the authority (will sign server-side)
        amountRaw
      )
    );

    // Build transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: userPubkey, // User pays the fee
      blockhash,
      lastValidBlockHeight,
    });

    instructions.forEach((ix) => transaction.add(ix));

    // Treasury signs its part
    transaction.partialSign(treasuryKeypair);

    // Serialize for client to sign
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return {
      success: true,
      transaction: serialized.toString('base64'),
      message: `Swap ${amount} tokens ready. Sign to complete.`,
      details: {
        userSendsToken: fromMint,
        userReceivesToken: toMint,
        amountRaw: amountRaw.toString(),
      },
    };
  } catch (error: any) {
    console.error('Build swap transaction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to build transaction',
    };
  }
}

/**
 * Verify a swap transaction was successful and update database
 */
export async function verifySwapTransaction(signature: string): Promise<{
  success: boolean;
  confirmed: boolean;
  error?: string;
}> {
  try {
    const connection = getConnection();
    const result = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });

    if (!result.value) {
      return { success: true, confirmed: false };
    }

    const confirmed = result.value.confirmationStatus === 'confirmed' ||
                      result.value.confirmationStatus === 'finalized';

    return { success: true, confirmed };
  } catch (error: any) {
    return { success: false, confirmed: false, error: error.message };
  }
}
