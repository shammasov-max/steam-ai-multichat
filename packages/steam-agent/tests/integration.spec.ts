import { test, expect } from '@playwright/test';
import { createSteamAgent } from '../src/index.js';
import { getTestAccountPair, TestAccount } from './fixtures.js';

// Debug logging helper
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
    allChatHistories.forEach((chat, index) => {
      console.log(`  Chat [${index + 1}] with ${chat.steamID}:`);
      chat.messages.forEach((msg, msgIndex) => {
        console.log(`    [${msgIndex + 1}] ${msg.direction}: "${msg.message}" (${new Date(msg.timestamp).toISOString()})`);
      });
    });
  }
  console.log('========================\n');
}

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
      if (steamID === targetSteamID && relationship === expectedRelationship) {
        clearTimeout(timer);
        agent.off('friendRelationship', handler);
        resolve();
      }
    };

    agent.on('friendRelationship', handler);
  });
}

test('Steam friendship workflow integration test', async () => {
  const [userAAccount, userBAccount] = await getTestAccountPair();
  
  console.log(`Testing with User A: ${userAAccount.login} and User B: ${userBAccount.login}`);

  // Create agents
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
    await agentA.login();
    await waitForEvent(agentA, 'loggedOn');
    
    userASteamID = agentA.getSteamID()!;
    expect(userASteamID).toBeTruthy();
    console.log(`User A logged in with SteamID: ${userASteamID}`);

    logAgentState('User A (after login)', agentA);

    // Remove all existing friends for User A
    const existingFriends = agentA.getFriends();
    console.log(`User A has ${existingFriends.length} existing friends, removing them...`);
    
    for (const friend of existingFriends) {
      await agentA.removeFriend(friend.steamID);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    }

    logAgentState('User A (after friend cleanup)', agentA);

    // Step 2: User B login
    console.log('Step 2: User B login...');
    await agentB.login();
    await waitForEvent(agentB, 'loggedOn');
    
    userBSteamID = agentB.getSteamID()!;
    expect(userBSteamID).toBeTruthy();
    console.log(`User B logged in with SteamID: ${userBSteamID}`);

    logAgentState('User B (after login)', agentB);

    // Step 3: User B sends friend request to User A
    console.log('Step 3: User B sends friend request...');
    
    // Set up listener for User A to receive friend request
    const friendRequestPromise = waitForFriendRelationship(agentA, userBSteamID, 2); // 2 = incoming friend request
    
    await agentB.addFriend(userASteamID);
    
    // Wait for User A to receive the friend request
    await friendRequestPromise;
    console.log('User A received friend request from User B');

    logAgentState('User A (after receiving friend request)', agentA);
    logAgentState('User B (after sending friend request)', agentB);

    // Step 4: User A accepts friend request
    console.log('Step 4: User A accepts friend request...');
    
    // Set up listener for User B to receive acceptance
    const friendAcceptedPromise = waitForFriendRelationship(agentB, userASteamID, 3); // 3 = friend
    
    await agentA.addFriend(userBSteamID);
    
    // Wait for User B to receive acceptance
    await friendAcceptedPromise;
    console.log('User B received friend request acceptance');

    logAgentState('User A (after accepting friend request)', agentA);
    logAgentState('User B (after friend request accepted)', agentB);

    // Step 5: User B sends message to User A
    console.log('Step 5: User B sends message...');
    const currentTime = new Date().toISOString();
    const message = `This is message from ${userBSteamID} time ${currentTime}`;
    
    // Set up listener for User A to receive message
    const messagePromise = waitForEvent<[string, string]>(agentA, 'friendMessage');
    
    await agentB.sendMessage(userASteamID, message);
    
    // Wait for User A to receive the message
    const [senderSteamID, receivedMessage] = await messagePromise;
    expect(senderSteamID).toBe(userBSteamID);
    expect(receivedMessage).toBe(message);
    console.log('User A received message from User B');

    logAgentState('User A (after receiving message)', agentA);
    logAgentState('User B (after sending message)', agentB);

    // Wait a bit for state to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Validate User A has exactly 1 friend and 0 friend requests
    console.log('Step 6: Validating final state...');
    const userAFriends = agentA.getFriends();
    const friendsOnly = userAFriends.filter(f => f.relationship === 3); // 3 = friend
    const pendingRequests = userAFriends.filter(f => f.relationship === 2); // 2 = incoming request
    
    expect(friendsOnly.length).toBe(1);
    expect(pendingRequests.length).toBe(0);
    expect(friendsOnly[0].steamID).toBe(userBSteamID);
    console.log(`User A has ${friendsOnly.length} friends and ${pendingRequests.length} pending requests ✓`);

    // Step 7: Validate User A has chat history with User B with exactly 1 message
    const chatHistory = agentA.getChatHistory(userBSteamID);
    expect(chatHistory.messages.length).toBe(1);
    expect(chatHistory.messages[0].message).toBe(message);
    expect(chatHistory.messages[0].direction).toBe('incoming');
    expect(chatHistory.messages[0].steamID).toBe(userBSteamID);
    console.log(`User A has chat history with 1 message from User B ✓`);

    console.log('All test steps completed successfully! ✅');

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('Cleaning up...');
    try {
      agentA.logout();
      agentB.logout();
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
  }
});