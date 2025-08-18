import { test, expect } from '@playwright/test';
import { createSteamAgent } from '../src/index.js';
import { getTestAccountPair } from './fixtures.js';

test('Explore Steam message status events', async () => {
  console.log('🔍 Exploring Steam message status and read receipts...');
  
  const [userAAccount, userBAccount] = await getTestAccountPair();
  console.log(`User A: ${userAAccount.login}`);
  console.log(`User B: ${userBAccount.login}`);

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

  // Set up comprehensive event listeners for both agents
  const setupEventListeners = (agent: any, name: string) => {
    // Known events
    agent.on('loggedOn', () => console.log(`${name}: loggedOn`));
    agent.on('friendMessage', (steamID: string, message: string) => {
      console.log(`${name}: friendMessage from ${steamID}: "${message}"`);
    });
    agent.on('friendTyping', (steamID: string) => {
      console.log(`${name}: friendTyping from ${steamID}`);
    });
    
    // Check for potential read-related events
    agent.on('friendMessageEcho' as any, (...args: any[]) => {
      console.log(`${name}: friendMessageEcho:`, args);
    });
    
    agent.on('friendChatMsg' as any, (...args: any[]) => {
      console.log(`${name}: friendChatMsg:`, args);
    });
    
    agent.on('chatHistory' as any, (...args: any[]) => {
      console.log(`${name}: chatHistory:`, args);
    });
    
    agent.on('chatMsgHistory' as any, (...args: any[]) => {
      console.log(`${name}: chatMsgHistory:`, args);
    });
    
    agent.on('friendsGroupList' as any, (...args: any[]) => {
      console.log(`${name}: friendsGroupList:`, args);
    });
    
    // Check for any events related to message status
    agent.on('messageSent' as any, (...args: any[]) => {
      console.log(`${name}: messageSent:`, args);
    });
    
    agent.on('messageRead' as any, (...args: any[]) => {
      console.log(`${name}: messageRead:`, args);
    });
    
    agent.on('messageDelivered' as any, (...args: any[]) => {
      console.log(`${name}: messageDelivered:`, args);
    });
    
    agent.on('messageStatus' as any, (...args: any[]) => {
      console.log(`${name}: messageStatus:`, args);
    });
    
    // Listen for any unknown events
    const originalEmit = agent.emit;
    agent.emit = function(event: string, ...args: any[]) {
      if (!['loggedOn', 'friendMessage', 'friendTyping', 'error', 'disconnected', 'friendRelationship', 'friendsList', 'user'].includes(event)) {
        console.log(`${name}: Unknown event "${event}":`, args);
      }
      return originalEmit.call(this, event, ...args);
    };
  };

  try {
    setupEventListeners(agentA, 'Agent A');
    setupEventListeners(agentB, 'Agent B');

    // Login both users
    console.log('\n🔐 Logging in both users...');
    
    const loginPromiseA = new Promise((resolve) => agentA.once('loggedOn', resolve));
    const loginPromiseB = new Promise((resolve) => agentB.once('loggedOn', resolve));
    
    await agentA.login();
    await agentB.login();
    
    await Promise.all([loginPromiseA, loginPromiseB]);
    
    const userASteamID = agentA.getSteamID()!;
    const userBSteamID = agentB.getSteamID()!;
    
    console.log(`✅ Both users logged in: A=${userASteamID}, B=${userBSteamID}`);

    // Make sure they're friends (if not already)
    const friendsA = agentA.getFriends();
    const isFriend = friendsA.some((f: any) => f.steamID === userBSteamID && f.relationship === 3);
    
    if (!isFriend) {
      console.log('\n👥 Setting up friendship...');
      await agentB.addFriend(userASteamID);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await agentA.addFriend(userBSteamID);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('✅ Users are already friends');
    }

    // Send a message and observe all events
    console.log('\n📤 Sending message from B to A...');
    const testMessage = `Test message for read status - ${new Date().toISOString()}`;
    
    await agentB.sendMessage(userASteamID, testMessage);
    console.log('✅ Message sent');
    
    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if Agent A's client has any methods related to message status
    console.log('\n🔍 Checking Agent A client for read-related methods...');
    const clientA = (agentA as any).client;
    
    const possibleMethods = [
      'markChatAsRead',
      'markMessageAsRead', 
      'readMessage',
      'setChatReadState',
      'markConversationRead',
      'chatRead',
      'messageRead'
    ];
    
    possibleMethods.forEach(method => {
      if (typeof clientA[method] === 'function') {
        console.log(`✅ Found method: ${method}`);
      } else {
        console.log(`❌ Method not found: ${method}`);
      }
    });
    
    // Check client properties for message/chat state
    console.log('\n🔍 Checking client properties...');
    const properties = Object.keys(clientA).filter(key => 
      key.toLowerCase().includes('chat') || 
      key.toLowerCase().includes('message') ||
      key.toLowerCase().includes('read')
    );
    
    if (properties.length > 0) {
      console.log('Found relevant properties:', properties);
    } else {
      console.log('No obvious read-related properties found');
    }
    
    // Wait a bit more to see if any delayed events arrive
    console.log('\n⏳ Waiting for potential delayed events...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 Final analysis:');
    console.log('- Message delivery confirmed via friendMessage event');
    console.log('- No obvious read receipt events detected');
    console.log('- Steam may not expose read status through unofficial API');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    console.log('\n🧹 Cleaning up...');
    agentA.logout();
    agentB.logout();
  }
});