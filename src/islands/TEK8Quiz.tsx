import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Question {
  id: number;
  question: string;
  options: { value: string; text: string }[];
}

interface QuizResult {
  primaryGuild: string;
  secondaryGuild: string;
  primaryElement: { name: string; element: string; guild: string; color: string };
  secondaryElement: { name: string; element: string; guild: string; color: string };
  elementDistribution: Record<string, number>;
  sacredInstrument: string;
  instrumentOptions: string[];
}

interface Recommendations {
  garuEgg: number;
  garuEggName: string;
  sacredInstruments: string[];
  roads: string[];
}

const ELEMENT_COLORS: Record<string, string> = {
  D2: 'from-yellow-500 to-amber-600',
  D4: 'from-red-500 to-orange-600',
  D6: 'from-green-500 to-emerald-600',
  D8: 'from-cyan-500 to-blue-500',
  D10: 'from-orange-500 to-red-500',
  D12: 'from-purple-500 to-violet-600',
  D20: 'from-blue-500 to-indigo-600',
  D100: 'from-gray-300 to-white',
};

const ELEMENT_NAMES: Record<string, string> = {
  D2: 'Coin',
  D4: 'Fire',
  D6: 'Earth',
  D8: 'Air',
  D10: 'Chaos',
  D12: 'Ether',
  D20: 'Water',
  D100: 'Order',
};

function TEK8QuizInner() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const url = publicKey
          ? `/api/tek8/quiz?wallet=${publicKey.toBase58()}`
          : '/api/tek8/quiz';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions);
          if (data.existingProfile) {
            setExistingProfile(data.existingProfile);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (mounted) fetchQuiz();
  }, [mounted, publicKey]);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tek8/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          answers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.profile);
        setRecommendations(data.recommendations);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎲</div>
        <p className="text-gray-400">Loading TEK8 Quiz...</p>
      </div>
    );
  }

  // Show existing profile
  if (existingProfile && !result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎲</div>
          <h1 className="text-3xl font-bold">Your TEK8 Profile</h1>
          <p className="text-gray-400 mt-2">You've already discovered your elemental affinity</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Primary: {existingProfile.primaryGuild}</h2>
              <p className="text-gray-400">{ELEMENT_NAMES[existingProfile.primaryGuild]}</p>
            </div>
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${ELEMENT_COLORS[existingProfile.primaryGuild]} flex items-center justify-center text-2xl font-bold`}>
              {existingProfile.primaryGuild}
            </div>
          </div>

          {/* Element Distribution Wheel */}
          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-3">Your 360° Distribution</h3>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(existingProfile.elementDistribution || {}).map(([element, degrees]) => (
                <div key={element} className="text-center p-2 rounded bg-gray-800">
                  <div className={`text-sm font-bold bg-gradient-to-r ${ELEMENT_COLORS[element]} bg-clip-text text-transparent`}>
                    {element}
                  </div>
                  <div className="text-lg font-bold">{degrees as number}°</div>
                  <div className="text-xs text-gray-500">{ELEMENT_NAMES[element]}</div>
                </div>
              ))}
            </div>
          </div>

          {existingProfile.sacredInstrument && (
            <div className="mt-4 p-3 bg-purple-900/30 rounded-lg">
              <span className="text-purple-400 text-sm">Sacred Instrument:</span>
              <span className="ml-2 font-bold">{existingProfile.sacredInstrument}</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => setExistingProfile(null)}
            className="btn bg-purple-600 hover:bg-purple-500"
          >
            Retake Quiz
          </button>
          <p className="text-xs text-gray-500 mt-2">Retaking will update your profile</p>
        </div>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold">
            Welcome to the {result.primaryElement.guild}!
          </h1>
          <p className="text-gray-400 mt-2">
            Your primary element is <span className="text-white font-bold">{result.primaryElement.name}</span>
          </p>
        </div>

        {/* Primary Element Card */}
        <div className={`bg-gradient-to-br ${ELEMENT_COLORS[result.primaryGuild]} p-1 rounded-xl mb-6`}>
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{result.primaryGuild}</h2>
                <p className="text-lg text-gray-300">{result.primaryElement.name}</p>
                <p className="text-sm text-gray-500">{result.primaryElement.element}</p>
              </div>
              <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${ELEMENT_COLORS[result.primaryGuild]} flex items-center justify-center text-3xl font-bold`}>
                {result.primaryGuild}
              </div>
            </div>
          </div>
        </div>

        {/* Element Distribution */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Your 360° Element Distribution</h3>
          <div className="space-y-2">
            {Object.entries(result.elementDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([element, degrees]) => (
                <div key={element} className="flex items-center gap-3">
                  <div className="w-12 text-sm font-bold">{element}</div>
                  <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${ELEMENT_COLORS[element]} rounded-full transition-all duration-1000`}
                      style={{ width: `${(degrees / 360) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right">{degrees}°</div>
                </div>
              ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Total: 360° (your complete elemental nature)
          </p>
        </div>

        {/* Recommendations */}
        {recommendations && (
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Your Path Forward</h3>

            <div className="space-y-4">
              <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <h4 className="font-bold text-purple-400">Recommended Garu Egg</h4>
                <p className="text-xl mt-1">{recommendations.garuEggName}</p>
                <a
                  href={`/journey/egg/${recommendations.garuEgg}`}
                  className="btn bg-purple-600 hover:bg-purple-500 mt-3 inline-block text-sm"
                >
                  Begin This Journey
                </a>
              </div>

              <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <h4 className="font-bold text-blue-400">Sacred Instruments</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recommendations.sacredInstruments.map((inst) => (
                    <span key={inst} className="px-3 py-1 bg-blue-900/50 rounded-full text-sm">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                <h4 className="font-bold text-green-400">Rainbow Roads</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recommendations.roads.map((road) => (
                    <a
                      key={road}
                      href={`/roads?road=${road}`}
                      className="px-3 py-1 bg-green-900/50 rounded-full text-sm hover:bg-green-800 transition"
                    >
                      {road}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <a href="/journey" className="btn bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-lg px-8">
            Continue to Journey Hub
          </a>
        </div>
      </div>
    );
  }

  // Quiz in progress
  const currentQ = questions[currentQuestion];
  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎲</div>
        <h1 className="text-3xl font-bold">TEK8 Guild Assessment</h1>
        <p className="text-gray-400 mt-2">Discover your elemental affinity across the 8 dimensions</p>
      </div>

      {!connected && (
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-4">Connect your wallet to save your profile</p>
          <WalletMultiButton />
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {currentQ && (
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">{currentQ.question}</h2>

          <div className="space-y-3">
            {currentQ.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQ.id, option.value)}
                className={`w-full p-4 rounded-lg text-left transition border-2 ${
                  answers[currentQ.id] === option.value
                    ? `border-purple-500 bg-purple-900/30 ${ELEMENT_COLORS[option.value] ? 'ring-2 ring-purple-500' : ''}`
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    answers[currentQ.id] === option.value
                      ? `bg-gradient-to-br ${ELEMENT_COLORS[option.value]}`
                      : 'bg-gray-700'
                  }`}>
                    {option.value}
                  </div>
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          className="btn bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
        >
          ← Previous
        </button>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!answers[currentQ?.id]}
            className="btn bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(answers).length < questions.length || !connected}
            className="btn bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50"
          >
            {loading ? 'Calculating...' : '✨ Reveal My Elements'}
          </button>
        )}
      </div>

      {/* Element preview (answered so far) */}
      {Object.keys(answers).length > 0 && (
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Elements selected so far:</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(answers).map((element, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full text-sm bg-gradient-to-r ${ELEMENT_COLORS[element]} font-bold`}
              >
                {element}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TEK8Quiz() {
  return (
    <WalletProvider>
      <TEK8QuizInner />
    </WalletProvider>
  );
}
