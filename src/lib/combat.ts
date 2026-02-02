/**
 * TEK8 Combat System
 *
 * Dice types map to elements and blockchain functions:
 * D2  (Coin)   - Binary transactions, quick strikes
 * D4  (Fire)   - Gas fees, speed attacks
 * D6  (Earth)  - Staking, defense/shields
 * D8  (Air)    - Liquidity, agility/evasion
 * D10 (Chaos)  - Volatility, critical hits
 * D12 (Ether)  - Smart contracts, processing
 * D20 (Water)  - Network flow, healing
 * D100 (Order) - DAO governance, legendary actions
 */

// Element cycle for advantage/disadvantage
// Fire > Earth > Water > Air > Fire (rock-paper-scissors style)
// Ether and Order are neutral, Chaos is wild, Coin is luck-based
const ELEMENT_CYCLE: Record<string, string> = {
  Fire: 'Earth',   // Fire beats Earth
  Earth: 'Water',  // Earth beats Water
  Water: 'Air',    // Water beats Air
  Air: 'Fire',     // Air beats Fire
  Ether: 'none',   // Neutral
  Order: 'Chaos',  // Order beats Chaos
  Chaos: 'Order',  // Chaos beats Order (mutual)
  Coin: 'none',    // Luck-based
};

const DICE_TO_ELEMENT: Record<string, string> = {
  D2: 'Coin',
  D4: 'Fire',
  D6: 'Earth',
  D8: 'Air',
  D10: 'Chaos',
  D12: 'Ether',
  D20: 'Water',
  D100: 'Order',
};

const ELEMENT_TO_DICE: Record<string, string> = {
  Coin: 'D2',
  Fire: 'D4',
  Earth: 'D6',
  Air: 'D8',
  Chaos: 'D10',
  Ether: 'D12',
  Water: 'D20',
  Order: 'D100',
};

export interface DiceRoll {
  die: string;
  element: string;
  roll: number;
  maxValue: number;
  normalized: number; // 0-1 scale
  critical: boolean;  // Rolled max
  fumble: boolean;    // Rolled 1
}

export interface CombatResult {
  attackerPower: number;
  defenderPower: number;
  attackerRoll: DiceRoll;
  defenderRoll: DiceRoll | null;
  elementalModifier: number;
  winner: 'attacker' | 'defender' | 'pending';
  margin: number;
  narrative: string;
}

/**
 * Roll a TEK8 die
 */
export function rollDie(diceType: string): DiceRoll {
  const maxValues: Record<string, number> = {
    D2: 2,
    D4: 4,
    D6: 6,
    D8: 8,
    D10: 10,
    D12: 12,
    D20: 20,
    D100: 100,
  };

  const maxValue = maxValues[diceType] || 6;
  const roll = Math.floor(Math.random() * maxValue) + 1;
  const element = DICE_TO_ELEMENT[diceType] || 'Earth';

  return {
    die: diceType,
    element,
    roll,
    maxValue,
    normalized: roll / maxValue,
    critical: roll === maxValue,
    fumble: roll === 1,
  };
}

/**
 * Calculate elemental modifier based on attacker vs defender element
 */
export function getElementalModifier(attackerElement: string, defenderElement: string): number {
  // Same element = neutral
  if (attackerElement === defenderElement) {
    return 1.0;
  }

  // Check if attacker has advantage
  if (ELEMENT_CYCLE[attackerElement] === defenderElement) {
    return 1.25; // 25% bonus
  }

  // Check if defender has advantage (attacker disadvantage)
  if (ELEMENT_CYCLE[defenderElement] === attackerElement) {
    return 0.75; // 25% penalty
  }

  // Chaos is wild - random modifier
  if (attackerElement === 'Chaos' || defenderElement === 'Chaos') {
    return 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  }

  // Coin flip luck
  if (attackerElement === 'Coin') {
    return Math.random() > 0.5 ? 1.5 : 0.5; // Double or half
  }

  // Neutral matchup
  return 1.0;
}

/**
 * Calculate combat power from burned tokens and dice roll
 *
 * Formula: Power = (BurnedTokens × 0.001) + (DiceRoll × 10 × ElementalModifier)
 *
 * Critical hits: 2x dice contribution
 * Fumbles: 0.5x dice contribution
 */
export function calculatePower(
  burnedTokens: number,
  diceRoll: DiceRoll,
  elementalModifier: number = 1.0,
  defenseBonus: number = 0
): number {
  // Base power from burned tokens
  const tokenPower = burnedTokens * 0.001;

  // Dice contribution (normalized to ~0-100 range then scaled)
  let diceContribution = diceRoll.roll * 10;

  // Critical/fumble modifiers
  if (diceRoll.critical) {
    diceContribution *= 2;
  } else if (diceRoll.fumble) {
    diceContribution *= 0.5;
  }

  // Apply elemental modifier
  diceContribution *= elementalModifier;

  // Add defense bonus (for defenders with high defense_level)
  const totalPower = tokenPower + diceContribution + defenseBonus;

  return Math.round(totalPower * 100) / 100;
}

/**
 * Calculate minimum burn required to have a chance against a territory
 */
export function calculateMinimumBurn(defenseLevel: number, totalStaked: number): number {
  // Rough estimate: need at least 10% of defender's staked amount
  // Plus some base amount based on defense level
  const stakeBased = Math.floor(totalStaked * 0.1);
  const defenseBased = defenseLevel * 1000;
  return Math.max(10000, stakeBased, defenseBased); // Minimum 10k tokens
}

/**
 * Resolve a combat between attacker and defender
 */
export function resolveCombat(
  attackerBurn: number,
  defenderBurn: number,
  attackerDiceType: string,
  defenderDiceType: string,
  defenderDefenseLevel: number = 0
): CombatResult {
  // Roll dice
  const attackerRoll = rollDie(attackerDiceType);
  const defenderRoll = rollDie(defenderDiceType);

  // Calculate elemental modifier (attacker's perspective)
  const elementalModifier = getElementalModifier(attackerRoll.element, defenderRoll.element);

  // Calculate powers
  const attackerPower = calculatePower(attackerBurn, attackerRoll, elementalModifier);
  const defenderPower = calculatePower(defenderBurn, defenderRoll, 1.0, defenderDefenseLevel);

  // Determine winner
  const margin = attackerPower - defenderPower;
  const winner = margin > 0 ? 'attacker' : 'defender';

  // Generate narrative
  const narrative = generateCombatNarrative(
    attackerRoll,
    defenderRoll,
    elementalModifier,
    winner,
    margin
  );

  return {
    attackerPower,
    defenderPower,
    attackerRoll,
    defenderRoll,
    elementalModifier,
    winner,
    margin: Math.abs(margin),
    narrative,
  };
}

/**
 * Generate flavor text for combat
 */
function generateCombatNarrative(
  attackerRoll: DiceRoll,
  defenderRoll: DiceRoll,
  modifier: number,
  winner: 'attacker' | 'defender' | 'pending',
  margin: number
): string {
  const parts: string[] = [];

  // Attacker roll description
  if (attackerRoll.critical) {
    parts.push(`Critical ${attackerRoll.element} strike!`);
  } else if (attackerRoll.fumble) {
    parts.push(`${attackerRoll.element} attack falters...`);
  } else {
    parts.push(`${attackerRoll.element} energy surges (${attackerRoll.roll}/${attackerRoll.maxValue}).`);
  }

  // Elemental interaction
  if (modifier > 1.1) {
    parts.push(`${attackerRoll.element} overwhelms ${defenderRoll.element}!`);
  } else if (modifier < 0.9) {
    parts.push(`${defenderRoll.element} resists ${attackerRoll.element}.`);
  }

  // Defender roll description
  if (defenderRoll.critical) {
    parts.push(`Defender counters with critical ${defenderRoll.element}!`);
  } else if (defenderRoll.fumble) {
    parts.push(`Defense crumbles...`);
  }

  // Result
  if (winner === 'attacker') {
    if (margin > 100) {
      parts.push('DEVASTATING VICTORY! Territory conquered!');
    } else if (margin > 50) {
      parts.push('Decisive victory! The territory falls.');
    } else {
      parts.push('Close battle, but attackers prevail.');
    }
  } else {
    if (margin > 100) {
      parts.push('CRUSHING DEFENSE! Invaders routed!');
    } else if (margin > 50) {
      parts.push('Strong defense holds the line.');
    } else {
      parts.push('Narrow escape! Territory defended.');
    }
  }

  return parts.join(' ');
}

/**
 * Get the recommended dice type for attacking a territory
 * (based on the territory's dice type and element cycle)
 */
export function getRecommendedAttackDice(territoryDiceType: string): string {
  const defenderElement = DICE_TO_ELEMENT[territoryDiceType];

  // Find element that beats defender
  for (const [attacker, beats] of Object.entries(ELEMENT_CYCLE)) {
    if (beats === defenderElement) {
      return ELEMENT_TO_DICE[attacker];
    }
  }

  // Default to Chaos for unpredictable attacks
  return 'D10';
}

/**
 * Calculate defense deadline (24 hours from attack initiation)
 */
export function getDefenseDeadline(attackTime: Date = new Date()): Date {
  const deadline = new Date(attackTime);
  deadline.setHours(deadline.getHours() + 24);
  return deadline;
}

/**
 * Check if defense deadline has passed
 */
export function isDefenseExpired(deadline: Date | string): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return new Date() > deadlineDate;
}

// Export constants for use in UI
export const ELEMENTS = Object.keys(ELEMENT_CYCLE);
export const DICE_TYPES = Object.keys(DICE_TO_ELEMENT);
export { DICE_TO_ELEMENT, ELEMENT_TO_DICE, ELEMENT_CYCLE };
