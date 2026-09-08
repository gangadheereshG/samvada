// Smart Interest Normalization and Compatibility Engine

// Synonym clusters mapped to a canonical concept
const SYNONYM_CLUSTERS: Record<string, string[]> = {
  programming: ['coding', 'code', 'programmer', 'developer', 'software', 'webdev', 'frontend', 'backend', 'fullstack', 'computer science', 'cs'],
  gaming: ['games', 'gamer', 'videogames', 'video games', 'pc gaming', 'playstation', 'xbox', 'nintendo', 'esports'],
  friendship: ['friend', 'friends', 'chat', 'talking', 'social', 'meet friends', 'making friends', 'hangout'],
  movies: ['films', 'film', 'cinema', 'movie', 'hollywood', 'bollywood', 'documentaries', 'tv shows', 'netflix', 'series'],
  music: ['songs', 'musician', 'guitar', 'piano', 'singing', 'hip hop', 'rock', 'pop', 'electronic', 'edm', 'jazz', 'classical'],
  travel: ['travelling', 'traveling', 'wanderlust', 'vacation', 'trips', 'backpacking', 'tourism', 'exploring'],
  technology: ['tech', 'gadgets', 'ai', 'artificial intelligence', 'hardware', 'cybersecurity', 'electronics'],
  fitness: ['workout', 'working out', 'gym', 'bodybuilding', 'exercise', 'health', 'crossfit', 'running', 'calisthenics', 'yoga'],
  sports: ['athletics', 'football', 'soccer', 'basketball', 'cricket', 'tennis', 'badminton', 'volleyball', 'swimming'],
  anime: ['manga', 'otaku', 'animation', 'japanese animation'],
  books: ['reading', 'literature', 'novels', 'author', 'poetry', 'book club'],
  photography: ['photo', 'photos', 'camera', 'photographer', 'videography'],
  art: ['drawing', 'painting', 'sketching', 'design', 'illustration', 'digital art', 'creative'],
  study: ['studying', 'learning', 'education', 'school', 'college', 'university', 'research'],
  business: ['startups', 'startup', 'entrepreneurship', 'entrepreneur', 'finance', 'investing', 'marketing', 'economics'],
};

// Build reverse lookup index for O(1) matching
const REVERSE_SYNONYM_MAP = new Map<string, string>();
for (const [canonical, synonyms] of Object.entries(SYNONYM_CLUSTERS)) {
  REVERSE_SYNONYM_MAP.set(canonical.toLowerCase(), canonical);
  for (const syn of synonyms) {
    REVERSE_SYNONYM_MAP.set(syn.toLowerCase(), canonical);
  }
}

/**
 * Basic stemmer to strip common plural and continuous endings
 */
function basicStem(word: string): string {
  let cleaned = word.toLowerCase().trim();
  if (cleaned.endsWith('ing') && cleaned.length > 5) {
    cleaned = cleaned.slice(0, -3);
  } else if (cleaned.endsWith('ies') && cleaned.length > 5) {
    cleaned = cleaned.slice(0, -3) + 'y';
  } else if (cleaned.endsWith('es') && cleaned.length > 4) {
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.endsWith('s') && cleaned.length > 3 && !cleaned.endsWith('ss')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

/**
 * Normalizes an interest tag to its canonical representative concept
 */
export function normalizeInterest(interest: string): string {
  const clean = interest.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  if (!clean) return '';

  // 1. Direct synonym match
  if (REVERSE_SYNONYM_MAP.has(clean)) {
    return REVERSE_SYNONYM_MAP.get(clean)!;
  }

  // 2. Stemmed synonym match
  const stemmed = basicStem(clean);
  if (REVERSE_SYNONYM_MAP.has(stemmed)) {
    return REVERSE_SYNONYM_MAP.get(stemmed)!;
  }

  // 3. Fallback to cleaned word
  return clean;
}

export interface CompatibilityResult {
  score: number;
  sharedInterests: string[];
}

/**
 * Calculates compatibility score between two sets of user interests
 */
export function calculateCompatibility(
  interestsA: string[],
  interestsB: string[]
): CompatibilityResult {
  if (!interestsA.length || !interestsB.length) {
    return { score: 0, sharedInterests: [] };
  }

  const normalizedA = interestsA.map(i => ({ raw: i, norm: normalizeInterest(i) }));
  const normalizedB = interestsB.map(i => ({ raw: i, norm: normalizeInterest(i) }));

  let score = 0;
  const sharedSet = new Set<string>();

  for (const itemA of normalizedA) {
    for (const itemB of normalizedB) {
      if (itemA.raw.toLowerCase() === itemB.raw.toLowerCase()) {
        // Exact match
        score += 3;
        sharedSet.add(capitalize(itemA.raw));
      } else if (itemA.norm === itemB.norm && itemA.norm !== '') {
        // Semantic synonym match (e.g. coding <-> programming)
        score += 2;
        // Display readable label representing both or canonical
        const label = `${capitalize(itemA.raw)} / ${capitalize(itemB.raw)}`;
        sharedSet.add(label);
      }
    }
  }

  return {
    score,
    sharedInterests: Array.from(sharedSet),
  };
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
