import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

/**
 * TEK8 Guild Assessment Quiz
 *
 * GET: Returns the quiz questions
 * POST: Submits answers and calculates elemental distribution
 *
 * The quiz determines a player's 360° elemental distribution across
 * the 8 elements/dice: D2 (Coin), D4 (Fire), D6 (Earth), D8 (Air),
 * D10 (Chaos), D12 (Ether), D20 (Water), D100 (Order)
 */

// The 8 Elements and their associated dice/guilds
const ELEMENTS = {
  D2: { name: 'Coin', element: 'Exchange', guild: 'Coinflippers', color: '#FFD700' },
  D4: { name: 'Fire', element: 'Transformation', guild: 'Smiths', color: '#FF4444' },
  D6: { name: 'Earth', element: 'Stability', guild: 'Grounders', color: '#44AA44' },
  D8: { name: 'Air', element: 'Communication', guild: 'Translators', color: '#44DDFF' },
  D10: { name: 'Chaos', element: 'Adaptation', guild: 'Tricksters', color: '#FF8800' },
  D12: { name: 'Ether', element: 'Identity', guild: 'Assemblers', color: '#AA44FF' },
  D20: { name: 'Water', element: 'Flow', guild: 'Healers', color: '#4488FF' },
  D100: { name: 'Order', element: 'Structure', guild: 'Archivists', color: '#FFFFFF' },
};

// Quiz questions - each option maps to an element
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'When facing a difficult problem, your first instinct is to:',
    options: [
      { value: 'D4', text: 'Take immediate action to change it' },
      { value: 'D6', text: 'Wait patiently for clarity' },
      { value: 'D8', text: 'Research and gather information' },
      { value: 'D20', text: 'Feel your way through the emotions' },
    ],
  },
  {
    id: 2,
    question: 'In a group project, you naturally gravitate toward:',
    options: [
      { value: 'D12', text: 'Being the creative visionary' },
      { value: 'D100', text: 'Organizing and planning' },
      { value: 'D10', text: 'Improvising and adapting' },
      { value: 'D2', text: 'Ensuring fair distribution of work' },
    ],
  },
  {
    id: 3,
    question: 'Your ideal way to spend a free day:',
    options: [
      { value: 'D12', text: 'Creating art, music, or writing' },
      { value: 'D6', text: 'Being in nature, gardening, hiking' },
      { value: 'D8', text: 'Learning something new, reading' },
      { value: 'D20', text: 'Connecting deeply with loved ones' },
    ],
  },
  {
    id: 4,
    question: 'When things don\'t go as planned, you:',
    options: [
      { value: 'D10', text: 'See it as an opportunity for something better' },
      { value: 'D4', text: 'Feel frustrated and push harder' },
      { value: 'D100', text: 'Analyze what went wrong systematically' },
      { value: 'D20', text: 'Go with the flow and adapt' },
    ],
  },
  {
    id: 5,
    question: 'The most important quality in a leader is:',
    options: [
      { value: 'D4', text: 'Courage and decisive action' },
      { value: 'D100', text: 'Fairness and consistency' },
      { value: 'D12', text: 'Vision and inspiration' },
      { value: 'D20', text: 'Empathy and understanding' },
    ],
  },
  {
    id: 6,
    question: 'When making decisions about money, you:',
    options: [
      { value: 'D2', text: 'Carefully weigh costs and benefits' },
      { value: 'D6', text: 'Prioritize security and stability' },
      { value: 'D10', text: 'Take calculated risks for growth' },
      { value: 'D4', text: 'Invest in things that excite you' },
    ],
  },
  {
    id: 7,
    question: 'In conversations, you tend to:',
    options: [
      { value: 'D8', text: 'Share ideas and information' },
      { value: 'D20', text: 'Listen and empathize' },
      { value: 'D12', text: 'Tell stories and express yourself' },
      { value: 'D100', text: 'Guide toward solutions' },
    ],
  },
  {
    id: 8,
    question: 'Your relationship with rules is:',
    options: [
      { value: 'D100', text: 'Rules create fairness and should be followed' },
      { value: 'D10', text: 'Rules are suggestions to be creatively interpreted' },
      { value: 'D4', text: 'Rules should be challenged if they\'re unjust' },
      { value: 'D2', text: 'Rules are good when they benefit everyone' },
    ],
  },
  {
    id: 9,
    question: 'When learning something new, you prefer:',
    options: [
      { value: 'D8', text: 'Reading books and taking notes' },
      { value: 'D4', text: 'Jumping in and learning by doing' },
      { value: 'D20', text: 'Having someone teach you personally' },
      { value: 'D10', text: 'Experimenting and figuring it out yourself' },
    ],
  },
  {
    id: 10,
    question: 'What draws you to music?',
    options: [
      { value: 'D12', text: 'The way it expresses the inexpressible' },
      { value: 'D4', text: 'Its energy and power' },
      { value: 'D20', text: 'The emotions it evokes' },
      { value: 'D6', text: 'Its connection to tradition and memory' },
    ],
  },
  {
    id: 11,
    question: 'Your approach to conflict is:',
    options: [
      { value: 'D4', text: 'Address it directly and resolve it' },
      { value: 'D20', text: 'Seek to understand all perspectives' },
      { value: 'D8', text: 'Find a rational compromise' },
      { value: 'D10', text: 'Use humor to defuse tension' },
    ],
  },
  {
    id: 12,
    question: 'What gives you the deepest sense of meaning?',
    options: [
      { value: 'D12', text: 'Creating something lasting' },
      { value: 'D20', text: 'Helping others heal' },
      { value: 'D100', text: 'Building fair systems' },
      { value: 'D6', text: 'Caring for the earth' },
    ],
  },
  {
    id: 13,
    question: 'When stressed, you cope by:',
    options: [
      { value: 'D4', text: 'Physical activity or exercise' },
      { value: 'D8', text: 'Journaling or talking it out' },
      { value: 'D20', text: 'Spending time near water' },
      { value: 'D6', text: 'Grounding in routine and nature' },
    ],
  },
  {
    id: 14,
    question: 'Your greatest strength in a team:',
    options: [
      { value: 'D10', text: 'Bringing unexpected solutions' },
      { value: 'D100', text: 'Keeping everyone on track' },
      { value: 'D12', text: 'Inspiring and motivating others' },
      { value: 'D2', text: 'Ensuring everyone\'s voice is heard' },
    ],
  },
  {
    id: 15,
    question: 'What\'s your relationship with change?',
    options: [
      { value: 'D10', text: 'I thrive on change and uncertainty' },
      { value: 'D6', text: 'I prefer stability but can adapt' },
      { value: 'D4', text: 'I initiate change when needed' },
      { value: 'D20', text: 'I flow with whatever comes' },
    ],
  },
  {
    id: 16,
    question: 'How do you approach spirituality or philosophy?',
    options: [
      { value: 'D12', text: 'Through mystical or transcendent experiences' },
      { value: 'D100', text: 'Through ethical reasoning and principles' },
      { value: 'D6', text: 'Through ancestral traditions' },
      { value: 'D8', text: 'Through study and contemplation' },
    ],
  },
];

// Sacred instrument recommendations by element
const SACRED_INSTRUMENTS = {
  D2: ['Castanets', 'Coin Bells', 'Finger Cymbals'],
  D4: ['Drum', 'Djembe', 'Percussion'],
  D6: ['Bass', 'Cello', 'Didgeridoo'],
  D8: ['Flute', 'Clarinet', 'Saxophone'],
  D10: ['Synthesizer', 'Theremin', 'Electric Guitar'],
  D12: ['Voice', 'Harp', 'Piano'],
  D20: ['Kalimba', 'Hang Drum', 'Ocean Drum'],
  D100: ['Organ', 'Strings', 'Orchestra'],
};

// GET: Return quiz questions
export const GET: APIRoute = async ({ url }) => {
  const wallet = url.searchParams.get('wallet');

  try {
    const sql = getDb();

    // Check if user already has a profile
    let existingProfile = null;
    if (wallet) {
      const profiles = await sql`
        SELECT * FROM tek8_profiles WHERE user_wallet = ${wallet}
      `;
      if (profiles.length > 0) {
        existingProfile = profiles[0];
      }
    }

    return new Response(JSON.stringify({
      success: true,
      questions: QUIZ_QUESTIONS,
      elements: ELEMENTS,
      totalQuestions: QUIZ_QUESTIONS.length,
      existingProfile: existingProfile ? {
        primaryGuild: existingProfile.primary_guild,
        secondaryGuild: existingProfile.secondary_guild,
        elementDistribution: existingProfile.element_distribution,
        sacredInstrument: existingProfile.sacred_instrument,
        completedAt: existingProfile.quiz_completed_at,
      } : null,
      message: existingProfile
        ? 'You already have a profile. Retaking will update your distribution.'
        : 'Answer all questions to discover your elemental affinity.',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('TEK8 quiz GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Submit quiz and calculate elemental distribution
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, answers } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!answers || Object.keys(answers).length < QUIZ_QUESTIONS.length) {
      return new Response(JSON.stringify({
        success: false,
        error: `Please answer all ${QUIZ_QUESTIONS.length} questions`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Count element votes from answers
    const elementCounts: Record<string, number> = {
      D2: 0, D4: 0, D6: 0, D8: 0, D10: 0, D12: 0, D20: 0, D100: 0,
    };

    for (const [questionId, selectedElement] of Object.entries(answers)) {
      if (elementCounts.hasOwnProperty(selectedElement as string)) {
        elementCounts[selectedElement as string]++;
      }
    }

    // Convert counts to 360° distribution
    const totalVotes = Object.values(elementCounts).reduce((a, b) => a + b, 0);
    const elementDistribution: Record<string, number> = {};

    // Base distribution: each element gets minimum 15° (15 * 8 = 120°)
    // Remaining 240° distributed based on quiz answers
    const basePerElement = 15;
    const remainingDegrees = 360 - (basePerElement * 8);

    for (const [element, count] of Object.entries(elementCounts)) {
      const bonusDegrees = totalVotes > 0
        ? Math.round((count / totalVotes) * remainingDegrees)
        : 30; // Even distribution if no answers
      elementDistribution[element] = basePerElement + bonusDegrees;
    }

    // Ensure total is exactly 360° (adjust highest element for rounding)
    const currentTotal = Object.values(elementDistribution).reduce((a, b) => a + b, 0);
    if (currentTotal !== 360) {
      const adjustment = 360 - currentTotal;
      const highestElement = Object.entries(elementDistribution)
        .sort((a, b) => b[1] - a[1])[0][0];
      elementDistribution[highestElement] += adjustment;
    }

    // Find primary and secondary guilds (highest two elements)
    const sortedElements = Object.entries(elementDistribution)
      .sort((a, b) => b[1] - a[1]);
    const primaryGuild = sortedElements[0][0];
    const secondaryGuild = sortedElements[1][0];

    // Recommend sacred instrument based on primary guild
    const instrumentOptions = SACRED_INSTRUMENTS[primaryGuild as keyof typeof SACRED_INSTRUMENTS] || [];
    const recommendedInstrument = instrumentOptions[0] || 'Voice';

    // Find recommended Garu Egg based on primary guild
    const guildToEgg: Record<string, number> = {
      D2: 7,  // Exchange Egg (Coin)
      D4: 1,  // Flare Egg (Fire)
      D6: 2,  // Foundation Egg (Earth)
      D8: 3,  // Whisper Egg (Air)
      D10: 4, // Paradox Egg (Chaos)
      D12: 0, // Echo Egg (Ether)
      D20: 5, // Tide Egg (Water)
      D100: 6, // Balance Egg (Order)
    };
    const recommendedEgg = guildToEgg[primaryGuild] ?? 0;

    // Rainbow Roads associated with primary guild
    const roadDirections = ['OUT', 'UP', 'DWN', 'U45', 'D45'];
    const recommendedRoads = roadDirections.map(dir => `${primaryGuild}${dir}`);

    const sql = getDb();

    // Upsert profile
    await sql`
      INSERT INTO tek8_profiles (
        user_wallet,
        primary_guild,
        secondary_guild,
        sacred_instrument,
        element_distribution,
        quiz_answers,
        quiz_completed_at,
        updated_at
      ) VALUES (
        ${walletAddress},
        ${primaryGuild},
        ${secondaryGuild},
        ${recommendedInstrument},
        ${JSON.stringify(elementDistribution)},
        ${JSON.stringify(answers)},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_wallet) DO UPDATE SET
        primary_guild = EXCLUDED.primary_guild,
        secondary_guild = EXCLUDED.secondary_guild,
        element_distribution = EXCLUDED.element_distribution,
        quiz_answers = EXCLUDED.quiz_answers,
        quiz_completed_at = EXCLUDED.quiz_completed_at,
        updated_at = EXCLUDED.updated_at
    `;

    return new Response(JSON.stringify({
      success: true,
      profile: {
        primaryGuild,
        secondaryGuild,
        primaryElement: ELEMENTS[primaryGuild as keyof typeof ELEMENTS],
        secondaryElement: ELEMENTS[secondaryGuild as keyof typeof ELEMENTS],
        elementDistribution,
        sacredInstrument: recommendedInstrument,
        instrumentOptions,
      },
      recommendations: {
        garuEgg: recommendedEgg,
        garuEggName: ['Echo', 'Flare', 'Foundation', 'Whisper', 'Paradox', 'Tide', 'Balance', 'Exchange'][recommendedEgg] + ' Egg',
        sacredInstruments: instrumentOptions,
        roads: recommendedRoads,
      },
      message: `Welcome to the ${ELEMENTS[primaryGuild as keyof typeof ELEMENTS].guild}! Your primary element is ${ELEMENTS[primaryGuild as keyof typeof ELEMENTS].name} (${primaryGuild}).`,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('TEK8 quiz POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
