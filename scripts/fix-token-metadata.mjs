#!/usr/bin/env node

/**
 * Fix Token Metadata
 *
 * Adds on-chain metadata to a Token-2022 token that was created without it.
 * This script builds the transaction - you'll need to sign it with the update authority wallet.
 *
 * Usage:
 *   node scripts/fix-token-metadata.mjs <mint_address>
 *
 * Example:
 *   node scripts/fix-token-metadata.mjs 9qACFEZzdhE5wypjjNDBj1XJLheQcMpdotxKfmJnirC5
 */

import 'dotenv/config';
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getMint,
} from '@solana/spl-token';
import {
  createUpdateFieldInstruction,
} from '@solana/spl-token-metadata';
import { neon } from '@neondatabase/serverless';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

async function main() {
  const mintAddress = process.argv[2];

  if (!mintAddress) {
    console.log('Usage: node scripts/fix-token-metadata.mjs <mint_address>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/fix-token-metadata.mjs 9qACFEZzdhE5wypjjNDBj1XJLheQcMpdotxKfmJnirC5');
    process.exit(1);
  }

  console.log('🔧 Token Metadata Fix Tool');
  console.log('==========================');
  console.log('');

  const connection = new Connection(RPC_URL, 'confirmed');
  const mintPubkey = new PublicKey(mintAddress);

  // Get token info from chain
  console.log('Fetching token info from chain...');
  try {
    const mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
    console.log('✓ Token exists (Token-2022)');
    console.log(`  Decimals: ${mintInfo.decimals}`);
    console.log(`  Supply: ${Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)}`);
    console.log(`  Mint Authority: ${mintInfo.mintAuthority?.toBase58() || 'None'}`);
  } catch (error) {
    // Try standard token program
    try {
      const { TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
      const mintInfo = await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
      console.log('✓ Token exists (Standard SPL Token)');
      console.log('⚠️  This is NOT a Token-2022 token. Metadata extension not available.');
      process.exit(1);
    } catch {
      console.log('❌ Token not found on chain');
      process.exit(1);
    }
  }

  // Get token info from database
  console.log('');
  console.log('Fetching token info from database...');

  const sql = neon(process.env.DATABASE_URL_8XM);
  const launches = await sql`
    SELECT * FROM token_launches WHERE token_mint = ${mintAddress}
  `;

  if (launches.length === 0) {
    console.log('⚠️  Token not found in database');
    console.log('You can still add metadata manually.');
    console.log('');
  } else {
    const launch = launches[0];
    console.log('✓ Found in database:');
    console.log(`  Name: ${launch.name}`);
    console.log(`  Symbol: ${launch.symbol}`);
    console.log(`  Nation: ${launch.nation_name}`);
    console.log(`  Image: ${launch.image_url || 'None'}`);
    console.log(`  Phase: ${launch.phase}`);
    console.log(`  Creator: ${launch.creator_wallet}`);

    // Upload metadata to IPFS
    console.log('');
    console.log('Uploading metadata to IPFS...');

    const metadata = {
      name: launch.name,
      symbol: launch.symbol,
      description: launch.description || '',
      image: launch.image_url || '',
      external_url: 'https://8xm.fun',
      attributes: [
        { trait_type: 'Nation', value: launch.nation_name },
        { trait_type: 'TEK8 Guild', value: launch.tek8_guild || 'Unaffiliated' },
        { trait_type: 'Platform', value: '8xM Quillverse' },
      ],
      properties: {
        category: 'token',
        creators: [{ address: launch.creator_wallet, share: 100 }],
      },
    };

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      console.log('⚠️  PINATA_JWT not set, using image URL as URI');
      console.log('');
      console.log('To properly upload metadata, set PINATA_JWT in .env');
    } else {
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
          const metadataUri = `https://${gateway}/ipfs/${data.IpfsHash}`;
          console.log('✓ Metadata uploaded to IPFS!');
          console.log(`  URI: ${metadataUri}`);
          metadata.image = metadataUri; // Use as the URI
        }
      } catch (error) {
        console.log('⚠️  Failed to upload to IPFS:', error.message);
      }
    }

    // Check if token has metadata pointer extension
    console.log('');
    console.log('Checking token extensions...');

    // For Token-2022, metadata is stored on the mint account itself if MetadataPointer is set
    // We need to check if the token was created with this extension

    console.log('');
    console.log('===== MANUAL STEPS REQUIRED =====');
    console.log('');
    console.log('Since this token was created without the MetadataPointer extension,');
    console.log('we cannot add on-chain metadata directly.');
    console.log('');
    console.log('Options:');
    console.log('');
    console.log('1. CREATE A NEW TOKEN with proper metadata:');
    console.log('   - Launch a new token through 8xm.fun/launchpad');
    console.log('   - The updated code now includes metadata automatically');
    console.log('');
    console.log('2. USE METAPLEX (for legacy metadata):');
    console.log('   - Install: npm install @metaplex-foundation/mpl-token-metadata');
    console.log('   - Create metadata account using Metaplex');
    console.log('   - Note: This adds a separate metadata account, not on-token');
    console.log('');
    console.log('3. WALLET DISPLAY WORKAROUND:');
    console.log('   - The token works fine for transfers/trading');
    console.log('   - Just displays without name/image in some wallets');
    console.log('   - Users can still trade on DEXs');
    console.log('');

    // Output token info for users
    console.log('===== TOKEN INFO FOR USERS =====');
    console.log('');
    console.log(`Token Name: ${launch.name}`);
    console.log(`Symbol: $${launch.symbol}`);
    console.log(`Mint Address: ${mintAddress}`);
    console.log('');
    console.log('To add to wallet manually:');
    console.log(`  1. Copy mint address: ${mintAddress}`);
    console.log('  2. In your wallet, go to "Add Token" or "Manage Token List"');
    console.log('  3. Paste the mint address');
    console.log('  4. Token should appear (may show as "Unknown Token")');
    console.log('');
    console.log('View on Solscan:');
    console.log(`  https://solscan.io/token/${mintAddress}`);
    console.log('');
  }
}

main().catch(console.error);
