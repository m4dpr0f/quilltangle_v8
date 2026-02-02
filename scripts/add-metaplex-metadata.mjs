#!/usr/bin/env node

/**
 * Add Metaplex Metadata to Token-2022 Token
 *
 * For tokens created without the MetadataPointer extension, this script
 * adds a Metaplex metadata account (legacy metadata) so wallets can display
 * the token name, symbol, and image.
 *
 * Usage:
 *   node scripts/add-metaplex-metadata.mjs <mint_address> [--execute]
 *
 * Without --execute, it builds the transaction and outputs base64 for signing.
 * With --execute and CREATOR_KEYPAIR_PATH, it signs and submits.
 */

import 'dotenv/config';
import fs from 'fs';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { neon } from '@neondatabase/serverless';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Metaplex Token Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Derive Metaplex metadata PDA
function getMetadataPDA(mint) {
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

/**
 * Serialize a string with length prefix (Borsh style)
 */
function serializeString(str) {
  const strBytes = Buffer.from(str, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lenBuf, strBytes]);
}

/**
 * Build CreateMetadataAccountV3 instruction data manually
 * This matches the Metaplex instruction format
 */
function buildCreateMetadataV3Data(name, symbol, uri, sellerFeeBasisPoints, creators) {
  const parts = [];

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
      parts.push(new PublicKey(creator.address).toBuffer()); // 32 bytes
      parts.push(Buffer.from([creator.verified ? 1 : 0])); // bool
      parts.push(Buffer.from([creator.share])); // u8
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

/**
 * Build CreateMetadataAccountV3 instruction
 */
function createMetadataAccountV3Instruction(
  metadataPDA,
  mint,
  mintAuthority,
  payer,
  updateAuthority,
  name,
  symbol,
  uri,
  sellerFeeBasisPoints,
  creators
) {
  const data = buildCreateMetadataV3Data(name, symbol, uri, sellerFeeBasisPoints, creators);

  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: mintAuthority, isSigner: true, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: updateAuthority, isSigner: false, isWritable: false },
    { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false }, // System Program
    { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }, // Rent sysvar
  ];

  return new TransactionInstruction({
    keys,
    programId: METADATA_PROGRAM_ID,
    data,
  });
}

async function main() {
  const mintAddress = process.argv[2];
  const execute = process.argv.includes('--execute');

  if (!mintAddress) {
    console.log('Add Metaplex Metadata to Token');
    console.log('================================');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/add-metaplex-metadata.mjs <mint_address>');
    console.log('  node scripts/add-metaplex-metadata.mjs <mint_address> --execute');
    console.log('');
    console.log('Options:');
    console.log('  --execute    Sign and submit transaction (requires keypair)');
    console.log('');
    console.log('Environment:');
    console.log('  CREATOR_KEYPAIR_PATH - Path to creator keypair JSON (for --execute)');
    process.exit(1);
  }

  console.log('🎨 Add Metaplex Metadata');
  console.log('========================');
  console.log('');

  const connection = new Connection(RPC_URL, 'confirmed');
  const mintPubkey = new PublicKey(mintAddress);

  // Check if metadata already exists
  const metadataPDA = getMetadataPDA(mintPubkey);
  console.log(`Metadata PDA: ${metadataPDA.toBase58()}`);

  const metadataAccount = await connection.getAccountInfo(metadataPDA);
  if (metadataAccount) {
    console.log('✓ Metaplex metadata already exists for this token!');
    console.log(`  View: https://solscan.io/account/${metadataPDA.toBase58()}`);
    process.exit(0);
  }

  console.log('No metadata account found. Creating...');
  console.log('');

  // Get token info from database
  const sql = neon(process.env.DATABASE_URL_8XM);
  const launches = await sql`
    SELECT * FROM token_launches WHERE token_mint = ${mintAddress}
  `;

  if (launches.length === 0) {
    console.log('❌ Token not found in database. Cannot determine metadata.');
    process.exit(1);
  }

  const launch = launches[0];
  console.log(`Token: ${launch.name} ($${launch.symbol})`);
  console.log(`Creator: ${launch.creator_wallet}`);
  console.log('');

  // Upload metadata JSON to IPFS
  let metadataUri = launch.image_url || '';

  const pinataJwt = process.env.PINATA_JWT;
  if (pinataJwt) {
    console.log('Uploading metadata JSON to IPFS...');

    const metadata = {
      name: launch.name,
      symbol: launch.symbol,
      description: launch.description || `${launch.name} - A Quillverse Nation Token`,
      image: launch.image_url || '',
      external_url: 'https://8xm.fun',
      attributes: [
        { trait_type: 'Nation', value: launch.nation_name || 'Unknown' },
        { trait_type: 'TEK8 Guild', value: launch.tek8_guild || 'Unaffiliated' },
        { trait_type: 'Platform', value: '8xM Quillverse' },
      ],
      properties: {
        category: 'token',
        creators: [{ address: launch.creator_wallet, share: 100 }],
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
          pinataMetadata: { name: `${launch.symbol}-metadata.json` },
        }),
      });

      const data = await res.json();
      if (data.IpfsHash) {
        const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
        metadataUri = `https://${gateway}/ipfs/${data.IpfsHash}`;
        console.log(`✓ Uploaded: ${metadataUri}`);
      }
    } catch (error) {
      console.log('⚠️  IPFS upload failed, using image URL as fallback');
    }
  }

  console.log('');
  console.log('Building transaction...');

  // Build the create metadata instruction
  const creatorPubkey = new PublicKey(launch.creator_wallet);

  const createMetadataIx = createMetadataAccountV3Instruction(
    metadataPDA,
    mintPubkey,
    creatorPubkey, // mint authority
    creatorPubkey, // payer
    creatorPubkey, // update authority
    launch.name,
    launch.symbol,
    metadataUri,
    Math.floor((launch.royalty_config?.feePercent || 0) * 100),
    [
      {
        address: launch.creator_wallet,
        verified: false, // Will be false since we can't sign as creator
        share: 100,
      },
    ]
  );

  const transaction = new Transaction().add(createMetadataIx);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = creatorPubkey;

  console.log('✓ Transaction built');
  console.log('');

  if (execute) {
    // Execute mode - sign and submit
    const keypairPath = process.env.CREATOR_KEYPAIR_PATH;
    if (!keypairPath) {
      console.log('❌ CREATOR_KEYPAIR_PATH not set. Cannot execute.');
      console.log('Set it to the path of the creator wallet keypair JSON file.');
      process.exit(1);
    }

    try {
      const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      const creatorKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

      if (creatorKeypair.publicKey.toBase58() !== creatorPubkey.toBase58()) {
        console.log('❌ Keypair does not match creator wallet!');
        console.log(`  Expected: ${creatorPubkey.toBase58()}`);
        console.log(`  Got: ${creatorKeypair.publicKey.toBase58()}`);
        process.exit(1);
      }

      console.log('Signing and submitting...');
      const signature = await sendAndConfirmTransaction(connection, transaction, [creatorKeypair]);

      console.log('');
      console.log('🎉 SUCCESS!');
      console.log(`Transaction: ${signature}`);
      console.log(`View: https://solscan.io/tx/${signature}`);
      console.log('');
      console.log('Token should now display with name and image in wallets!');

    } catch (error) {
      console.log('❌ Transaction failed:', error.message);
      process.exit(1);
    }
  } else {
    // Output mode - print base64 for manual signing
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    console.log('===== TRANSACTION (Base64) =====');
    console.log('');
    console.log(serialized.toString('base64'));
    console.log('');
    console.log('===== INSTRUCTIONS =====');
    console.log('');
    console.log('To execute this transaction:');
    console.log('');
    console.log('Option 1: Use --execute flag with keypair:');
    console.log(`  CREATOR_KEYPAIR_PATH=/path/to/keypair.json node scripts/add-metaplex-metadata.mjs ${mintAddress} --execute`);
    console.log('');
    console.log('Option 2: Sign with wallet (e.g., using Solana CLI):');
    console.log('  1. Save the base64 above to a file');
    console.log('  2. solana transfer --from <keypair> --sign-only ...');
    console.log('');
    console.log('Option 3: Use a wallet that supports raw transaction signing');
    console.log('');
  }
}

main().catch(console.error);
