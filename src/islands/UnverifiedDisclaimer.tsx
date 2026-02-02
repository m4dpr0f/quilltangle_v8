import { useState } from 'react';

/**
 * Pump.fun-style Disclaimer Modal for Unverified Tokens
 *
 * Shown when users attempt to view tokens that haven't been vetted
 * by the 8xM team. Requires explicit acceptance before showing.
 */

interface UnverifiedDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
  isOpen: boolean;
}

export default function UnverifiedDisclaimer({
  onAccept,
  onDecline,
  isOpen
}: UnverifiedDisclaimerProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (!agreed) return;

    // Store acceptance in localStorage
    try {
      localStorage.setItem('8xm_disclaimer_accepted', Date.now().toString());
    } catch (e) {
      // localStorage may not be available
    }

    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onDecline}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-red-500/50 rounded-xl max-w-lg w-full mx-4 p-6 shadow-2xl">
        {/* Warning Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-400">
              Unverified Tokens
            </h2>
            <p className="text-sm text-gray-400">
              Proceed with extreme caution
            </p>
          </div>
        </div>

        {/* Disclaimer Content */}
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            You are about to view tokens that have <strong className="text-red-400">NOT been verified</strong> by
            the 8xM team. These tokens may include:
          </p>

          <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
            <li>Scam or fraudulent projects</li>
            <li>Tokens with misleading information</li>
            <li>Projects with hidden rug-pull mechanisms</li>
            <li>Tokens impersonating legitimate projects</li>
            <li>Assets with no real value or utility</li>
          </ul>

          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 font-medium">
              You could lose 100% of your investment.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Do your own research (DYOR) before interacting with any unverified token.
              8xM is not responsible for losses from unverified token trades.
            </p>
          </div>

          <p className="text-gray-500 text-xs">
            Verified tokens have passed our review process and are displayed prominently.
            We recommend only trading verified tokens unless you understand the risks.
          </p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 mt-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300 group-hover:text-white">
            I understand that unverified tokens are high-risk and I accept full
            responsibility for any losses. I will conduct my own research before trading.
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onDecline}
            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
          >
            Go Back
          </button>
          <button
            onClick={handleAccept}
            disabled={!agreed}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              agreed
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            View Unverified Tokens
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onDecline}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Helper to check if disclaimer was previously accepted
 */
export function hasAcceptedDisclaimer(): boolean {
  try {
    const accepted = localStorage.getItem('8xm_disclaimer_accepted');
    if (!accepted) return false;

    // Disclaimer acceptance expires after 24 hours
    const acceptedTime = parseInt(accepted);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return (now - acceptedTime) < twentyFourHours;
  } catch {
    return false;
  }
}

/**
 * Verification badge component for token cards
 */
export function VerificationBadge({
  status,
  isFeatured
}: {
  status: string;
  isFeatured?: boolean;
}) {
  if (isFeatured) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs font-bold rounded">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Featured
      </span>
    );
  }

  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-400 text-xs font-medium rounded border border-green-500/30">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verified
        </span>
      );
    case 'pending':
    case 'under_review':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs font-medium rounded border border-yellow-500/30">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Unverified
        </span>
      );
    case 'flagged':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600/20 text-red-400 text-xs font-medium rounded border border-red-500/30">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
          Flagged
        </span>
      );
    default:
      return null;
  }
}
