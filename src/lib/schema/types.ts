/**
 * 8xM Platform Type Definitions
 *
 * Core types for the Quillverse Rainbow Roads Game Jam platform.
 * Consolidated from CJSR_Good and qtx projects.
 */

// ============================================
// CORE TYPES
// ============================================

/** Token realms in the Quillverse trinity + GCN entries */
export type TokenRealm = 'QLX' | 'QLY' | 'QLZ' | 'GCN';

/** Rainbow Roads directions */
export type RoadDirection = 'OUT' | 'UP' | 'DWN' | 'U45' | 'D45';

/** TEK8 Dice types for roads */
export type DiceType = 'D2' | 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

/** Stewardship levels in the community */
export type StewardshipLevel = 'stranger' | 'associate' | 'champion' | 'elder' | 'steward';

/** Token launch phases */
export type LaunchPhase = 'pending_signature' | 'preparation' | 'seeding' | 'live' | 'graduated' | 'cancelled' | 'failed';

/** Verification statuses */
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'flagged' | 'rejected';

/** Territory status */
export type TerritoryStatus = 'unclaimed' | 'claimed' | 'contested' | 'fortified';

/** Alliance types */
export type AllianceType = 'trade' | 'defense' | 'non_aggression' | 'full_alliance';

// ============================================
// TOKEN TYPES
// ============================================

export interface Token {
  id: number;
  mint_address: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: number;
  creator_wallet: string;
  realm: TokenRealm;
  description?: string;
  image_uri?: string;
  metadata_uri?: string;
  is_core_token: boolean;
  is_gcn_entry: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TokenLaunch {
  id: number;
  creator_wallet: string;
  name: string;
  symbol: string;
  description?: string;
  image_url?: string;
  total_supply: number;
  decimals: number;
  liquidity_tokens?: number;
  creator_tokens?: number;
  treasury_tokens?: number;
  initial_sol_liquidity?: number;
  platform_fee_lamports?: number;
  bin_step?: number;
  tek8_guild?: DiceType;
  road_id?: string;
  nation_name?: string;
  phase: LaunchPhase;
  token_mint?: string;
  pool_address?: string;
  metadata_uri?: string;
  creator_royalty_percent?: number;
  distribute_to_holders?: boolean;
  creator_share_of_royalties?: number;
  // Verification
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_at?: Date;
  verified_by?: string;
  is_featured: boolean;
  // Timestamps
  created_at: Date;
  live_at?: Date;
  graduated_at?: Date;
}

// ============================================
// SWAP & RECIPROCITY TYPES
// ============================================

export interface ReciprocityPool {
  id: number;
  token_id: number;
  mint_address: string;
  deposited_amount: number;
  available_amount: number;
  total_swaps_in: number;
  total_swaps_out: number;
  initial_deposit_tx?: string;
  depositor_wallet: string;
  created_at: Date;
  updated_at: Date;
}

export interface Swap {
  id: number;
  from_token_id: number;
  to_token_id: number;
  from_mint: string;
  to_mint: string;
  amount: number;
  user_wallet: string;
  user_id?: number;
  tx_signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
  direction: 'qlx_to_gcn' | 'gcn_to_qlx';
  created_at: Date;
  confirmed_at?: Date;
}

// ============================================
// GCN & NATION TYPES
// ============================================

export interface GcnEntry {
  id: number;
  token_id: number;
  mint_address: string;
  road_id: string;
  dice_type: DiceType;
  direction: RoadDirection;
  nation_name: string;
  soul_description: string;
  creator_wallet: string;
  creator_user_id?: number;
  status: 'submitted' | 'approved' | 'finalist' | 'winner' | 'canon';
  stewardship_level: StewardshipLevel;
  judge_scores?: string;
  final_ranking?: number;
  is_canon: boolean;
  submitted_at: Date;
  approved_at?: Date;
  canon_at?: Date;
}

export interface Nation {
  id: number;
  gcn_entry_id?: number;
  mint_address?: string;
  name: string;
  emoji?: string;
  flag_uri?: string;
  founder_wallet: string;
  total_territory_count: number;
  total_staked: string;
  defense_bonus: number;
  created_at: Date;
}

// ============================================
// TERRITORY TYPES
// ============================================

export interface Territory {
  id: number;
  road_id: string;
  dice_type: DiceType;
  direction: RoadDirection;
  realm: TokenRealm;
  grid_x: number;
  grid_y: number;
  status: TerritoryStatus;
  defense_level: number;
  total_staked: string;
  claimed_at?: Date;
  last_contested_at?: Date;
  nation_id?: number;
}

export interface TerritoryStake {
  id: number;
  territory_id: number;
  staker_wallet: string;
  nation_id?: number;
  amount: string;
  locked_until?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface TerritoryContest {
  id: number;
  territory_id: number;
  attacker_nation_id: number;
  defender_nation_id?: number;
  tokens_burned_attack: string;
  tokens_burned_defense: string;
  attack_dice_roll?: object;
  defense_dice_roll?: object;
  attack_power?: number;
  defense_power?: number;
  status: 'pending' | 'active' | 'resolved' | 'expired';
  winner_nation_id?: number;
  defense_deadline?: Date;
  resolved_at?: Date;
  created_at: Date;
}

export interface Alliance {
  id: number;
  proposer_nation_id: number;
  target_nation_id: number;
  alliance_type: AllianceType;
  terms?: object;
  status: 'proposed' | 'accepted' | 'rejected' | 'expired' | 'broken';
  proposed_at: Date;
  accepted_at?: Date;
  expires_at?: Date;
}

// ============================================
// METAPHYSICS TYPES
// ============================================

export interface MetaphysicsIndex {
  id: number;
  token_id: number;
  mint_address: string;
  total_qlx_inflow: number;
  total_qlx_outflow: number;
  net_qlx_flow: number;
  life_force_score: number;
  vitality_index: number;
  permanence_score: number;
  swap_count_24h: number;
  swap_count_7d: number;
  swap_count_total: number;
  unique_swappers: number;
  last_swap_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// APPLICATION TYPES
// ============================================

export interface GcnApplication {
  id: number;
  creator_wallet: string;
  nation_name: string;
  token_symbol: string;
  email?: string;
  soul_description?: string;
  pillar_music?: string;
  pillar_business?: string;
  pillar_technology?: string;
  road_id?: string;
  instrument_id?: string;
  status: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'interview_scheduled';
  reviewer_notes?: string;
  video_interview_completed: boolean;
  video_interview_url?: string;
  video_interview_scheduled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: number;
  user_wallet: string;
  type: string;
  title: string;
  message?: string;
  data?: object;
  is_read: boolean;
  created_at: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateTokenRequest {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  totalSupply: number;
  decimals?: number;
  initialSolLiquidity?: number;
  tokenLiquidityPercent?: number;
  tek8Guild?: DiceType;
  roadId?: string;
  nationName: string;
  creatorWallet: string;
  // Social links
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  // Royalties
  creatorRoyaltyPercent?: number;
  distributeToHolders?: boolean;
  creatorShareOfRoyalties?: number;
}

export interface SwapRequest {
  fromMint: string;
  toMint: string;
  amount: number;
  userWallet: string;
}

export interface GcnEntryRequest {
  tokenAddress: string;
  roadId: string;
  nationName: string;
  soulDescription: string;
}

export interface AdminTokenAction {
  tokenId: number;
  action: 'start_review' | 'verify' | 'flag' | 'reject' | 'feature' | 'unfeature' | 'reset' | 'add_notes';
  walletAddress: string;
  notes?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

/** Road ID format: D{dice}{direction} e.g., D12U45, D20OUT */
export type RoadId = `D${DiceType}${RoadDirection}` | string;

/** Helper to parse road ID into components */
export function parseRoadId(roadId: string): { dice: DiceType; direction: RoadDirection } | null {
  const match = roadId.match(/^D(2|4|6|8|10|12|20|100)(OUT|UP|DWN|U45|D45)$/);
  if (!match) return null;
  return {
    dice: `D${match[1]}` as DiceType,
    direction: match[2] as RoadDirection,
  };
}

/** Dice type to bin step mapping for Meteora DLMM pools */
export const DICE_BIN_STEPS: Record<DiceType, number> = {
  D2: 10,
  D4: 15,
  D6: 20,
  D8: 25,
  D10: 30,
  D12: 40,
  D20: 50,
  D100: 100,
};

/** Direction to realm mapping */
export const DIRECTION_REALMS: Record<RoadDirection, TokenRealm> = {
  OUT: 'QLX',
  UP: 'QLY',
  DWN: 'QLY',
  U45: 'QLZ',
  D45: 'QLZ',
};
