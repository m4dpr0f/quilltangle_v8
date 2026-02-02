/**
 * Example: Drop-in 8xM minting for any Express-based Replit project
 *
 * 1. Copy this file to your Replit project
 * 2. npm install @8xm/sdk express
 * 3. Set SOLANA_RPC_URL in your Replit secrets
 * 4. Import and use in your main server file
 *
 * Your Replit will now serve as a minting backend for 8xm.fun!
 */

const express = require('express');
const cors = require('cors');
const { setupExpressMinting } = require('@8xm/sdk/server');

// Create Express app (or use your existing one)
const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://8xm.fun',
    'https://quillverse.org',
    'https://paladinking.com',
    'https://ximura.org',
    /localhost/,
  ],
  credentials: true,
}));
app.use(express.json());

// Mount 8xM minting SDK
setupExpressMinting(app, {
  config: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    databaseUrl: process.env.DATABASE_URL_8XM,
  },
  basePath: '/api/8xm',

  // Optional: callback when a token is launched
  onLaunchComplete: async (mintAddress, params) => {
    console.log(`🚀 Token launched!`);
    console.log(`   Mint: ${mintAddress}`);
    console.log(`   Name: ${params.name} (${params.symbol})`);
    console.log(`   Creator: ${params.creatorWallet}`);

    // You can save to your own database, send notifications, etc.
    // Example: await db.tokens.create({ mintAddress, ...params });
  }
});

// Your other routes here...
app.get('/', (req, res) => {
  res.json({
    name: 'My Quillverse Project',
    minting: '/api/8xm',
    health: '/api/8xm/health',
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🪙 8xM Minting SDK active at /api/8xm`);
});
