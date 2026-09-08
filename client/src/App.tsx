import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MatchState,
  ChatMode,
  MatchPayload,
  ChatMessage,
  SOCKET_EVENTS,
  PlatformStats,
} from '@samvada/shared';
import { useTheme } from './hooks/useTheme.js';
import { useWebRTC } from './hooks/useWebRTC.js';
import { socketService } from './services/socketService.js';
import { getAnonymousSessionId } from './services/sessionService.js';
import { getUserProfile, saveUserProfile, UserProfile } from './services/profileService.js';

// Common Components
import { AnimatedSky } from './components/common/AnimatedSky.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { ProfileModal } from './components/common/ProfileModal.js';

// Home Components
import { Hero } from './components/home/Hero.js';
import { HowItWorks } from './components/home/HowItWorks.js';
import { Features } from './components/home/Features.js';

// Match Components
import { InterestSelector } from './components/match/InterestSelector.js';
import { WaitingScreen } from './components/match/WaitingScreen.js';
import { MatchFoundModal } from './components/match/MatchFoundModal.js';

// Chat & Video Components
import { TextChat } from './components/chat/TextChat.js';
import { VideoChat } from './components/video/VideoChat.js';
import { ReportDialog } from './components/chat/ReportDialog.js';
import { BlockDialog } from './components/chat/BlockDialog.js';

export function App() {
  const { toggleTheme, isDark } = useTheme();
  const sessionId = useMemo(() => getAnonymousSessionId(), []);

  // User Profile & Customization State
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const profileRef = useRef<UserProfile>(profile);
  profileRef.current = profile;

  // Partner Profile State
  const [partnerProfile, setPartnerProfile] = useState<{ displayName?: string; avatarEmoji?: string }>({});

  // Application State Machine
  const [matchState, setMatchState] = useState<MatchState>('IDLE');
  const [chatMode, setChatMode] = useState<ChatMode>('video');
  const [interests, setInterests] = useState<string[]>([]);
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState<boolean>(false);

  // Presence Stats
  const [stats, setStats] = useState<PlatformStats>({ onlineCount: 1, waitingCount: 0 });

  // Real-Time Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [partnerStatusNotice, setPartnerStatusNotice] = useState<string | null>(null);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showReportDialog, setShowReportDialog] = useState<boolean>(false);
  const [showBlockDialog, setShowBlockDialog] = useState<boolean>(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);

  // WebRTC Hook
  const isVideoActive = matchState === 'CONNECTED' && chatMode === 'video';
  const {
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    partnerMicEnabled,
    partnerCameraEnabled,
    permissionError,
    toggleMic,
    toggleCamera,
    retryMedia,
    stopAllMedia,
  } = useWebRTC({
    matchId: currentMatchId,
    isInitiator,
    isActive: isVideoActive,
  });

  const interestsRef = useRef(interests);
  interestsRef.current = interests;

  // Socket Lifecycle and Listeners
  useEffect(() => {
    const socket = socketService.getSocket();

    const handleStatsUpdate = (data: PlatformStats) => {
      setStats(data);
    };

    const handleWaiting = (_data: { waitingCount: number }) => {
      setMatchState('WAITING');
    };

    const handleMatchFound = (payload: MatchPayload) => {
      console.log('[App] Real match found, connecting directly to video:', payload);
      setCurrentMatchId(payload.matchId);
      setSharedInterests(payload.sharedInterests || []);
      setIsInitiator(payload.isInitiator);
      setPartnerProfile({
        displayName: payload.partnerName,
        avatarEmoji: payload.partnerEmoji,
      });
      setMessages([]);
      setPartnerStatusNotice(null);
      // Connect directly into video chat without asking: show his and my video both!
      setChatMode('video');
      setMatchState('CONNECTED');
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleTypingUpdate = (data: { isTyping: boolean }) => {
      setIsPartnerTyping(data.isTyping);
    };

    const handlePartnerSkipped = (_data: { message: string }) => {
      console.log('[App] Partner skipped. Searching for next connection...');
      setPartnerStatusNotice('The other person skipped. Finding someone new...');
      setCurrentMatchId(null);
      setPartnerProfile({});
      setMessages([]);
      setMatchState('WAITING');
      socketService.joinQueue(
        sessionId,
        interestsRef.current,
        'video',
        profileRef.current.displayName,
        profileRef.current.avatarEmoji
      );
    };

    const handlePartnerDisconnected = (_data: { message: string }) => {
      console.log('[App] Partner disconnected. Searching for next connection...');
      setPartnerStatusNotice('The other person disconnected. Finding someone new...');
      setCurrentMatchId(null);
      setPartnerProfile({});
      setMessages([]);
      setMatchState('WAITING');
      socketService.joinQueue(
        sessionId,
        interestsRef.current,
        'video',
        profileRef.current.displayName,
        profileRef.current.avatarEmoji
      );
    };

    socket.on(SOCKET_EVENTS.STATS_UPDATE, handleStatsUpdate);
    socket.on(SOCKET_EVENTS.QUEUE_WAITING, handleWaiting);
    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, handleChatMessage);
    socket.on(SOCKET_EVENTS.CHAT_TYPING_UPDATE, handleTypingUpdate);
    socket.on(SOCKET_EVENTS.PARTNER_SKIPPED, handlePartnerSkipped);
    socket.on(SOCKET_EVENTS.PARTNER_DISCONNECTED, handlePartnerDisconnected);

    return () => {
      socket.off(SOCKET_EVENTS.STATS_UPDATE, handleStatsUpdate);
      socket.off(SOCKET_EVENTS.QUEUE_WAITING, handleWaiting);
      socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, handleChatMessage);
      socket.off(SOCKET_EVENTS.CHAT_TYPING_UPDATE, handleTypingUpdate);
      socket.off(SOCKET_EVENTS.PARTNER_SKIPPED, handlePartnerSkipped);
      socket.off(SOCKET_EVENTS.PARTNER_DISCONNECTED, handlePartnerDisconnected);
    };
  }, [sessionId]);

  // Flow Actions
  const handleSaveProfile = (updated: UserProfile) => {
    saveUserProfile(updated);
    setProfile(updated);
  };

  const handleStartConnecting = () => {
    setMatchState('SELECTING_INTERESTS');
  };

  const handleStartMatching = (preferredMode: ChatMode) => {
    setChatMode(preferredMode);
    setMatchState('WAITING');
    setPartnerStatusNotice(null);
    socketService.joinQueue(
      sessionId,
      interests,
      preferredMode,
      profile.displayName,
      profile.avatarEmoji
    );
  };

  const handleLeaveQueue = () => {
    socketService.leaveQueue(sessionId);
    setMatchState('IDLE');
  };

  const handleSelectMode = (mode: ChatMode) => {
    setChatMode(mode);
    setMatchState('CONNECTED');
  };

  const handleSendMessage = (text: string) => {
    if (!currentMatchId) return;
    const localMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      senderSessionId: sessionId,
      text,
      timestamp: Date.now(),
      senderName: profile.displayName || 'You',
      senderEmoji: profile.avatarEmoji || '👤',
    };
    setMessages(prev => [...prev, localMsg]);
    socketService.sendMessage(currentMatchId, text);
  };

  const handleSendTyping = (isTyping: boolean) => {
    if (!currentMatchId) return;
    socketService.sendTyping(currentMatchId, isTyping);
  };

  // Skip functionality (Section 22: Keep interests, clear match, re-queue immediately)
  const handleSkip = useCallback(() => {
    if (currentMatchId) {
      socketService.skip(currentMatchId);
    }
    setCurrentMatchId(null);
    setPartnerProfile({});
    setMessages([]);
    setPartnerStatusNotice(null);
    setMatchState('WAITING');
    socketService.joinQueue(
      sessionId,
      interests,
      'video',
      profileRef.current.displayName,
      profileRef.current.avatarEmoji
    );
  }, [currentMatchId, sessionId, interests]);

  const handleEndCall = useCallback(() => {
    console.log('[App] Ending/cutting call and returning to home...');
    if (currentMatchId) {
      socketService.skip(currentMatchId);
    }
    socketService.leaveQueue(sessionId);
    setCurrentMatchId(null);
    setPartnerProfile({});
    setMessages([]);
    setPartnerStatusNotice(null);
    setMatchState('IDLE');
    stopAllMedia();
  }, [currentMatchId, sessionId, stopAllMedia]);

  const handleInstantMatch = () => {
    setChatMode('video');
    setMatchState('WAITING');
    setPartnerStatusNotice(null);
    socketService.joinQueue(
      sessionId,
      [],
      'video',
      profile.displayName,
      profile.avatarEmoji
    );
  };

  const handleFindAnother = () => {
    setCurrentMatchId(null);
    setPartnerProfile({});
    setMessages([]);
    setPartnerStatusNotice(null);
    setMatchState('WAITING');
    socketService.joinQueue(
      sessionId,
      interests,
      chatMode,
      profile.displayName,
      profile.avatarEmoji
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-sky-50 text-slate-900'} relative selection:bg-sky-500 selection:text-white`}>
      {/* Animated Sky Canvas Background */}
      <AnimatedSky isDark={isDark} />

      {/* Global Navigation Bar */}
      <Navbar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onlineCount={stats.onlineCount}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onNavigateHome={handleEndCall}
        onOpenSafety={() => setShowSafetyModal(true)}
      />

      {/* Dynamic Content Views */}
      <main className="flex-1 flex flex-col">
        {matchState === 'IDLE' && (
          <>
            <Hero
              onStartConnecting={handleStartConnecting}
              onInstantMatch={handleInstantMatch}
              onHowItWorks={() => setShowHowItWorksModal(true)}
            />
            <div id="how-it-works">
              <HowItWorks />
            </div>
            <Features />
          </>
        )}

        {matchState === 'SELECTING_INTERESTS' && (
          <InterestSelector
            interests={interests}
            onChangeInterests={setInterests}
            onStartMatching={handleStartMatching}
            onCancel={() => setMatchState('IDLE')}
          />
        )}

        {matchState === 'WAITING' && (
          <WaitingScreen
            interests={interests}
            waitingCount={stats.waitingCount}
            onLeaveQueue={handleLeaveQueue}
          />
        )}

        {matchState === 'MATCH_FOUND' && (
          <MatchFoundModal
            sharedInterests={sharedInterests}
            initialMode={chatMode}
            onSelectMode={handleSelectMode}
          />
        )}

        {matchState === 'CONNECTED' && (
          <>
            {chatMode === 'video' ? (
              <VideoChat
                localStream={localStream}
                remoteStream={remoteStream}
                micEnabled={micEnabled}
                cameraEnabled={cameraEnabled}
                partnerMicEnabled={partnerMicEnabled}
                partnerCameraEnabled={partnerCameraEnabled}
                permissionError={permissionError}
                sharedInterests={sharedInterests}
                partnerName={partnerProfile.displayName}
                partnerEmoji={partnerProfile.avatarEmoji}
                myName={profile.displayName}
                myEmoji={profile.avatarEmoji}
                messages={messages}
                mySessionId={sessionId}
                isPartnerTyping={isPartnerTyping}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onSkip={handleSkip}
                onEndCall={handleEndCall}
                onOpenReport={() => setShowReportDialog(true)}
                onOpenBlock={() => setShowBlockDialog(true)}
                onSendMessage={handleSendMessage}
                onSendTyping={handleSendTyping}
                onRetryMedia={retryMedia}
              />
            ) : (
              <TextChat
                messages={messages}
                mySessionId={sessionId}
                isPartnerTyping={isPartnerTyping}
                sharedInterests={sharedInterests}
                partnerName={partnerProfile.displayName}
                partnerEmoji={partnerProfile.avatarEmoji}
                onSendMessage={handleSendMessage}
                onSendTyping={handleSendTyping}
                onSkip={handleSkip}
                onEndCall={handleEndCall}
                onOpenReport={() => setShowReportDialog(true)}
                onOpenBlock={() => setShowBlockDialog(true)}
                onSwitchToVideo={() => setChatMode('video')}
              />
            )}
          </>
        )}

        {/* Skipped or Disconnected Interstitial Screens */}
        {(matchState === 'SKIPPED' || matchState === 'DISCONNECTED') && (
          <div className="w-full max-w-md mx-auto my-auto px-4 py-12 text-center">
            <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-sky-400/20">
              <h3 className="text-2xl font-bold text-white light:text-slate-900 mb-2">
                {partnerStatusNotice || 'Conversation ended'}
              </h3>
              <p className="text-xs text-slate-300 light:text-slate-600 mb-6">
                Your interests are preserved. Ready to meet the next real person?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleFindAnother}
                  className="btn-glow py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-sky-500/25"
                >
                  Find Someone Else
                </button>
                <button
                  onClick={() => setMatchState('IDLE')}
                  className="py-3 text-xs text-slate-400 hover:text-white"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      {showProfileModal && (
        <ProfileModal
          currentProfile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showReportDialog && (
        <ReportDialog
          reporterSessionId={sessionId}
          reportedSessionId="stranger"
          matchId={currentMatchId || undefined}
          onClose={() => setShowReportDialog(false)}
          onReportSubmitted={() => {
            handleSkip();
          }}
        />
      )}

      {showBlockDialog && (
        <BlockDialog
          blockerSessionId={sessionId}
          blockedSessionId="stranger"
          matchId={currentMatchId || undefined}
          onClose={() => setShowBlockDialog(false)}
          onConfirmBlock={() => {
            handleSkip();
          }}
        />
      )}

      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl p-6 sm:p-8 rounded-3xl relative">
            <button
              onClick={() => setShowHowItWorksModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full"
            >
              ✕
            </button>
            <HowItWorks />
          </div>
        </div>
      )}

      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl text-left relative">
            <button
              onClick={() => setShowSafetyModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white light:text-slate-900 mb-3">
              Safety & Privacy Guidelines
            </h3>
            <div className="text-xs text-slate-300 light:text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Zero Bots / Real Humans Only:</strong> Every interaction on Samvada is with another real human being connected in real time.
              </p>
              <p>
                <strong>Never Share Sensitive Data:</strong> Never disclose your passwords, banking information, physical address, or private contact details to strangers.
              </p>
              <p>
                <strong>Instant Leave / Skip:</strong> You have complete autonomy. You can skip or disconnect from any conversation immediately at the touch of a button.
              </p>
              <p>
                <strong>Reporting & Blocking:</strong> If someone violates community guidelines or behaves inappropriately, report and block them immediately. Blocked users are permanently barred from reconnecting with you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer
        onOpenHowItWorks={() => setShowHowItWorksModal(true)}
        onOpenSafety={() => setShowSafetyModal(true)}
      />
    </div>
  );
}

export default App;
