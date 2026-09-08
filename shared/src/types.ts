export type MatchState =
  | 'IDLE'
  | 'SELECTING_INTERESTS'
  | 'SEARCHING'
  | 'WAITING'
  | 'MATCH_FOUND'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'SKIPPED'
  | 'DISCONNECTED'
  | 'ERROR';

export type ChatMode = 'text' | 'video';

export interface UserSession {
  sessionId: string;
  socketId: string;
  interests: string[];
  normalizedInterests: string[];
  joinedQueueAt?: number;
  currentMatchId?: string;
  matchedWith?: string;
  chatMode?: ChatMode;
  displayName?: string;
  avatarEmoji?: string;
}

export interface ChatMessage {
  id: string;
  senderSessionId: string;
  text: string;
  timestamp: number;
  senderName?: string;
  senderEmoji?: string;
}

export interface MatchPayload {
  matchId: string;
  partnerId: string; // obfuscated session/alias
  partnerName?: string;
  partnerEmoji?: string;
  sharedInterests: string[];
  isInitiator: boolean; // Determines which peer creates WebRTC offer
  chatMode?: ChatMode;
}

export interface WebRTCOfferPayload {
  matchId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerPayload {
  matchId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidatePayload {
  matchId: string;
  candidate: RTCIceCandidateInit;
}

export interface MediaStatePayload {
  matchId: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate'
  | 'offensive'
  | 'other';

export interface ReportPayload {
  reportedSessionId: string;
  reason: ReportReason;
  details?: string;
  matchId?: string;
}

export interface BlockPayload {
  blockedSessionId: string;
  matchId?: string;
  reason?: string;
}

export interface PlatformStats {
  onlineCount: number;
  waitingCount: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
