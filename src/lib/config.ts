/**
 * 8xM Platform Configuration
 *
 * Provides configurable settings for both standalone and embedded usage.
 * When embedded in other sites, the host can override settings via window.__8XM_CONFIG__
 */

// Extend Window interface for embedded config
declare global {
  interface Window {
    __8XM_CONFIG__?: {
      apiBase?: string;
      rpcUrl?: string;
      theme?: 'dark' | 'light';
      features?: {
        showUnverified?: boolean;
        enableSwap?: boolean;
        enableTerritory?: boolean;
        enableLaunchpad?: boolean;
      };
    };
  }
}

/**
 * Get the API base URL
 * Priority: window config > env var > empty (same origin)
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined' && window.__8XM_CONFIG__?.apiBase) {
    return window.__8XM_CONFIG__.apiBase;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_BASE_URL) {
    return import.meta.env.PUBLIC_API_BASE_URL;
  }
  return '';
}

/**
 * Get the Solana RPC URL
 * Priority: window config > env var > default
 */
export function getRpcUrl(): string {
  if (typeof window !== 'undefined' && window.__8XM_CONFIG__?.rpcUrl) {
    return window.__8XM_CONFIG__.rpcUrl;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SOLANA_RPC_URL) {
    return import.meta.env.PUBLIC_SOLANA_RPC_URL;
  }
  return 'https://api.mainnet-beta.solana.com';
}

/**
 * Get theme preference
 */
export function getTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.__8XM_CONFIG__?.theme) {
    return window.__8XM_CONFIG__.theme;
  }
  return 'dark';
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof NonNullable<Window['__8XM_CONFIG__']>['features']): boolean {
  if (typeof window !== 'undefined' && window.__8XM_CONFIG__?.features) {
    const value = window.__8XM_CONFIG__.features[feature];
    if (typeof value === 'boolean') return value;
  }
  // All features enabled by default
  return true;
}

/**
 * Platform constants
 */
export const PLATFORM = {
  name: '8xM',
  version: '1.0.0',
  description: 'Galactic Cluster Network Launchpad',

  // Core token addresses
  tokens: {
    QLX: '4ag4s7uTViKSG4BjNiYeiuYmazwhzaJy3XUqU3Fg1P9F',
  },

  // Platform fee configuration
  fees: {
    launchFeePercent: 1,
    minLaunchFeeLamports: 10_000_000, // 0.01 SOL
  },

  // Admin configuration - loaded from ADMIN_WALLETS env var
  admin: {
    getWallets: (): string[] => {
      const envWallets = import.meta.env.ADMIN_WALLETS ||
        (typeof process !== 'undefined' && process.env?.ADMIN_WALLETS);
      if (!envWallets) return [];
      return envWallets.split(',').map((w: string) => w.trim()).filter(Boolean);
    },
  },

  // External links
  links: {
    explorer: 'https://solscan.io',
    meteora: 'https://app.meteora.ag',
    website: 'https://8xm.fun',
    quillverse: 'https://quillverse.org',
    quilu: 'https://quilu.xyz',
  },
};

/**
 * TEK8 Guild configuration (Rainbow Roads MMORPG)
 */
export const TEK8_GUILDS = [
  { id: 'D2', name: 'Coin', element: 'Luck', color: 'yellow', binStep: 10 },
  { id: 'D4', name: 'Fire', element: 'Smiths', color: 'red', binStep: 15 },
  { id: 'D6', name: 'Earth', element: 'Grounders', color: 'green', binStep: 20 },
  { id: 'D8', name: 'Air', element: 'Translators', color: 'cyan', binStep: 25 },
  { id: 'D10', name: 'Chaos', element: 'Tricksters', color: 'orange', binStep: 30 },
  { id: 'D12', name: 'Ether', element: 'Assemblers', color: 'purple', binStep: 40 },
  { id: 'D20', name: 'Water', element: 'Healers', color: 'blue', binStep: 50 },
  { id: 'D100', name: 'Order', element: 'Archivists', color: 'white', binStep: 100 },
] as const;

/**
 * Rainbow Roads direction configuration
 */
export const RAINBOW_DIRECTIONS = [
  { id: 'OUT', realm: 'QLX', description: 'Outward expansion' },
  { id: 'UP', realm: 'QLY', description: 'Upward growth' },
  { id: 'DWN', realm: 'QLY', description: 'Downward depth' },
  { id: 'U45', realm: 'QLZ', description: 'Upward diagonal' },
  { id: 'D45', realm: 'QLZ', description: 'Downward diagonal' },
] as const;

/**
 * Verification status types
 */
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'flagged' | 'rejected';

export const VERIFICATION_LABELS: Record<VerificationStatus, { label: string; color: string }> = {
  pending: { label: 'Unverified', color: 'yellow' },
  under_review: { label: 'Under Review', color: 'blue' },
  verified: { label: 'Verified', color: 'green' },
  flagged: { label: 'Flagged', color: 'red' },
  rejected: { label: 'Rejected', color: 'gray' },
};
