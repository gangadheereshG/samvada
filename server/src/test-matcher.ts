import { normalizeInterest, calculateCompatibility } from './matchmaking/interestEngine.js';
import { Matcher } from './matchmaking/matcher.js';
import { QueueService } from './redis/queueService.js';
import { UserSession } from '@samvada/shared';

async function runTests() {
  console.log('🧪 Running SAMVADA Interest and Matchmaking Tests...\n');

  // Test 1: Interest Normalization
  console.log('Test 1: Interest Normalization');
  const n1 = normalizeInterest('coding');
  const n2 = normalizeInterest('films');
  const n3 = normalizeInterest('workout');
  const n4 = normalizeInterest('games');
  const n5 = normalizeInterest('friend');

  console.log(`  'coding' -> '${n1}' (Expected: programming)`);
  console.log(`  'films' -> '${n2}' (Expected: movies)`);
  console.log(`  'workout' -> '${n3}' (Expected: fitness)`);
  console.log(`  'games' -> '${n4}' (Expected: gaming)`);
  console.log(`  'friend' -> '${n5}' (Expected: friendship)`);

  if (n1 !== 'programming' || n2 !== 'movies' || n3 !== 'fitness' || n4 !== 'gaming' || n5 !== 'friendship') {
    throw new Error('Normalization tests failed!');
  }
  console.log('✅ Test 1 Passed.\n');

  // Test 2: Smart Compatibility
  console.log('Test 2: Smart Compatibility Scoring');
  const userAInterests = ['Programming', 'Gaming', 'Music'];
  const userBInterests = ['Coding', 'Games', 'Art'];
  const userCInterests = ['Travel', 'Books'];

  const compatAB = calculateCompatibility(userAInterests, userBInterests);
  console.log('  Compat A & B:', compatAB);
  if (compatAB.score <= 0 || compatAB.sharedInterests.length < 2) {
    throw new Error('Compat A & B should have high score with 2 shared semantic interests!');
  }

  const compatAC = calculateCompatibility(userAInterests, userCInterests);
  console.log('  Compat A & C:', compatAC);
  if (compatAC.score !== 0) {
    throw new Error('Compat A & C should have 0 shared interests!');
  }
  console.log('✅ Test 2 Passed.\n');

  // Test 3: Strict Human-to-Human Matching (Zero Fake Users)
  console.log('Test 3: Strict Real-Human Queue (Zero Fake Users)');
  const dummyUserA: UserSession = {
    sessionId: 'session_test_user_a',
    socketId: 'sock_test_a',
    interests: ['Programming', 'Gaming'],
    normalizedInterests: ['programming', 'gaming'],
  };

  const fakeSockets = new Set(['sock_test_a', 'sock_test_b']);
  const isConnected = (id: string) => fakeSockets.has(id);

  // When only 1 user is in queue:
  const soloMatch = await Matcher.findMatchForUser(dummyUserA, isConnected);
  console.log('  Solo user match result:', soloMatch);
  if (soloMatch !== null) {
    throw new Error('Strict rule violated: A solo user must NOT be matched with a fake user!');
  }
  console.log('  Solo user correctly remains waiting.');

  // Now enqueue User A:
  await QueueService.enqueueUser(dummyUserA);

  // User B arrives with matching interests:
  const dummyUserB: UserSession = {
    sessionId: 'session_test_user_b',
    socketId: 'sock_test_b',
    interests: ['Coding', 'Gaming'],
    normalizedInterests: ['programming', 'gaming'],
  };

  const dualMatch = await Matcher.findMatchForUser(dummyUserB, isConnected);
  console.log('  Dual user match result:', dualMatch?.matchId, 'Shared:', dualMatch?.sharedInterests);
  if (!dualMatch || dualMatch.userB.sessionId !== dummyUserA.sessionId) {
    throw new Error('Real candidate matching failed to match User A and User B!');
  }
  console.log('✅ Test 3 Passed.\n');

  // Test 4: Prevent Immediate Rematch
  console.log('Test 4: Prevent Immediate Rematch');
  // Both users were just matched and recorded in recent matches
  await QueueService.enqueueUser(dummyUserA);
  const rematch = await Matcher.findMatchForUser(dummyUserB, isConnected);
  console.log('  Immediate rematch result:', rematch);
  if (rematch !== null) {
    throw new Error('Immediate rematch was NOT prevented!');
  }
  console.log('✅ Test 4 Passed: Immediate rematch cleanly prevented.\n');

  console.log('🎉 ALL BACKEND ALGORITHMIC AND SAFETY TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
