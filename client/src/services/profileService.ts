// Profile Service
// Allows users to set a custom display name and emoji avatar

export interface UserProfile {
  displayName: string;
  avatarEmoji: string;
}

const STORAGE_KEY = 'samvada_user_profile';

const POPULAR_EMOJIS = ['🦊', '🐼', '🦁', '🐯', '🚀', '⚡', '🌟', '🎮', '🎧', '🎨', '🍕', '☕', '🌸', '🔥', '🌈', '🕶️', '🤖', '🛸', '🍀', '🐱'];

export function getUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.displayName === 'string' && typeof parsed.avatarEmoji === 'string') {
        return parsed;
      }
    }
  } catch {}

  // Default random friendly emoji
  const randomEmoji = POPULAR_EMOJIS[Math.floor(Math.random() * POPULAR_EMOJIS.length)];
  const defaultProfile: UserProfile = {
    displayName: '',
    avatarEmoji: randomEmoji,
  };
  return defaultProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      displayName: profile.displayName.trim().slice(0, 20),
      avatarEmoji: profile.avatarEmoji || '👤',
    }));
  } catch {}
}

export { POPULAR_EMOJIS };
