/**
 * @8xm/sdk - Token Launchpad Infrastructure
 *
 * A distributed minting SDK for the Quillverse ecosystem.
 *
 * Architecture:
 * - Core frontend on Cloudflare (8xm.fun) - fast, global
 * - Minting backends on Replit (quillverse.org, paladinking.com, ximura.org)
 * - Shared Neon PostgreSQL database
 *
 * Server usage (Replit backends):
 *   import { MintingService, setupExpressMinting } from '@8xm/sdk/server';
 *
 * Client usage (frontends):
 *   import { Client8xM } from '@8xm/sdk/client';
 */

// Re-export everything
export * from './client';
export * from './server';

// ============================================
// SHARED TYPES
// ============================================

export interface Guild {
  id: number;
  name: string;
  diceType: string;
  element: string;
  maxSlots: number;
  description?: string;
  color?: string;
}

export interface CharacterSlot {
  id: number;
  slotNumber: number;
  guildId: number;
  characterName?: string;
  characterSystem?: 'dice_godz' | 'pathfinder_1e' | 'mnm_3e';
  solanaNftMint?: string;
  pumpFunMint?: string;
  pumpFunStreamKey?: string;
  playerWallet?: string;
  isActive: boolean;
  primaryRoadId?: string;
}

export interface Cryptofae {
  id: number;
  name: string;
  slotNumber: number;
  element?: string;
  nftMint?: string;
  tokenMint?: string;
  ownerWallet?: string;
  description?: string;
  imageUri?: string;
}

export interface BroadcastSession {
  id: number;
  slotId: number;
  sessionTitle?: string;
  campaignName?: string;
  gameSystem?: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  pumpFunStreamUrl?: string;
  participantSlots: number[];
  peakViewers: number;
  totalViews: number;
}

// ============================================
// CONSTANTS
// ============================================

export const GUILDS = {
  AUDIOMANCERS: { dice: 'd12', element: 'Ether', slots: 144 },
  AEROMANCERS: { dice: 'd8', element: 'Air', slots: 64 },
  PYROMANCERS: { dice: 'd4', element: 'Fire', slots: 216 },
  AQUAMANCERS: { dice: 'd20', element: 'Water', slots: 100 },
  GEOMANCERS: { dice: 'd6', element: 'Earth', slots: 60 },
  CHAMPIONS: { dice: 'd10', element: 'Chaos', slots: 100 },
  ARCHITECTS: { dice: 'd100', element: 'Order', slots: 43 },
} as const;

export const TOTAL_SLOTS = 777;

export const DEFAULT_ENDPOINTS = [
  'https://quillverse.org/api/8xm',
  'https://paladinking.com/api/8xm',
  'https://ximura.org/api/8xm',
];

// ============================================
// VERSION
// ============================================

export const VERSION = '1.0.0';
