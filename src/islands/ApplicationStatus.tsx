import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './WalletProvider';

interface Application {
  id: number;
  nation_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  reviewer_notes: string | null;
  video_interview_scheduled: string | null;
  video_interview_completed: boolean;
  contact_email: string | null;
  contact_telegram: string | null;
  contact_discord: string | null;
  notification_prefs: {
    email: boolean;
    telegram: boolean;
    discord: boolean;
    in_app: boolean;
  };
}

interface Message {
  id: number;
  sender_type: 'admin' | 'applicant';
  message: string;
  is_read: boolean;
  created_at: string;
}

const STATUS_INFO: Record<string, { color: string; icon: string; label: string; description: string }> = {
  submitted: {
    color: 'bg-yellow-600',
    icon: '📋',
    label: 'Submitted',
    description: 'Your application is in the queue for review.',
  },
  under_review: {
    color: 'bg-blue-600',
    icon: '🔍',
    label: 'Under Review',
    description: 'A team member is actively reviewing your application.',
  },
  changes_requested: {
    color: 'bg-orange-600',
    icon: '📝',
    label: 'Changes Requested',
    description: 'Please review the feedback and update your application.',
  },
  interview_scheduled: {
    color: 'bg-purple-600',
    icon: '📅',
    label: 'Interview Scheduled',
    description: 'Your video interview has been scheduled.',
  },
  approved: {
    color: 'bg-green-600',
    icon: '✅',
    label: 'Approved',
    description: 'Congratulations! Welcome to the Quillverse!',
  },
  rejected: {
    color: 'bg-red-600',
    icon: '❌',
    label: 'Not Approved',
    description: 'Your application was not approved at this time.',
  },
};

function ApplicationStatusInner() {
  const { publicKey, connected } = useWallet();

  // Prevent hydration mismatch - wait for client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch applications
  const fetchApplications = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gcn/application?wallet=${publicKey.toBase58()}`);
      const data = await res.json();
      if (data.success && data.applications) {
        setApplications(data.applications);
        if (data.applications.length > 0 && !selectedApp) {
          setSelectedApp(data.applications[0]);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected application
  const fetchMessages = async () => {
    if (!publicKey || !selectedApp) return;
    try {
      const res = await fetch(
        `/api/applications/messages?applicationId=${selectedApp.id}&wallet=${publicKey.toBase58()}`
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!publicKey || !selectedApp || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/applications/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          wallet: publicKey.toBase58(),
          message: newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (publicKey) fetchApplications();
  }, [publicKey]);

  useEffect(() => {
    if (selectedApp) fetchMessages();
  }, [selectedApp]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show loading state until client mounts (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">📋</div>
        <h1 className="text-3xl font-bold mb-4">Application Status</h1>
        <p className="text-gray-400 mb-8">Loading...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">📋</div>
        <h1 className="text-3xl font-bold mb-4">Application Status</h1>
        <p className="text-gray-400 mb-8">Connect your wallet to view your application status</p>
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

  if (applications.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">📭</div>
        <h1 className="text-3xl font-bold mb-4">No Applications</h1>
        <p className="text-gray-400 mb-8">You haven't submitted any applications yet.</p>
        <a href="/apply/character" className="btn bg-purple-600 hover:bg-purple-500">
          Start Application →
        </a>
      </div>
    );
  }

  const statusInfo = selectedApp ? STATUS_INFO[selectedApp.status] || STATUS_INFO.submitted : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Application Status</h1>
          <p className="text-gray-400">Track your GCN application progress</p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Application selector (if multiple) */}
      {applications.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedApp?.id === app.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {app.nation_name}
            </button>
          ))}
        </div>
      )}

      {selectedApp && statusInfo && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="md:col-span-2 space-y-6">
            {/* Current Status */}
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full ${statusInfo.color} flex items-center justify-center text-3xl`}>
                  {statusInfo.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedApp.nation_name}</h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <p className="text-gray-300">{statusInfo.description}</p>

              {selectedApp.reviewer_notes && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-400 mb-2">Reviewer Notes</h4>
                  <p className="text-sm">{selectedApp.reviewer_notes}</p>
                </div>
              )}

              {selectedApp.video_interview_scheduled && !selectedApp.video_interview_completed && (
                <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
                  <h4 className="text-sm font-bold text-purple-400 mb-2">📅 Interview Scheduled</h4>
                  <p className="text-lg font-mono">
                    {new Date(selectedApp.video_interview_scheduled).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Messages / Chat */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-bold mb-4">💬 Messages</h3>

              <div className="h-64 overflow-y-auto bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'applicant' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender_type === 'applicant'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === 'applicant' ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="btn bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-bold mb-4">📜 Timeline</h3>
              <div className="space-y-4">
                <TimelineItem
                  label="Submitted"
                  date={selectedApp.created_at}
                  active={true}
                />
                <TimelineItem
                  label="Under Review"
                  active={['under_review', 'changes_requested', 'interview_scheduled', 'approved'].includes(selectedApp.status)}
                />
                {selectedApp.video_interview_scheduled && (
                  <TimelineItem
                    label="Interview"
                    date={selectedApp.video_interview_scheduled}
                    active={selectedApp.video_interview_completed}
                  />
                )}
                <TimelineItem
                  label="Decision"
                  active={['approved', 'rejected'].includes(selectedApp.status)}
                  success={selectedApp.status === 'approved'}
                  failed={selectedApp.status === 'rejected'}
                />
              </div>
            </div>

            {/* Contact Preferences */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-bold mb-4">🔔 Notifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className={selectedApp.contact_email ? 'text-green-400' : 'text-gray-600'}>
                    {selectedApp.contact_email ? '✓ Set' : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Telegram</span>
                  <span className={selectedApp.contact_telegram ? 'text-green-400' : 'text-gray-600'}>
                    {selectedApp.contact_telegram ? '✓ Set' : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Discord</span>
                  <span className={selectedApp.contact_discord ? 'text-green-400' : 'text-gray-600'}>
                    {selectedApp.contact_discord ? '✓ Set' : 'Not set'}
                  </span>
                </div>
              </div>
              <a
                href={`/apply/settings?id=${selectedApp.id}`}
                className="btn w-full bg-gray-700 hover:bg-gray-600 mt-4 text-sm"
              >
                Update Contact Info
              </a>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-bold mb-4">🔗 Resources</h3>
              <div className="space-y-2">
                <a href="/faq" className="block text-purple-400 hover:underline text-sm">
                  Frequently Asked Questions
                </a>
                <a href="https://discord.gg/8xm" target="_blank" className="block text-purple-400 hover:underline text-sm">
                  Join Discord Community
                </a>
                <a href="https://t.me/quillverse" target="_blank" className="block text-purple-400 hover:underline text-sm">
                  Telegram Announcements
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
  success,
  failed,
}: {
  label: string;
  date?: string;
  active: boolean;
  success?: boolean;
  failed?: boolean;
}) {
  const color = success ? 'bg-green-500' : failed ? 'bg-red-500' : active ? 'bg-purple-500' : 'bg-gray-700';

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div className="flex-1">
        <p className={`text-sm ${active ? 'text-white' : 'text-gray-500'}`}>{label}</p>
        {date && (
          <p className="text-xs text-gray-500">
            {new Date(date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApplicationStatus() {
  return (
    <WalletProvider>
      <ApplicationStatusInner />
    </WalletProvider>
  );
}
