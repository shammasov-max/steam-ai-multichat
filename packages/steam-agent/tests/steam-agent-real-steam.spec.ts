import { test, expect } from '@playwright/test';
import { createSteamAgent } from '../src/index.js';
import { getTestAccountPair } from './fixtures.js';

// Helper function to wait for event with timeout
function waitForEvent<T>(emitter: any, eventName: string, timeout = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    emitter.once(eventName, (...args: any[]) => {
      clearTimeout(timer);
      resolve(args.length === 1 ? args[0] : args as T);
    });
  });
}

// Helper function to wait for specific friend relationship event
function waitForFriendRelationship(agent: any, targetSteamID: string, expectedRelationship: number, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for friend relationship change for ${targetSteamID}`));
    }, timeout);

    const handler = (steamID: string, relationship: number) => {
      console.log(`Friend relationship event: ${steamID} -> ${relationship} (expecting ${expectedRelationship})`);
      if (steamID === targetSteamID && relationship === expectedRelationship) {
        clearTimeout(timer);
        agent.off('friendRelationship', handler);
        resolve();
      }
    };

    agent.on('friendRelationship', handler);
  });
}

// Debug logging helper with enhanced chat history display
function logAgentState(agentName: string, agent: any) {
  const friends = agent.getFriends();
  const steamID = agent.getSteamID();
  const isLoggedIn = agent.getIsLoggedIn();
  
  console.log(`\n=== ${agentName} State ===`);
  console.log(`SteamID: ${steamID}`);
  console.log(`Logged In: ${isLoggedIn}`);
  console.log(`Friends Count: ${friends.length}`);
  
  if (friends.length > 0) {
    console.log('Friends List:');
    friends.forEach((friend, index) => {
      console.log(`  [${index + 1}] ${friend.steamID} - ${friend.personaName} (rel: ${friend.relationship})`);
    });
  }
  
  const allChatHistories = agent.getAllChatHistories();
  console.log(`Chat Histories Count: ${allChatHistories.length}`);
  
  if (allChatHistories.length > 0) {
    console.log('💬 FULL CHAT HISTORIES:');
    allChatHistories.forEach((chat, index) => {
      console.log(`\n  📱 Chat [${index + 1}] with SteamID: ${chat.steamID}`);
      console.log(`     Total Messages: ${chat.messages.length}`);
      if (chat.messages.length > 0) {
        console.log('     Message History:');
        chat.messages.forEach((msg: any, msgIndex: number) => {
          const timestamp = new Date(msg.timestamp).toISOString();
          const direction = msg.direction === 'incoming' ? '⬅️' : '➡️';
          console.log(`       ${direction} [${msgIndex + 1}] ${msg.direction.toUpperCase()}: "${msg.message}"`);
          console.log(`           📅 ${timestamp}`);
          console.log(`           👤 From: ${msg.steamID}`);
        });
      } else {
        console.log('     🔇 No messages in this chat');
      }
    });
  } else {
    console.log('💬 No chat histories found');
  }
  console.log('========================\n');
}

// Additional function to show chat history evolution
function logChatHistoryEvolution(stepName: string, agentA: any, agentB: any) {
  console.log(`\n🔍 === CHAT HISTORY EVOLUTION: ${stepName} ===`);
  
  const historyA = agentA.getAllChatHistories();
  const historyB = agentB.getAllChatHistories();
  
  console.log(`📊 User A has ${historyA.length} chat histories`);
  console.log(`📊 User B has ${historyB.length} chat histories`);
  
  // Show total message counts
  const totalMessagesA = historyA.reduce((sum: number, chat: any) => sum + chat.messages.length, 0);
  const totalMessagesB = historyB.reduce((sum: number, chat: any) => sum + chat.messages.length, 0);
  
  console.log(`📈 User A total messages: ${totalMessagesA}`);
  console.log(`📈 User B total messages: ${totalMessagesB}`);
  
  // Show latest messages from each chat
  historyA.forEach((chat: any, index: number) => {
    if (chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      console.log(`🔹 User A's latest from ${chat.steamID}: "${lastMsg.message}" (${lastMsg.direction})`);
    }
  });
  
  historyB.forEach((chat: any, index: number) => {
    if (chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      console.log(`🔸 User B's latest from ${chat.steamID}: "${lastMsg.message}" (${lastMsg.direction})`);
    }
  });
  
  console.log('================================================\n');
}

test('Real Steam friendship workflow integration test', async () => {
  const [userAAccount, userBAccount] = await getTestAccountPair();
  
  console.log(`🚀 Testing with REAL Steam accounts:`);
  console.log(`User A: ${userAAccount.login}`);
  console.log(`User B: ${userBAccount.login}`);

  // Create real Steam agents
  const agentA = createSteamAgent({
    maFile: userAAccount.maFile,
    password: userAAccount.password,
    userName: userAAccount.login,
    proxy: userAAccount.proxy
  });

  const agentB = createSteamAgent({
    maFile: userBAccount.maFile,
    password: userBAccount.password,
    userName: userBAccount.login,
    proxy: userBAccount.proxy
  });

  let userASteamID: string;
  let userBSteamID: string;

  try {
    // Step 1: User A login and remove all friends
    console.log('Step 1: User A login and cleanup...');
    
    // Set up login event listener before calling login
    const loginPromiseA = waitForEvent(agentA, 'loggedOn', 30000);
    await agentA.login();
    await loginPromiseA;
    
    userASteamID = agentA.getSteamID()!;
    expect(userASteamID).toBeTruthy();
    console.log(`✅ User A logged in with SteamID: ${userASteamID}`);

    logAgentState('User A (after login)', agentA);
    logChatHistoryEvolution('After User A Login', agentA, agentB);

    // Remove all existing friends for User A
    const existingFriends = agentA.getFriends();
    console.log(`User A has ${existingFriends.length} existing friends, removing them...`);
    
    for (const friend of existingFriends) {
      console.log(`Removing friend: ${friend.steamID}`);
      await agentA.removeFriend(friend.steamID);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Slower rate limit for real Steam
    }

    // Wait a bit for Steam to process removals
    await new Promise(resolve => setTimeout(resolve, 5000));
    logAgentState('User A (after friend cleanup)', agentA);
    logChatHistoryEvolution('After Friend Cleanup', agentA, agentB);

    // Step 2: User B login
    console.log('Step 2: User B login...');
    
    // Set up login event listener before calling login
    const loginPromiseB = waitForEvent(agentB, 'loggedOn', 30000);
    await agentB.login();
    await loginPromiseB;
    
    userBSteamID = agentB.getSteamID()!;
    expect(userBSteamID).toBeTruthy();
    console.log(`✅ User B logged in with SteamID: ${userBSteamID}`);

    logAgentState('User B (after login)', agentB);
    logChatHistoryEvolution('After User B Login', agentA, agentB);

    // Step 3: User B sends friend request to User A
    console.log('Step 3: User B sends friend request...');
    
    // Set up listener for User A to receive friend request
    const friendRequestPromise = waitForFriendRelationship(agentA, userBSteamID, 2); // 2 = incoming friend request
    
    await agentB.addFriend(userASteamID);
    console.log('Friend request sent...');
    
    // Wait for User A to receive the friend request
    await friendRequestPromise;
    console.log('✅ User A received friend request from User B');

    logAgentState('User A (after receiving friend request)', agentA);
    logAgentState('User B (after sending friend request)', agentB);
    logChatHistoryEvolution('After Friend Request', agentA, agentB);

    // Step 4: User A accepts friend request
    console.log('Step 4: User A accepts friend request...');
    
    // Set up listener for User B to receive acceptance
    const friendAcceptedPromise = waitForFriendRelationship(agentB, userASteamID, 3); // 3 = friend
    
    await agentA.addFriend(userBSteamID);
    console.log('Friend request acceptance sent...');
    
    // Wait for User B to receive acceptance
    await friendAcceptedPromise;
    console.log('✅ User B received friend request acceptance');

    logAgentState('User A (after accepting friend request)', agentA);
    logAgentState('User B (after friend request accepted)', agentB);
    logChatHistoryEvolution('After Friend Request Accepted', agentA, agentB);

    // Step 5: User B sends message to User A
    console.log('Step 5: User B sends test message...');
    const currentTime = new Date().toISOString();
    const message = `This is REAL Steam message from ${userBSteamID} time ${currentTime}`;
    
    // Set up listener for User A to receive message
    const messagePromise = waitForEvent<[string, string]>(agentA, 'friendMessage', 30000);
    
    await agentB.sendMessage(userASteamID, message);
    console.log('Message sent...');
    
    // Wait for User A to receive the message
    const [senderSteamID, receivedMessage] = await messagePromise;
    expect(senderSteamID).toBe(userBSteamID);
    expect(receivedMessage).toBe(message);
    console.log('✅ User A received message from User B');

    logAgentState('User A (after receiving message)', agentA);
    logAgentState('User B (after sending message)', agentB);
    logChatHistoryEvolution('After Message Exchange', agentA, agentB);

    // Wait a bit for state to settle
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 6: Validate User A has exactly 1 friend and 0 friend requests
    console.log('Step 6: Validating final state...');
    const userAFriends = agentA.getFriends();
    const friendsOnly = userAFriends.filter(f => f.relationship === 3); // 3 = friend
    const pendingRequests = userAFriends.filter(f => f.relationship === 2); // 2 = incoming request
    
    expect(friendsOnly.length).toBe(1);
    expect(pendingRequests.length).toBe(0);
    expect(friendsOnly[0].steamID).toBe(userBSteamID);
    console.log(`✅ User A has ${friendsOnly.length} friends and ${pendingRequests.length} pending requests`);

    // Step 7: Validate User A has chat history with User B with exactly 1 message
    const chatHistory = agentA.getChatHistory(userBSteamID);
    expect(chatHistory.messages.length).toBe(1);
    expect(chatHistory.messages[0].message).toBe(message);
    expect(chatHistory.messages[0].direction).toBe('incoming');
    expect(chatHistory.messages[0].steamID).toBe(userBSteamID);
    console.log(`✅ User A has chat history with 1 message from User B`);

    console.log('\n🎉 REAL STEAM TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log('All friendship workflow steps validated with actual Steam accounts.');

  } catch (error) {
    console.error('❌ Real Steam test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up Steam connections...');
    try {
      agentA.logout();
      agentB.logout();
      
      // Give Steam time to process logout
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.warn('Cleanup warning:', e);
    }
  }
});