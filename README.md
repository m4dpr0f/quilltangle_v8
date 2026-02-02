# 8xM Platform

**Rainbow Roads Token Launchpad for the Quillverse**

Launch tokens, join the Galactic Cluster Network, and weave new worlds in the Rainbow Roads Game Jam.

## What is 8xM?

8xM is an embeddable token creation and trading platform built on Solana. It enables:

- **Token Creation** - Launch SPL tokens with instant Meteora DLMM liquidity
- **Verification System** - Pump.fun-style vetting to protect users from scams
- **Territory Control** - Claim and defend Rainbow Roads in the MMORPG layer
- **Cross-Platform Integration** - Embed widgets in your games, websites, and apps

## Quick Start

### Prerequisites

- Node.js 18+
- A Solana wallet
- [Pinata](https://pinata.cloud) account for IPFS uploads (free tier works)
- [Neon](https://neon.tech) PostgreSQL database (free tier works)

### Installation

```bash
# Clone the repo
git clone https://github.com/quillverse/8xm-app.git
cd 8xm-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Setup

Create a `.env` file with:

```env
# Database (Neon PostgreSQL)
DATABASE_URL_8XM=postgresql://user:pass@host.neon.tech/neondb

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Image Upload (Pinata IPFS)
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=gateway.pinata.cloud

# Admin wallet for token verification
ADMIN_WALLET=YourAdminWalletAddress
```

### Database Setup

```bash
# Run the database setup script
node scripts/setup-database.mjs
```

### Run Locally

```bash
npm run dev
# Open http://localhost:4321
```

### Deploy to Cloudflare

```bash
npm run build
npx wrangler deploy
```

## Integration Guide

### Embedding in Your Website

Add the 8xM widget to any website:

```html
<!-- Load the widget script -->
<script src="https://8xm.fun/embed/8xm-widget.min.js"></script>

<!-- Add the widget -->
<8xm-widget
  mode="discover"
  api-base="https://8xm.fun"
  theme="dark">
</8xm-widget>
```

### Widget Modes

| Mode | Description |
|------|-------------|
| `discover` | Browse verified tokens |
| `launchpad` | Token creation wizard |
| `swap` | Token swap interface |
| `territory` | Territory control map |

### JavaScript Configuration

```javascript
// Configure before loading widgets
window.__8XM_CONFIG__ = {
  apiBase: 'https://8xm.fun',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  theme: 'dark',
  features: {
    showUnverified: false,
    enableSwap: true,
    enableTerritory: true,
    enableLaunchpad: true
  }
};
```

### API Endpoints

All endpoints return JSON with `{ success: boolean, data?, error? }`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/launchpad/create` | GET | List tokens (`?verified=true\|false\|all`) |
| `/api/launchpad/create` | POST | Create new token launch |
| `/api/upload/image` | POST | Upload image to IPFS |
| `/api/territory/claim` | POST | Claim a territory |
| `/api/swap/execute` | POST | Execute token swap |

## Architecture

```
src/
├── islands/           # React components (Astro islands)
│   ├── Launchpad.tsx  # Token creation + discover
│   ├── TerritoryMap.tsx
│   ├── SwapInterface.tsx
│   └── UnverifiedDisclaimer.tsx
├── pages/
│   ├── api/           # API endpoints
│   │   ├── admin/     # Admin token review
│   │   ├── launchpad/ # Token launch APIs
│   │   ├── territory/ # Territory control
│   │   └── upload/    # IPFS upload
│   └── *.astro        # Page routes
├── lib/
│   ├── config.ts      # Platform configuration
│   ├── db.ts          # Database connection
│   └── schema/        # TypeScript types
└── middleware.ts      # CORS handling
```

## Rainbow Roads Game Jam

The 8xM platform powers the Rainbow Roads Game Jam - a collaborative worldbuilding MMORPG where:

1. **Create a Token** - Launch your nation's currency
2. **Claim a Road** - Pick one of 40 Rainbow Roads (8 dice x 5 directions)
3. **Build Your Nation** - Develop lore, art, and community
4. **Compete & Collaborate** - Form alliances, contest territories

### TEK8 Guilds

Each guild has unique characteristics:

| Dice | Guild | Element | Pool Volatility |
|------|-------|---------|-----------------|
| D2 | Coin | Luck | Low |
| D4 | Fire | Smiths | Low-Med |
| D6 | Earth | Grounders | Medium |
| D8 | Air | Translators | Medium |
| D10 | Chaos | Tricksters | Med-High |
| D12 | Ether | Assemblers | High |
| D20 | Water | Healers | High |
| D100 | Order | Archivists | Very High |

### Realms

| Direction | Realm | Focus |
|-----------|-------|-------|
| OUT | QLX | Music & Sound |
| UP/DWN | QLY | Business & Commerce |
| U45/D45 | QLZ | Technology & Code |

## Token Verification

Tokens go through a verification process before being featured:

1. **Pending** - New tokens awaiting review
2. **Under Review** - Being evaluated by admins
3. **Verified** - Approved and prominently displayed
4. **Flagged** - Marked for concern (still tradeable with disclaimer)
5. **Rejected** - Hidden from public listings

Unverified tokens require users to accept a risk disclaimer before viewing.

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at localhost:4321 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `node scripts/setup-database.mjs` | Initialize database |
| `node scripts/add-verification-columns.mjs` | Add verification fields |

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## Links

- **8xM Launchpad**: https://8xm.fun
- **Quillverse**: https://quillverse.org (Quilltangle, Pixie Parable, worldbuilding)
- **QuiLuXYZ Tokens**: https://quilu.xyz

## License

MIT License

---

*Weave new worlds. Join the Quillverse.*
