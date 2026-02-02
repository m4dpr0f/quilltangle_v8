import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Application {
  id: number;
  creator_wallet: string;
  nation_name: string;
  soul_description: string;
  road_id: string;
  tek8_guild: string;
  garu_egg_question: string;
  character_name: string;
  sacred_instrument: string;
  instrument_element: string;
  voice_is_instrument: boolean;
  crowdfunding_platform: string;
  crowdfunding_url: string;
  business_description: string;
  arcade_staff_pillars: string[];
  tech_innovation_type: string;
  tech_description: string;
  token_mint_address: string | null;
  token_symbol: string | null;
  status: string;
  video_interview_scheduled: string | null;
  video_interview_completed: boolean;
  reviewer_notes: string | null;
  created_at: string;
  proposed_instrument_name?: string;
  proposed_instrument_element?: string;
  proposed_instrument_origin?: string;
  proposed_instrument_desc?: string;
}

interface StatusCounts {
  submitted: number;
  approved: number;
  rejected: number;
  changes_requested: number;
}

function AdminReviewInner() {
  const { publicKey, connected } = useWallet();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('submitted');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchApplications = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/applications?wallet=${publicKey.toBase58()}&status=${activeStatus}`
      );
      const result = await res.json();

      if (result.success) {
        setApplications(result.applications);
        setCounts(result.counts);
        setIsAdmin(result.isAdmin);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchApplications();
    }
  }, [publicKey, activeStatus]);

  const handleAction = async (action: string, scheduleInterview?: string) => {
    if (!publicKey || !selectedApp) return;

    setActionLoading(true);
    setActionResult(null);

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action,
          walletAddress: publicKey.toBase58(),
          notes: actionNotes,
          scheduleInterview,
        }),
      });

      const result = await res.json();
      setActionResult({ success: result.success, message: result.message || result.error });

      if (result.success) {
        setActionNotes('');
        fetchApplications();
        if (action === 'approve' || action === 'reject') {
          setSelectedApp(null);
        }
      }
    } catch (err: any) {
      setActionResult({ success: false, message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Admin Review Panel</h2>
        <p className="text-gray-400 mb-6">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Admin Review Panel</h2>
        <p className="text-gray-400 mb-6">Connect your admin wallet to review applications</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">Your wallet is not authorized for admin access.</p>
        <p className="text-sm text-gray-500">Connected: {publicKey?.toBase58()}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Application Review</h1>
          <p className="text-gray-400 text-sm">Review and approve GCN applications</p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Status Tabs */}
      {counts && (
        <div className="flex gap-2 mb-6">
          {Object.entries(counts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status.replace('_', ' ')} ({count})
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Applications List */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Applications ({applications.length})</h3>

          {applications.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-6 text-center text-gray-400">
              No applications with status "{activeStatus}"
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`bg-gray-900 rounded-lg p-4 cursor-pointer transition border-2 ${
                  selectedApp?.id === app.id
                    ? 'border-purple-500'
                    : 'border-transparent hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg">{app.nation_name}</h4>
                    <p className="text-sm text-gray-400">{app.road_id} • {app.tek8_guild}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    app.status === 'submitted' ? 'bg-yellow-600' :
                    app.status === 'approved' ? 'bg-green-600' :
                    app.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{app.soul_description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(app.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Application Detail */}
        <div>
          {selectedApp ? (
            <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
              <h3 className="font-bold text-xl mb-4">{selectedApp.nation_name}</h3>

              {/* Action Result */}
              {actionResult && (
                <div className={`mb-4 p-3 rounded ${
                  actionResult.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {actionResult.message}
                </div>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mb-6">
                <DetailRow label="Wallet" value={selectedApp.creator_wallet} mono />
                <DetailRow label="Road" value={selectedApp.road_id} />
                <DetailRow label="Guild" value={selectedApp.tek8_guild} />
                <DetailRow label="Character" value={selectedApp.character_name || 'Not specified'} />
                <DetailRow label="Instrument" value={selectedApp.sacred_instrument} />

                <div>
                  <span className="text-gray-500 text-xs uppercase">Soul Description</span>
                  <p className="text-sm whitespace-pre-wrap">{selectedApp.soul_description}</p>
                </div>

                <DetailRow label="Garu Egg Question" value={selectedApp.garu_egg_question || 'Not answered'} />

                <div>
                  <span className="text-gray-500 text-xs uppercase">Crowdfunding</span>
                  <p className="text-sm">
                    <a href={selectedApp.crowdfunding_url} target="_blank" rel="noopener" className="text-purple-400 hover:underline">
                      {selectedApp.crowdfunding_platform}: {selectedApp.crowdfunding_url}
                    </a>
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 text-xs uppercase">Business Description</span>
                  <p className="text-sm whitespace-pre-wrap">{selectedApp.business_description || 'Not provided'}</p>
                </div>

                <div>
                  <span className="text-gray-500 text-xs uppercase">Arcade Staff Pillars</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApp.arcade_staff_pillars?.map((pillar) => (
                      <span key={pillar} className="px-2 py-1 bg-gray-800 rounded text-xs">
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-xs uppercase">Tech Innovation ({selectedApp.tech_innovation_type})</span>
                  <p className="text-sm whitespace-pre-wrap">{selectedApp.tech_description}</p>
                </div>

                {selectedApp.token_mint_address && (
                  <DetailRow label="Token Mint" value={selectedApp.token_mint_address} mono />
                )}

                {selectedApp.reviewer_notes && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase">Reviewer Notes</span>
                    <p className="text-sm whitespace-pre-wrap bg-gray-800 p-2 rounded mt-1">
                      {selectedApp.reviewer_notes}
                    </p>
                  </div>
                )}

                {selectedApp.proposed_instrument_name && (
                  <div className="bg-purple-900/30 p-3 rounded border border-purple-500">
                    <span className="text-purple-400 text-xs uppercase">Proposed New Instrument</span>
                    <p className="font-bold">{selectedApp.proposed_instrument_name}</p>
                    <p className="text-sm text-gray-400">
                      {selectedApp.proposed_instrument_element} • {selectedApp.proposed_instrument_origin}
                    </p>
                    <p className="text-sm mt-1">{selectedApp.proposed_instrument_desc}</p>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="border-t border-gray-700 pt-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Notes</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="input w-full h-20 resize-none"
                    placeholder="Add notes (optional for actions)"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="btn bg-green-600 hover:bg-green-500 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                    className="btn bg-red-600 hover:bg-red-500 text-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction('request_changes')}
                    disabled={actionLoading}
                    className="btn bg-yellow-600 hover:bg-yellow-500 text-sm"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleAction('add_notes')}
                    disabled={actionLoading || !actionNotes}
                    className="btn bg-gray-600 hover:bg-gray-500 text-sm"
                  >
                    Add Notes
                  </button>
                </div>

                {!selectedApp.video_interview_completed && (
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      id="interview-datetime"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('interview-datetime') as HTMLInputElement;
                        if (input?.value) handleAction('schedule_interview', input.value);
                      }}
                      disabled={actionLoading}
                      className="btn bg-blue-600 hover:bg-blue-500 text-sm"
                    >
                      Schedule Interview
                    </button>
                  </div>
                )}

                {selectedApp.video_interview_scheduled && !selectedApp.video_interview_completed && (
                  <button
                    onClick={() => handleAction('mark_interviewed')}
                    disabled={actionLoading}
                    className="btn bg-purple-600 hover:bg-purple-500 text-sm w-full"
                  >
                    Mark Interview Completed
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-6 text-center text-gray-400">
              Select an application to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-gray-500 text-xs uppercase">{label}</span>
      <p className={`text-sm ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</p>
    </div>
  );
}

export default function AdminReview() {
  return (
    <WalletProvider>
      <AdminReviewInner />
    </WalletProvider>
  );
}
