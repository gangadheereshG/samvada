// Anonymous Session Service
// Generates and preserves a persistent anonymous session ID per browser tab/session
// Strictly internal: never shown to user

const SESSION_STORAGE_KEY = 'samvada_anon_session_id';

export function getAnonymousSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    // Generate secure random identifier
    const randPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);
    sessionId = `anon_${timePart}_${randPart}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}
