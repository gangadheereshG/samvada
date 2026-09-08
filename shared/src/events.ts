export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_QUEUE: 'join_queue',
  LEAVE_QUEUE: 'leave_queue',
  SELECT_MODE: 'select_mode',
  CHAT_MESSAGE: 'chat_message',
  CHAT_TYPING: 'chat_typing',
  SKIP: 'skip',
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  MEDIA_STATE_CHANGE: 'media_state_change',
  REPORT_USER: 'report_user',
  BLOCK_USER: 'block_user',

  // Server -> Client
  QUEUE_JOINED: 'queue_joined',
  QUEUE_WAITING: 'queue_waiting',
  MATCH_FOUND: 'match_found',
  PARTNER_MODE_SELECTED: 'partner_mode_selected',
  CHAT_MESSAGE_RECEIVED: 'chat_message_received',
  CHAT_TYPING_UPDATE: 'chat_typing_update',
  PARTNER_SKIPPED: 'partner_skipped',
  PARTNER_DISCONNECTED: 'partner_disconnected',
  PARTNER_MEDIA_STATE: 'partner_media_state',
  STATS_UPDATE: 'stats_update',
  ERROR: 'error_event',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
