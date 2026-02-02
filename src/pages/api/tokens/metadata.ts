/**
 * Token Metadata Management API
 *
 * Allows token creators to:
 * - View their token's current metadata
 * - Update metadata (name, symbol, description, image)
 * - Add Metaplex metadata to tokens created without it
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Derive Metaplex metadata PDA
function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return pda;
}

// Serialize string with Borsh length prefix
function serializeString(str: string): Buffer {
  const strBytes = Buffer.from(str, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lenBuf, strBytes]);
}

// Build CreateMetadataAccountV3 instruction data
function buildCreateMetadataV3Data(
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number,
  creators: Array<{ address: string; verified: boolean; share: number }>
): Buffer {
  const parts: Buffer[] = [];

  // Instruction discriminator for CreateMetadataAccountV3 = 33
  parts.push(Buffer.from([33]));

  // DataV2 struct
  parts.push(serializeString(name.slice(0, 32)));
  parts.push(serializeString(symbol.slice(0, 10)));
  parts.push(serializeString(uri));

  // Seller fee basis points (u16)
  const feeBuf = Buffer.alloc(2);
  feeBuf.writeUInt16LE(sellerFeeBasisPoints, 0);
  parts.push(feeBuf);

  // Creators (Option<Vec<Creator>>)
  if (creators && creators.length > 0) {
    parts.push(Buffer.from([1])); // Some
    const vecLenBuf = Buffer.alloc(4);
    vecLenBuf.writeUInt32LE(creators.length, 0);
    parts.push(vecLenBuf);

    for (const creator of creators) {
      parts.push(new PublicKey(creator.address).toBuffer());
      parts.push(Buffer.from([creator.verified ? 1 : 0]));
      parts.push(Buffer.from([creator.share]));
    }
  } else {
    parts.push(Buffer.from([0])); // None
  }

  // Collection (Option) - None
  parts.push(Buffer.from([0]));
  // Uses (Option) - None
  parts.push(Buffer.from([0]));
  // isMutable (bool)
  parts.push(Buffer.from([1]));
  // collectionDetails (Option) - None
  parts.push(Buffer.from([0]));

  return Buffer.concat(parts);
}

// Build UpdateMetadataAccountV2 instruction data
function buildUpdateMetadataV2Data(
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number,
  creators: Array<{ address: string; verified: boolean; share: number }>
): Buffer {
  const parts: Buffer[] = [];

  // Instruction discriminator for UpdateMetadataAccountV2 = 15
  parts.push(Buffer.from([15]));

  // Option<DataV2> - Some
  parts.push(Buffer.from([1]));

  // DataV2 struct
  parts.push(serializeString(name.slice(0, 32)));
  parts.push(serializeString(symbol.slice(0, 10)));
  parts.push(serializeString(uri));

  const feeBuf = Buffer.alloc(2);
  feeBuf.writeUInt16LE(sellerFeeBasisPoints, 0);
  parts.push(feeBuf);

  if (creators && creators.length > 0) {
    parts.push(Buffer.from([1]));
    const vecLenBuf = Buffer.alloc(4);
    vecLenBuf.writeUInt32LE(creators.length, 0);
    parts.push(vecLenBuf);

    for (const creator of creators) {
      parts.push(new PublicKey(creator.address).toBuffer());
      parts.push(Buffer.from([creator.verified ? 1 : 0]));
      parts.push(Buffer.from([creator.share]));
    }
  } else {
    parts.push(Buffer.from([0]));
  }

  // Collection - None
  parts.push(Buffer.from([0]));
  // Uses - None
  parts.push(Buffer.from([0]));

  // Option<Pubkey> newUpdateAuthority - None
  parts.push(Buffer.from([0]));
  // Option<bool> primarySaleHappened - None
  parts.push(Buffer.from([0]));
  // Option<bool> isMutable - None (keep existing)
  parts.push(Buffer.from([0]));

  return Buffer.concat(parts);
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const tokenMint = url.searchParams.get('mint');
  const walletAddress = url.searchParams.get('wallet');

  if (!tokenMint) {
    return new Response(JSON.stringify({ success: false, error: 'Token mint required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL_8XM!);
    const connection = new Connection(RPC_URL, 'confirmed');

    // Get token from database
    const tokens = await sql`
      SELECT * FROM token_launches WHERE token_mint = ${tokenMint}
    `;

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Token not found in database' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = tokens[0];

    // Check ownership if wallet provided
    if (walletAddress && token.creator_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not authorized - you are not the token creator'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check on-chain metadata status
    const mintPubkey = new PublicKey(tokenMint);
    const metadataPDA = getMetadataPDA(mintPubkey);
    const metadataAccount = await connection.getAccountInfo(metadataPDA);

    // Check if token exists on chain
    let onChainInfo = null;
    try {
      const mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
      onChainInfo = {
        exists: true,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply.toString(),
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
      };
    } catch {
      try {
        const { TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
        const mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
        onChainInfo = {
          exists: true,
          decimals: mintInfo.decimals,
          supply: mintInfo.supply.toString(),
          mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
          program: 'SPL Token',
        };
      } catch {
        onChainInfo = { exists: false };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      token: {
        mint: token.token_mint,
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        imageUrl: token.image_url,
        creatorWallet: token.creator_wallet,
        nationName: token.nation_name,
        tek8Guild: token.tek8_guild,
        phase: token.phase,
        createdAt: token.created_at,
      },
      metadata: {
        hasMetaplex: !!metadataAccount,
        metadataPDA: metadataPDA.toBase58(),
      },
      onChain: onChainInfo,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Metadata fetch error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, tokenMint, walletAddress, name, symbol, description, imageUrl } = body;

    if (!tokenMint || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token mint and wallet address required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = neon(process.env.DATABASE_URL_8XM!);
    const connection = new Connection(RPC_URL, 'confirmed');

    // Verify ownership
    const tokens = await sql`
      SELECT * FROM token_launches WHERE token_mint = ${tokenMint}
    `;

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Token not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = tokens[0];
    if (token.creator_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not authorized - you are not the token creator'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mintPubkey = new PublicKey(tokenMint);
    const creatorPubkey = new PublicKey(walletAddress);
    const metadataPDA = getMetadataPDA(mintPubkey);

    // Check if metadata exists
    const metadataAccount = await connection.getAccountInfo(metadataPDA);

    // Upload new metadata to IPFS if we have image
    let metadataUri = imageUrl || token.image_url || '';
    const pinataJwt = process.env.PINATA_JWT;

    if (pinataJwt && (name || symbol || description || imageUrl)) {
      const metadata = {
        name: name || token.name,
        symbol: symbol || token.symbol,
        description: description || token.description || `${token.name} - A Quillverse Nation Token`,
        image: imageUrl || token.image_url || '',
        external_url: 'https://8xm.fun',
        attributes: [
          { trait_type: 'Nation', value: token.nation_name || 'Unknown' },
          { trait_type: 'TEK8 Guild', value: token.tek8_guild || 'Unaffiliated' },
          { trait_type: 'Platform', value: '8xM Quillverse' },
        ],
        properties: {
          category: 'token',
          creators: [{ address: walletAddress, share: 100 }],
        },
      };

      try {
        const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pinataJwt}`,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: { name: `${token.symbol}-metadata.json` },
          }),
        });

        const data = await res.json();
        if (data.IpfsHash) {
          const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
          metadataUri = `https://${gateway}/ipfs/${data.IpfsHash}`;
        }
      } catch (error) {
        console.warn('IPFS upload failed, using existing URI');
      }
    }

    // Build transaction based on whether metadata exists
    let instruction: TransactionInstruction;

    if (metadataAccount) {
      // Update existing metadata
      const data = buildUpdateMetadataV2Data(
        name || token.name,
        symbol || token.symbol,
        metadataUri,
        Math.floor((token.royalty_config?.feePercent || 0) * 100),
        [{ address: walletAddress, verified: false, share: 100 }]
      );

      instruction = new TransactionInstruction({
        keys: [
          { pubkey: metadataPDA, isSigner: false, isWritable: true },
          { pubkey: creatorPubkey, isSigner: true, isWritable: false },
        ],
        programId: METADATA_PROGRAM_ID,
        data,
      });
    } else {
      // Create new metadata
      const data = buildCreateMetadataV3Data(
        name || token.name,
        symbol || token.symbol,
        metadataUri,
        Math.floor((token.royalty_config?.feePercent || 0) * 100),
        [{ address: walletAddress, verified: false, share: 100 }]
      );

      instruction = new TransactionInstruction({
        keys: [
          { pubkey: metadataPDA, isSigner: false, isWritable: true },
          { pubkey: mintPubkey, isSigner: false, isWritable: false },
          { pubkey: creatorPubkey, isSigner: true, isWritable: false },
          { pubkey: creatorPubkey, isSigner: true, isWritable: true },
          { pubkey: creatorPubkey, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
        ],
        programId: METADATA_PROGRAM_ID,
        data,
      });
    }

    const transaction = new Transaction().add(instruction);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = creatorPubkey;

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    // Update database with new values
    if (name || symbol || description || imageUrl) {
      await sql`
        UPDATE token_launches SET
          name = COALESCE(${name}, name),
          symbol = COALESCE(${symbol}, symbol),
          description = COALESCE(${description}, description),
          image_url = COALESCE(${imageUrl}, image_url),
          updated_at = NOW()
        WHERE token_mint = ${tokenMint}
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      transaction: serialized,
      metadataUri,
      action: metadataAccount ? 'update' : 'create',
      message: metadataAccount
        ? 'Sign to update your token metadata'
        : 'Sign to add metadata to your token',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Metadata update error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
