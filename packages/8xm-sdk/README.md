# @8xm/sdk

Token Launchpad SDK for the Quillverse ecosystem. Distributed architecture with Cloudflare frontend and Replit minting backends.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    8xm.fun (Cloudflare)                     │
│                         Frontend                            │
│                                                             │
│   Uses @8xm/sdk/client to call minting backends             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ quillverse.org│   │paladinking.com│   │  ximura.org   │
│    (Replit)   │   │   (Replit)    │   │   (Replit)    │
│               │   │               │   │               │
│ @8xm/sdk/server│  │ @8xm/sdk/server│  │ @8xm/sdk/server│
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ Neon Database │
                    │  (Shared)     │
                    └───────────────┘
```

## Installation

```bash
npm install @8xm/sdk
```

## Server Setup (Replit backends)

### Express

```javascript
import express from 'express';
import { setupExpressMinting } from '@8xm/sdk/server';

const app = express();
app.use(express.json());

setupExpressMinting(app, {
  config: {
    rpcUrl: process.env.SOLANA_RPC_URL,
    databaseUrl: process.env.DATABASE_URL_8XM,
  },
  basePath: '/api/8xm',
  onLaunchComplete: async (mintAddress, params) => {
    console.log(`Token launched: ${mintAddress}`);
    // Record to database, send notifications, etc.
  }
});

app.listen(3000);
```

### Hono

```javascript
import { Hono } from 'hono';
import { setupHonoMinting } from '@8xm/sdk/server';

const app = new Hono();

setupHonoMinting(app, {
  config: {
    rpcUrl: process.env.SOLANA_RPC_URL,
  },
  basePath: '/api/8xm',
});

export default app;
```

## Client Setup (Frontends)

```javascript
import { Client8xM, signAndSendLaunch } from '@8xm/sdk/client';

const client = new Client8xM({
  endpoints: [
    'https://quillverse.org/api/8xm',
    'https://paladinking.com/api/8xm',
    'https://ximura.org/api/8xm',
  ]
});

// Build launch transaction
const result = await client.launchToken({
  name: 'My Token',
  symbol: 'MTK',
  description: 'A token for my nation',
  imageUrl: 'https://...',
  totalSupply: 1000000000,
  creatorWallet: wallet.publicKey.toString(),
  royaltyPercent: 1, // 1% transfer fee
  nationName: 'My Nation',
  tek8Guild: 'Audiomancers',
});

if (result.success) {
  // Sign with wallet and send
  const signature = await signAndSendLaunch(result, wallet, connection);
  console.log('Token launched:', result.mintAddress);
}
```

## React Hook

```jsx
import { createUse8xMHook } from '@8xm/sdk/client';
import React from 'react';

const use8xM = createUse8xMHook(React);

function LaunchButton() {
  const { launch, isLoading, error } = use8xM({
    endpoints: ['https://quillverse.org/api/8xm']
  });

  const handleLaunch = async () => {
    const result = await launch({
      name: 'My Token',
      symbol: 'MTK',
      // ...
    });
  };

  return (
    <button onClick={handleLaunch} disabled={isLoading}>
      {isLoading ? 'Launching...' : 'Launch Token'}
    </button>
  );
}
```

## API Endpoints

When mounted at `/api/8xm`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/8xm/launch` | POST | Build a token launch transaction |
| `/api/8xm/verify` | POST | Verify a transaction signature |
| `/api/8xm/health` | GET | Health check |

## 777 Guild System

The SDK supports the Quillverse's 777 slot system:

| Guild | Dice | Slots | Role |
|-------|------|-------|------|
| Audiomancers | d12 | 144 | Musicians |
| Aeromancers | d8 | 64 | Gatherers/Travelers |
| Pyromancers | d4 | 216 | Crafters/Merchants |
| Aquamancers | d20 | 100 | Memory Guardians |
| Geomancers | d6 | 60 | Gardeners |
| Champions | d10 | 100 | TTRPG Livestreamers |
| Architects | d100 | 43 | Game Item Guardians |

## License

MIT - TimeKnot Games
