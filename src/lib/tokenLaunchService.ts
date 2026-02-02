/**
 * 8xM Token Launch Service
 *
 * Fully automated token launch like pump.fun:
 * - Server builds all transactions
 * - Client just signs and submits
 * - Token created with proper distribution
 * - Metadata uploaded to IPFS and attached on-chain
 *
 * Uses Token-2022 with Transfer Fee extension for enforced royalties!
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getMintLen,
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
} from '@solana/spl-token-metadata';

// TokenMetadata interface for spl-token-metadata
interface TokenMetadata {
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  additionalMetadata: [string, string][];
}

// RPC Configuration
const RPC_URL = import.meta.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Metaplex Token Metadata Program ID
const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Get Metaplex metadata PDA for a mint
 */
function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );
  return pda;
}

/**
 * Build CreateMetadataAccountV3 instruction manually
 * This makes tokens visible in Phantom and other wallets
 */
function buildCreateMetadataV3Instruction(
  metadataPDA: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number = 0,
  creators: Array<{ address: PublicKey; verified: boolean; share: number }> | null = null
): TransactionInstruction {
  // Serialize metadata using Borsh
  const nameBytes = Buffer.from(name.slice(0, 32).padEnd(32, '\0'));
  const symbolBytes = Buffer.from(symbol.slice(0, 10).padEnd(10, '\0'));
  const uriBytes = Buffer.from(uri.slice(0, 200).padEnd(200, '\0'));

  // Build the data buffer for CreateMetadataAccountV3
  // Discriminator: 33 (CreateMetadataAccountV3)
  const discriminator = Buffer.from([33]);

  // Data structure for DataV2:
  // - name: string (4 bytes length + data)
  // - symbol: string (4 bytes length + data)
  // - uri: string (4 bytes length + data)
  // - seller_fee_basis_points: u16
  // - creators: Option<Vec<Creator>>
  // - collection: Option<Collection>
  // - uses: Option<Uses>

  const nameLen = Buffer.alloc(4);
  nameLen.writeUInt32LE(name.length);

  const symbolLen = Buffer.alloc(4);
  symbolLen.writeUInt32LE(symbol.length);

  const uriLen = Buffer.alloc(4);
  uriLen.writeUInt32LE(uri.length);

  const sellerFee = Buffer.alloc(2);
  sellerFee.writeUInt16LE(sellerFeeBasisPoints);

  // Creators: Option<Vec<Creator>>
  let creatorsData: Buffer;
  if (creators && creators.length > 0) {
    const creatorBuffers: Buffer[] = [];
    for (const creator of creators) {
      const creatorBuf = Buffer.concat([
        creator.address.toBuffer(),
        Buffer.from([creator.verified ? 1 : 0]),
        Buffer.from([creator.share]),
      ]);
      creatorBuffers.push(creatorBuf);
    }
    const vecLen = Buffer.alloc(4);
    vecLen.writeUInt32LE(creators.length);
    creatorsData = Buffer.concat([Buffer.from([1]), vecLen, ...creatorBuffers]); // Some
  } else {
    creatorsData = Buffer.from([0]); // None
  }

  // Collection: None
  const collectionData = Buffer.from([0]);

  // Uses: None
  const usesData = Buffer.from([0]);

  // isMutable: true
  const isMutable = Buffer.from([1]);

  // collectionDetails: None (for V3)
  const collectionDetails = Buffer.from([0]);

  const data = Buffer.concat([
    discriminator,
    nameLen,
    Buffer.from(name),
    symbolLen,
    Buffer.from(symbol),
    uriLen,
    Buffer.from(uri),
    sellerFee,
    creatorsData,
    collectionData,
    usesData,
    isMutable,
    collectionDetails,
  ]);

  // Keys for CreateMetadataAccountV3
  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },      // metadata
    { pubkey: mint, isSigner: false, isWritable: false },             // mint
    { pubkey: mintAuthority, isSigner: true, isWritable: false },     // mint authority
    { pubkey: payer, isSigner: true, isWritable: true },              // payer
    { pubkey: updateAuthority, isSigner: false, isWritable: false },  // update authority
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
  ];

  // For Token-2022 mints, we need to add the sysvar rent
  keys.push({ pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false });

  return new TransactionInstruction({
    keys,
    programId: METAPLEX_PROGRAM_ID,
    data,
  });
}

// Platform wallet for commissions
export const PLATFORM_WALLET = new PublicKey('E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj');
export const PLATFORM_FEE_PERCENT = 0.01; // 1%
export const MIN_PLATFORM_FEE = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL minimum

// Commons Treasury for token deposits
const TREASURY_PUBKEY_STR = process.env.TREASURY_8XM_PUBKEY || 'E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj';
export const COMMONS_TREASURY = new PublicKey(TREASURY_PUBKEY_STR);
export const TREASURY_DEPOSIT_PERCENT = 0.01; // 1% of supply

// TEK8 Guild to Meteora bin step mapping
export const GUILD_BIN_STEPS: Record<string, number> = {
  'D2': 25,   // Coin - moderate
  'D4': 50,   // Fire - high volatility
  'D6': 15,   // Earth - stable
  'D8': 30,   // Air - moderate-high
  'D10': 100, // Chaos - extreme
  'D12': 20,  // Ether - balanced
  'D20': 25,  // Water - flowing
  'D100': 10, // Order - very stable
};

export interface LaunchConfig {
  // Token info
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  decimals?: number;

  // Liquidity
  initialSolLiquidity: number;
  tokenLiquidityPercent: number;

  // Rainbow Roads integration
  nationName: string;
  tek8Guild?: string;
  roadId?: string;

  // Pillar metadata (for Quillverse)
  qlxInstrument?: string;
  qlyCampaignUrl?: string;
  qlzTechnology?: string;

  // Social links
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;

  // Royalties
  creatorRoyaltyPercent?: number;

  // Creator
  creatorWallet: string;
}

export interface LaunchResult {
  success: boolean;

  // Transaction to sign
  transaction?: string; // Base64 encoded

  // Keypairs that were used (for reference)
  mintKeypair?: string; // Base58 secret key - client needs this to complete signing

  // Addresses
  tokenMint?: string;
  poolAddress?: string;
  creatorTokenAccount?: string;
  treasuryTokenAccount?: string;

  // Allocations (actual amounts that will be distributed)
  liquidityTokens?: number;
  creatorTokens?: number;
  treasuryTokens?: number;

  // Fees
  platformFeeLamports?: number;

  // Metadata
  metadataUri?: string;

  error?: string;
}

/**
 * Create Rainbow Roads token metadata
 */
export function createQuillverseMetadata(config: LaunchConfig) {
  return {
    name: config.name,
    symbol: config.symbol,
    description: config.description,
    image: config.imageUrl,
    external_url: config.website || 'https://8xm.fun',

    // Rainbow Roads specific attributes
    attributes: [
      { trait_type: 'Nation', value: config.nationName },
      { trait_type: 'TEK8 Guild', value: config.tek8Guild || 'Unaffiliated' },
      { trait_type: 'Rainbow Road', value: config.roadId || 'Unclaimed' },
      { trait_type: 'QLX Instrument', value: config.qlxInstrument || 'None' },
      { trait_type: 'QLY Campaign', value: config.qlyCampaignUrl ? 'Active' : 'None' },
      { trait_type: 'QLZ Technology', value: config.qlzTechnology || 'None' },
      { trait_type: 'Platform', value: '8xM Quillverse' },
    ],

    // Social links
    links: {
      website: config.website || null,
      twitter: config.twitter ? `https://x.com/${config.twitter.replace('@', '')}` : null,
      telegram: config.telegram ? (config.telegram.startsWith('http') ? config.telegram : `https://t.me/${config.telegram}`) : null,
      discord: config.discord ? (config.discord.startsWith('http') ? config.discord : `https://discord.gg/${config.discord}`) : null,
    },

    // Royalties (seller fee basis points - 100 = 1%)
    seller_fee_basis_points: Math.floor((config.creatorRoyaltyPercent || 0) * 100),

    // Properties for Metaplex
    properties: {
      category: 'token',
      creators: [
        {
          address: config.creatorWallet,
          share: 100,
          verified: false,
        }
      ],

      // Quillverse specific
      quillverse: {
        nationName: config.nationName,
        tek8Guild: config.tek8Guild,
        roadId: config.roadId,
        pillars: {
          qlx: config.qlxInstrument,
          qly: config.qlyCampaignUrl,
          qlz: config.qlzTechnology,
        },
      },
    },
  };
}

/**
 * Upload metadata to IPFS via Pinata
 */
export async function uploadMetadataToIPFS(metadata: object): Promise<string | null> {
  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    console.warn('PINATA_JWT not set, skipping metadata upload');
    return null;
  }

  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${(metadata as any).symbol || 'token'}-metadata.json`,
        },
      }),
    });

    const data = await res.json();
    if (data.IpfsHash) {
      const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
      return `https://${gateway}/ipfs/${data.IpfsHash}`;
    }
    return null;
  } catch (error) {
    console.error('Metadata upload error:', error);
    return null;
  }
}

/**
 * Calculate token allocations
 */
export function calculateAllocations(totalSupply: number, liquidityPercent: number) {
  const treasuryTokens = Math.floor(Math.max(totalSupply * TREASURY_DEPOSIT_PERCENT, 1_000_000));
  const liquidityTokens = Math.floor(totalSupply * (liquidityPercent / 100));
  const creatorTokens = Math.floor(totalSupply - liquidityTokens - treasuryTokens);

  return { liquidityTokens, creatorTokens, treasuryTokens };
}

/**
 * Build the complete token launch transaction
 *
 * Uses Token-2022 with Transfer Fee extension for enforced royalties!
 * Also uses MetadataPointer extension for on-chain metadata.
 *
 * This creates:
 * 1. Token mint account with TransferFee + MetadataPointer extensions
 * 2. Initialize transfer fee config (enforced royalties)
 * 3. Initialize metadata pointer
 * 4. Initialize mint
 * 5. Initialize on-chain metadata
 * 6. Create token accounts for creator AND treasury
 * 7. Mint tokens with PROPER DISTRIBUTION:
 *    - Creator tokens → creator wallet
 *    - Treasury tokens → commons treasury
 *    - Liquidity tokens → creator (for manual pool creation)
 * 8. Platform fee transfer
 */
export async function buildLaunchTransaction(config: LaunchConfig): Promise<LaunchResult> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const creatorPubkey = new PublicKey(config.creatorWallet);
    const decimals = config.decimals || 6;

    // Generate new mint keypair
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey;

    // Calculate allocations
    const allocations = calculateAllocations(config.totalSupply, config.tokenLiquidityPercent);

    // Calculate platform fee
    const platformFeeLamports = Math.max(
      MIN_PLATFORM_FEE,
      Math.floor(config.initialSolLiquidity * LAMPORTS_PER_SOL * PLATFORM_FEE_PERCENT)
    );

    // Transfer fee configuration
    const feeBasisPoints = Math.floor((config.creatorRoyaltyPercent || 0) * 100);
    const maxFee = BigInt(Math.floor(config.totalSupply * 0.001 * (10 ** decimals)));

    // Create metadata for on-chain storage
    const tokenMetadata: TokenMetadata = {
      mint: mintPubkey,
      name: config.name.slice(0, 32), // Max 32 chars
      symbol: config.symbol.slice(0, 10), // Max 10 chars
      uri: config.imageUrl || '', // Will be updated with IPFS URI
      additionalMetadata: [
        ['nation', config.nationName],
        ['tek8_guild', config.tek8Guild || 'none'],
        ['platform', '8xM'],
      ],
    };

    // Calculate space needed for mint with extensions
    const metadataExtensionSize = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length + 256; // Extra buffer
    const mintLen = getMintLen([ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer]) + metadataExtensionSize;
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintLen);

    // Get associated token addresses
    const creatorAta = await getAssociatedTokenAddress(
      mintPubkey,
      creatorPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const treasuryAta = await getAssociatedTokenAddress(
      mintPubkey,
      COMMONS_TREASURY,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Build transaction
    const transaction = new Transaction();

    // 1. Create mint account with space for extensions
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: creatorPubkey,
        newAccountPubkey: mintPubkey,
        lamports: mintRent,
        space: mintLen,
        programId: TOKEN_2022_PROGRAM_ID,
      })
    );

    // 2. Initialize metadata pointer (MUST be before mint init)
    transaction.add(
      createInitializeMetadataPointerInstruction(
        mintPubkey,
        creatorPubkey, // authority
        mintPubkey, // metadata address (self-referential for Token-2022)
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 3. Initialize transfer fee config (MUST be before mint init)
    transaction.add(
      createInitializeTransferFeeConfigInstruction(
        mintPubkey,
        creatorPubkey, // transferFeeConfigAuthority
        creatorPubkey, // withdrawWithheldAuthority
        feeBasisPoints,
        maxFee,
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 4. Initialize mint
    transaction.add(
      createInitializeMintInstruction(
        mintPubkey,
        decimals,
        creatorPubkey, // Mint authority
        null, // Freeze authority (none)
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 5. Initialize on-chain metadata
    transaction.add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintPubkey,
        metadata: mintPubkey,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri,
        mintAuthority: creatorPubkey,
        updateAuthority: creatorPubkey,
      })
    );

    // 6. Create creator's token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        creatorPubkey,
        creatorAta,
        creatorPubkey,
        mintPubkey,
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 7. Create treasury token account (creator pays for it)
    transaction.add(
      createAssociatedTokenAccountInstruction(
        creatorPubkey, // payer
        treasuryAta,
        COMMONS_TREASURY,
        mintPubkey,
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 8. Mint creator's tokens (including liquidity tokens they'll use for pool)
    const creatorAmount = BigInt(allocations.creatorTokens + allocations.liquidityTokens) * BigInt(10 ** decimals);
    transaction.add(
      createMintToInstruction(
        mintPubkey,
        creatorAta,
        creatorPubkey,
        creatorAmount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 9. Mint treasury tokens directly to treasury
    const treasuryAmount = BigInt(allocations.treasuryTokens) * BigInt(10 ** decimals);
    transaction.add(
      createMintToInstruction(
        mintPubkey,
        treasuryAta,
        creatorPubkey, // mint authority
        treasuryAmount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 10. Platform fee (SOL transfer)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: creatorPubkey,
        toPubkey: PLATFORM_WALLET,
        lamports: platformFeeLamports,
      })
    );

    // 11. Create Metaplex metadata for Phantom wallet compatibility
    // This makes the token visible in Phantom and other wallets that use Metaplex
    const metadataPDA = getMetadataPDA(mintPubkey);
    transaction.add(
      buildCreateMetadataV3Instruction(
        metadataPDA,
        mintPubkey,
        creatorPubkey, // mint authority
        creatorPubkey, // payer
        creatorPubkey, // update authority
        config.name.slice(0, 32),
        config.symbol.slice(0, 10),
        tokenMetadata.uri || config.imageUrl || '',
        Math.floor((config.creatorRoyaltyPercent || 0) * 100), // seller fee basis points
        [{ address: creatorPubkey, verified: true, share: 100 }] // creators
      )
    );

    // Set transaction parameters
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = creatorPubkey;

    // Partially sign with mint keypair
    transaction.partialSign(mintKeypair);

    // Serialize for client signing
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    return {
      success: true,
      transaction: serializedTx,
      mintKeypair: Buffer.from(mintKeypair.secretKey).toString('base64'),
      tokenMint: mintPubkey.toBase58(),
      creatorTokenAccount: creatorAta.toBase58(),
      treasuryTokenAccount: treasuryAta.toBase58(),
      liquidityTokens: allocations.liquidityTokens,
      creatorTokens: allocations.creatorTokens,
      treasuryTokens: allocations.treasuryTokens,
      platformFeeLamports,
      metadataUri: tokenMetadata.uri || config.imageUrl || '',
    };

  } catch (error: any) {
    console.error('Launch transaction build error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update token metadata URI after IPFS upload
 */
export async function buildUpdateMetadataTransaction(
  mintAddress: string,
  creatorWallet: string,
  metadataUri: string
): Promise<{ success: boolean; transaction?: string; error?: string }> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const mintPubkey = new PublicKey(mintAddress);
    const creatorPubkey = new PublicKey(creatorWallet);

    const transaction = new Transaction();

    transaction.add(
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mintPubkey,
        updateAuthority: creatorPubkey,
        field: 'uri',
        value: metadataUri,
      })
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = creatorPubkey;

    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    return { success: true, transaction: serializedTx };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get connection to Solana RPC
 */
export function getConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}
