/**
 * 8xM Launchpad Library
 *
 * Token launch with Meteora DLMM integration for instant liquidity.
 * Inspired by the Aping Challenge from Meteora.
 *
 * Flow:
 * 1. User creates token metadata
 * 2. Token is minted on Solana
 * 3. Liquidity pool created on Meteora DLMM
 * 4. User can "Ape In" - add liquidity with one click
 * 5. LP tokens tracked for rewards/competitions
 */

export interface TokenLaunchParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  totalSupply: number;
  decimals?: number;
  creatorWallet: string;

  // Liquidity params
  initialSolLiquidity?: number; // SOL to pair with token
  tokenLiquidityPercent?: number; // % of supply for initial liquidity

  // Platform fees
  platformFeePercent?: number; // Fee for platform (default 1%)

  // GCN Integration
  roadId?: string;
  tek8Guild?: string;
  nationName?: string;
}

export interface PoolConfig {
  tokenMint: string;
  quoteMint: string; // Usually SOL or USDC
  binStep: number; // Price precision (e.g., 10, 25, 100 basis points)
  baseFeeBps: number; // Base fee in basis points
  activationType: 'slot' | 'timestamp';
  activationPoint?: number;
}

export interface ApeInParams {
  poolAddress: string;
  walletAddress: string;
  solAmount: number;
  slippageBps?: number; // Default 100 (1%)
}

// TEK8 Guild to Meteora bin step mapping
// Higher volatility elements = wider bins
export const GUILD_BIN_STEPS: Record<string, number> = {
  'D2': 25,   // Coin - moderate volatility
  'D4': 50,   // Fire - high volatility
  'D6': 15,   // Earth - stable
  'D8': 30,   // Air - moderate-high
  'D10': 100, // Chaos - extreme volatility
  'D12': 20,  // Ether - balanced
  'D20': 25,  // Water - flowing
  'D100': 10, // Order - very stable
};

// Element to strategy type mapping for Meteora
export const GUILD_STRATEGIES: Record<string, 'Spot' | 'Curve' | 'BidAsk'> = {
  'D2': 'Spot',
  'D4': 'BidAsk',  // Aggressive
  'D6': 'Curve',   // Conservative
  'D8': 'Spot',
  'D10': 'BidAsk', // Volatile
  'D12': 'Spot',
  'D20': 'Curve',
  'D100': 'Curve', // Stable
};

// Platform commission wallet
export const PLATFORM_WALLET = 'E3LzzoqMggnVa7zPdt9wCTKTyWqSvFudeMKpqTmaQgQj';
export const MIN_PLATFORM_FEE_LAMPORTS = 10_000_000; // 0.01 SOL minimum
export const DEFAULT_PLATFORM_FEE_PERCENT = 1;

// Recommended supply tiers based on realm
export const REALM_SUPPLY_TIERS = {
  QLX: { min: 100_000_000, recommended: 1_000_000_000, max: 10_000_000_000 },
  QLY: { min: 500_000_000, recommended: 5_000_000_000, max: 50_000_000_000 },
  QLZ: { min: 1_000_000_000, recommended: 10_000_000_000, max: 100_000_000_000 },
};

// Commons Treasury deposit requirements
export function calculateTreasuryDeposit(supply: number): number {
  const percentDeposit = Math.floor(supply * 0.01); // 1%
  const minDeposit = 1_000_000; // 1M tokens minimum
  return Math.max(percentDeposit, minDeposit);
}

// Calculate initial liquidity allocation
export function calculateLiquidityAllocation(
  totalSupply: number,
  liquidityPercent: number = 10
): { liquidityTokens: number; creatorTokens: number; treasuryTokens: number } {
  const treasuryTokens = calculateTreasuryDeposit(totalSupply);
  const liquidityTokens = Math.floor(totalSupply * (liquidityPercent / 100));
  const creatorTokens = Math.floor(totalSupply - liquidityTokens - treasuryTokens);

  return {
    liquidityTokens,
    creatorTokens,
    treasuryTokens,
  };
}

// Generate Meteora pool config based on TEK8 guild
export function generatePoolConfig(
  tokenMint: string,
  guild: string,
  customBinStep?: number
): Partial<PoolConfig> {
  const binStep = customBinStep || GUILD_BIN_STEPS[guild] || 25;
  const strategy = GUILD_STRATEGIES[guild] || 'Spot';

  return {
    tokenMint,
    quoteMint: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    binStep,
    baseFeeBps: Math.max(10, Math.floor(binStep / 2)), // Dynamic fee based on bin step
    activationType: 'slot',
  };
}

// Ape In challenge scoring
export interface ApeInPosition {
  poolAddress: string;
  walletAddress: string;
  depositedSol: number;
  depositedTokens: number;
  lpTokens: number;
  entryPrice: number;
  timestamp: number;
}

export function calculatePositionPnL(
  position: ApeInPosition,
  currentPrice: number,
  currentLpValue: number
): { pnlPercent: number; pnlAbsolute: number } {
  const initialValue = position.depositedSol + (position.depositedTokens * position.entryPrice);
  const currentValue = currentLpValue;
  const pnlAbsolute = currentValue - initialValue;
  const pnlPercent = initialValue > 0 ? (pnlAbsolute / initialValue) * 100 : 0;

  return { pnlPercent, pnlAbsolute };
}

// Meteora DLMM API endpoints
export const METEORA_API = {
  pairs: 'https://dlmm-api.meteora.ag/pair/all',
  pairByAddress: (address: string) => `https://dlmm-api.meteora.ag/pair/${address}`,
  positions: (wallet: string) => `https://dlmm-api.meteora.ag/position/${wallet}`,
};

// Alchemy endpoints for multichain (future)
export const ALCHEMY_CHAINS = {
  solana: {
    mainnet: 'https://solana-mainnet.g.alchemy.com/v2/',
    devnet: 'https://solana-devnet.g.alchemy.com/v2/',
  },
  ethereum: {
    mainnet: 'https://eth-mainnet.g.alchemy.com/v2/',
    sepolia: 'https://eth-sepolia.g.alchemy.com/v2/',
  },
  polygon: {
    mainnet: 'https://polygon-mainnet.g.alchemy.com/v2/',
  },
  base: {
    mainnet: 'https://base-mainnet.g.alchemy.com/v2/',
  },
};

// Launch phases for gamification
export enum LaunchPhase {
  PREPARATION = 'preparation', // Token created, metadata set
  SEEDING = 'seeding',         // Initial liquidity added
  LIVE = 'live',               // Trading active
  GRADUATED = 'graduated',     // Migrated to full AMM
}

export interface LaunchStatus {
  phase: LaunchPhase;
  tokenMint?: string;
  poolAddress?: string;
  totalLiquidity?: number;
  holders?: number;
  volume24h?: number;
  priceChange24h?: number;
  marketCap?: number;
}
