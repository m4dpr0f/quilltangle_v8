/**
 * @8xm/sdk - Server Module
 *
 * Full minting capabilities for Node.js backends (Replit, etc.)
 * This handles the heavy crypto operations that don't work on edge runtimes.
 *
 * Integrate into: quillverse.org, paladinking.com, ximura.org
 */

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
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
  pack,
} from '@solana/spl-token-metadata';

// ============================================
// CONFIGURATION
// ============================================

export interface SDK8xMConfig {
  rpcUrl: string;
  databaseUrl?: string;
  apiSecret?: string;  // For authenticating cross-origin requests
}

export interface TokenLaunchParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  creatorWallet: string;
  decimals?: number;

  // Royalties (Token-2022 transfer fee)
  royaltyPercent?: number;  // 0-5%

  // Quillverse integration
  nationName?: string;
  tek8Guild?: string;
  roadId?: string;

  // Metadata
  metadataUri?: string;
}

export interface LaunchResult {
  success: boolean;
  transaction?: string;  // Base64 encoded
  mintKeypair?: string;  // Base64 encoded secret key
  mintAddress?: string;
  error?: string;
}

// ============================================
// METAPLEX METADATA (for wallet visibility)
// ============================================

const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METAPLEX_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METAPLEX_PROGRAM_ID
  );
  return pda;
}

function buildCreateMetadataV3Instruction(
  metadataPDA: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  const discriminator = Buffer.from([33]); // CreateMetadataAccountV3

  const nameLen = Buffer.alloc(4);
  nameLen.writeUInt32LE(name.length);
  const symbolLen = Buffer.alloc(4);
  symbolLen.writeUInt32LE(symbol.length);
  const uriLen = Buffer.alloc(4);
  uriLen.writeUInt32LE(uri.length);
  const sellerFee = Buffer.alloc(2);
  sellerFee.writeUInt16LE(0);

  const data = Buffer.concat([
    discriminator,
    nameLen, Buffer.from(name),
    symbolLen, Buffer.from(symbol),
    uriLen, Buffer.from(uri),
    sellerFee,
    Buffer.from([0]), // no creators
    Buffer.from([0]), // no collection
    Buffer.from([0]), // no uses
    Buffer.from([1]), // isMutable
    Buffer.from([0]), // no collectionDetails
  ]);

  return new TransactionInstruction({
    programId: METAPLEX_PROGRAM_ID,
    keys: [
      { pubkey: metadataPDA, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ============================================
// CORE MINTING SERVICE
// ============================================

export class MintingService {
  private connection: Connection;
  private config: SDK8xMConfig;

  constructor(config: SDK8xMConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  /**
   * Build a complete token launch transaction
   * Returns serialized transaction + mint keypair for client signing
   */
  async buildLaunchTransaction(params: TokenLaunchParams): Promise<LaunchResult> {
    try {
      const {
        name,
        symbol,
        description,
        imageUrl,
        totalSupply,
        creatorWallet,
        decimals = 6,
        royaltyPercent = 0,
        metadataUri,
      } = params;

      // Generate new mint keypair
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;
      const creator = new PublicKey(creatorWallet);

      // Calculate space for Token-2022 with extensions
      const extensions: ExtensionType[] = [ExtensionType.MetadataPointer];
      if (royaltyPercent > 0) {
        extensions.push(ExtensionType.TransferFeeConfig);
      }

      // Token metadata for embedded metadata
      const tokenMetadata = {
        mint,
        name: name.slice(0, 32),
        symbol: symbol.slice(0, 10),
        uri: metadataUri || imageUrl,
        additionalMetadata: [] as [string, string][],
      };

      const metadataLen = pack(tokenMetadata).length;
      const mintLen = getMintLen(extensions) + TYPE_SIZE + LENGTH_SIZE + metadataLen;
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      // Build transaction
      const tx = new Transaction();

      // 1. Create mint account
      tx.add(
        SystemProgram.createAccount({
          fromPubkey: creator,
          newAccountPubkey: mint,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        })
      );

      // 2. Initialize metadata pointer
      tx.add(
        createInitializeMetadataPointerInstruction(
          mint,
          creator,
          mint, // metadata address = mint itself for Token-2022
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 3. Transfer fee config (if royalties enabled)
      if (royaltyPercent > 0) {
        const feeBasisPoints = Math.floor(royaltyPercent * 100); // 1% = 100 basis points
        const maxFee = BigInt(totalSupply * Math.pow(10, decimals)); // Max fee = total supply

        tx.add(
          createInitializeTransferFeeConfigInstruction(
            mint,
            creator, // transfer fee config authority
            creator, // withdraw withheld authority
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // 4. Initialize mint
      tx.add(
        createInitializeMintInstruction(
          mint,
          decimals,
          creator,
          creator, // freeze authority
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 5. Initialize token metadata
      tx.add(
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint,
          metadata: mint,
          name: tokenMetadata.name,
          symbol: tokenMetadata.symbol,
          uri: tokenMetadata.uri,
          mintAuthority: creator,
          updateAuthority: creator,
        })
      );

      // 6. Create creator's token account
      const creatorAta = await getAssociatedTokenAddress(
        mint,
        creator,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      tx.add(
        createAssociatedTokenAccountInstruction(
          creator,
          creatorAta,
          creator,
          mint,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 7. Mint initial supply to creator
      const supplyWithDecimals = BigInt(totalSupply) * BigInt(Math.pow(10, decimals));
      tx.add(
        createMintToInstruction(
          mint,
          creatorAta,
          creator,
          supplyWithDecimals,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 8. Add Metaplex metadata (for wallet visibility)
      const metadataPDA = getMetadataPDA(mint);
      tx.add(
        buildCreateMetadataV3Instruction(
          metadataPDA,
          mint,
          creator,
          creator,
          creator,
          name,
          symbol,
          metadataUri || imageUrl
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = creator;

      // Partially sign with mint keypair
      tx.partialSign(mintKeypair);

      // Serialize for client
      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        transaction: serializedTx.toString('base64'),
        mintKeypair: Buffer.from(mintKeypair.secretKey).toString('base64'),
        mintAddress: mint.toBase58(),
      };

    } catch (error: any) {
      console.error('Launch transaction build failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to build launch transaction',
      };
    }
  }

  /**
   * Verify a completed transaction
   */
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status?.value?.confirmationStatus === 'confirmed' ||
             status?.value?.confirmationStatus === 'finalized';
    } catch {
      return false;
    }
  }
}

// ============================================
// EXPRESS/HONO MIDDLEWARE
// ============================================

export interface MintingMiddlewareOptions {
  config: SDK8xMConfig;
  basePath?: string;
  onLaunchComplete?: (mintAddress: string, params: TokenLaunchParams) => Promise<void>;
}

/**
 * Create Express-compatible routes for minting
 */
export function createMintingRoutes(options: MintingMiddlewareOptions) {
  const { config, onLaunchComplete } = options;
  const service = new MintingService(config);

  return {
    /**
     * POST /mint/launch - Build a launch transaction
     */
    async handleLaunch(req: any, res: any) {
      try {
        const params: TokenLaunchParams = req.body;

        // Validate required fields
        if (!params.name || !params.symbol || !params.totalSupply || !params.creatorWallet) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: name, symbol, totalSupply, creatorWallet',
          });
        }

        const result = await service.buildLaunchTransaction(params);

        if (result.success && result.mintAddress && onLaunchComplete) {
          // Fire-and-forget callback
          onLaunchComplete(result.mintAddress, params).catch(console.error);
        }

        res.json(result);
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    },

    /**
     * POST /mint/verify - Verify a transaction
     */
    async handleVerify(req: any, res: any) {
      try {
        const { signature } = req.body;
        if (!signature) {
          return res.status(400).json({ success: false, error: 'Missing signature' });
        }

        const verified = await service.verifyTransaction(signature);
        res.json({ success: true, verified });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },

    /**
     * Health check
     */
    async handleHealth(_req: any, res: any) {
      res.json({ status: 'ok', service: '8xm-minting' });
    },
  };
}

/**
 * Quick setup for Express
 */
export function setupExpressMinting(app: any, options: MintingMiddlewareOptions) {
  const basePath = options.basePath || '/api/8xm';
  const routes = createMintingRoutes(options);

  app.post(`${basePath}/launch`, routes.handleLaunch);
  app.post(`${basePath}/verify`, routes.handleVerify);
  app.get(`${basePath}/health`, routes.handleHealth);

  console.log(`8xM Minting SDK mounted at ${basePath}`);
}

/**
 * Quick setup for Hono
 */
export function setupHonoMinting(app: any, options: MintingMiddlewareOptions) {
  const basePath = options.basePath || '/api/8xm';
  const routes = createMintingRoutes(options);

  app.post(`${basePath}/launch`, async (c: any) => {
    const req = { body: await c.req.json() };
    const res = {
      status: (code: number) => ({ json: (data: any) => c.json(data, code) }),
      json: (data: any) => c.json(data),
    };
    await routes.handleLaunch(req, res);
  });

  app.post(`${basePath}/verify`, async (c: any) => {
    const req = { body: await c.req.json() };
    const res = {
      status: (code: number) => ({ json: (data: any) => c.json(data, code) }),
      json: (data: any) => c.json(data),
    };
    await routes.handleVerify(req, res);
  });

  app.get(`${basePath}/health`, (c: any) => c.json({ status: 'ok', service: '8xm-minting' }));

  console.log(`8xM Minting SDK mounted at ${basePath}`);
}
