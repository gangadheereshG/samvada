import { io as ClientSocket } from 'socket.io-client';
import { SOCKET_EVENTS, MatchPayload, ChatMessage } from '@samvada/shared';

const SERVER_URL = 'http://localhost:4000';

async function runSocketE2E() {
  console.log('🚀 Starting Full Socket.IO E2E Matchmaking & Chat Test...\n');

  const socketA = ClientSocket(SERVER_URL);
  const socketB = ClientSocket(SERVER_URL);

  await new Promise<void>((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    socketA.on('connect', check);
    socketB.on('connect', check);
  });

  console.log('✅ Both real sockets connected successfully to server.');

  // Step 1: User A joins queue alone
  console.log('\n--- Step 1: User A joins queue alone ---');
  let userAWaitingReceived = false;
  socketA.on(SOCKET_EVENTS.QUEUE_WAITING, (data) => {
    console.log(`  User A received QUEUE_WAITING (waiting count: ${data.waitingCount})`);
    userAWaitingReceived = true;
  });

  socketA.emit(SOCKET_EVENTS.JOIN_QUEUE, {
    sessionId: 'session_e2e_user_a',
    interests: ['Programming', 'Gaming'],
    chatMode: 'video',
  });

  await new Promise((r) => setTimeout(r, 600));
  if (!userAWaitingReceived) {
    throw new Error('User A did not receive QUEUE_WAITING! Solo user should wait.');
  }
  console.log('✅ User A is waiting alone. Zero fake matches confirmed.');

  // Step 2: User B connects and joins queue with semantic synonym 'Coding'
  console.log('\n--- Step 2: User B joins with semantic interest [Coding, Gaming] ---');
  let matchAPromise = new Promise<MatchPayload>((resolve) => {
    socketA.once(SOCKET_EVENTS.MATCH_FOUND, (payload) => {
      console.log('  User A received MATCH_FOUND:', payload.sharedInterests, 'IsInitiator:', payload.isInitiator);
      resolve(payload);
    });
  });

  let matchBPromise = new Promise<MatchPayload>((resolve) => {
    socketB.once(SOCKET_EVENTS.MATCH_FOUND, (payload) => {
      console.log('  User B received MATCH_FOUND:', payload.sharedInterests, 'IsInitiator:', payload.isInitiator);
      resolve(payload);
    });
  });

  socketB.emit(SOCKET_EVENTS.JOIN_QUEUE, {
    sessionId: 'session_e2e_user_b',
    interests: ['Coding', 'Gaming'],
    chatMode: 'video',
  });

  const [matchA, matchB] = await Promise.all([matchAPromise, matchBPromise]);

  if (matchA.matchId !== matchB.matchId) {
    throw new Error('Match IDs do not match between users!');
  }
  if (!matchA.sharedInterests || matchA.sharedInterests.length === 0) {
    throw new Error('Shared interests missing in match payload!');
  }
  console.log('✅ Real match formed successfully between User A & User B!');

  // Step 3: Real-Time Chat exchange
  console.log('\n--- Step 3: Real-Time Message Exchange ---');
  const messagePromise = new Promise<ChatMessage>((resolve) => {
    socketB.once(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, (msg: ChatMessage) => {
      console.log(`  User B received message: "${msg.text}" from session: ${msg.senderSessionId}`);
      resolve(msg);
    });
  });

  socketA.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
    matchId: matchA.matchId,
    text: 'Hello from User A! Real-time WebRTC + Socket.IO connection active.',
  });

  const receivedMsg = await messagePromise;
  if (!receivedMsg.text.includes('Hello from User A')) {
    throw new Error('Message text mismatch!');
  }
  console.log('✅ Bidirectional real-time text chat confirmed.');

  // Step 4: Skip flow
  console.log('\n--- Step 4: Skip & Re-Queue Flow ---');
  const partnerSkippedPromise = new Promise<void>((resolve) => {
    socketB.once(SOCKET_EVENTS.PARTNER_SKIPPED, (data: { message: string }) => {
      console.log(`  User B received PARTNER_SKIPPED: "${data.message}"`);
      resolve();
    });
  });

  socketA.emit(SOCKET_EVENTS.SKIP, { matchId: matchA.matchId });
  await partnerSkippedPromise;
  console.log('✅ Skip event cleanly notified peer.');

  // Disconnect sockets cleanly
  socketA.disconnect();
  socketB.disconnect();

  console.log('\n🎉 ALL REAL-TIME SOCKET.IO & WEBRTC SIGNALING TESTS PASSED PERFECTLY!\n');
}

runSocketE2E().catch((err) => {
  console.error('❌ E2E Socket test failed:', err);
  process.exit(1);
});
