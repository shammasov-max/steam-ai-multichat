import { test, expect } from '@playwright/test';

// Mock SteamAgent for testing internal state without actual Steam connections
class MockSteamAgent {
  private chatHistories: Map<string, any[]> = new Map();
  private friends: any[] = [];
  private steamID: string | null = null;
  private isLoggedIn: boolean = false;

  constructor(private config: any) {}

  // Mock login
  async login(): Promise<void> {
    this.steamID = 'mock_steam_id_' + Date.now();
    this.isLoggedIn = true;
    console.log(`Mock login successful: ${this.steamID}`);
  }

  logout(): void {
    this.isLoggedIn = false;
    this.steamID = null;
  }

  getSteamID(): string | null {
    return this.steamID;
  }

  getIsLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  // Mock friend management
  addFriend(steamID: string): void {
    const existingFriend = this.friends.find(f => f.steamID === steamID);
    if (!existingFriend) {
      this.friends.push({
        steamID,
        personaName: `Mock User ${steamID.slice(-4)}`,
        avatarHash: '',
        relationship: 3, // friend
        personaState: 1
      });
    }
  }

  removeFriend(steamID: string): void {
    this.friends = this.friends.filter(f => f.steamID !== steamID);
  }

  getFriends(): any[] {
    return [...this.friends];
  }

  // Mock messaging
  addMessageToHistory(steamID: string, message: string, direction: 'incoming' | 'outgoing'): void {
    if (!this.chatHistories.has(steamID)) {
      this.chatHistories.set(steamID, []);
    }
    
    const history = this.chatHistories.get(steamID)!;
    history.push({
      steamID,
      message,
      timestamp: Date.now(),
      direction
    });
  }

  sendMessage(steamID: string, message: string): void {
    this.addMessageToHistory(steamID, message, 'outgoing');
  }

  getChatHistory(steamID: string): any {
    return {
      steamID,
      messages: this.chatHistories.get(steamID) || []
    };
  }

  getAllChatHistories(): any[] {
    return Array.from(this.chatHistories.entries()).map(([steamID, messages]) => ({
      steamID,
      messages
    }));
  }

  clearChatHistory(steamID: string): void {
    this.chatHistories.delete(steamID);
  }
}

// Debug logging helper
function logAgentState(agentName: string, agent: MockSteamAgent) {
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
      chat.messages.forEach((msg: any, msgIndex: number) => {
        console.log(`    [${msgIndex + 1}] ${msg.direction}: "${msg.message}" (${new Date(msg.timestamp).toISOString()})`);
      });
    });
  }
  console.log('========================\n');
}

test('Mock Steam friendship workflow with state debugging', async () => {
  console.log('Starting mock Steam friendship workflow test...');
  
  // Create mock agents
  const agentA = new MockSteamAgent({
    maFile: '{"shared_secret":"mock_secret_a"}',
    password: 'mock_password_a',
    userName: 'mock_user_a',
    proxy: 'http://mock:3000'
  });

  const agentB = new MockSteamAgent({
    maFile: '{"shared_secret":"mock_secret_b"}',
    password: 'mock_password_b',
    userName: 'mock_user_b',
    proxy: 'http://mock:3001'
  });

  const agentC = new MockSteamAgent({
    maFile: '{"shared_secret":"mock_secret_c"}',
    password: 'mock_password_c',
    userName: 'mock_user_c',
    proxy: 'http://mock:3002'
  });

  // Step 1: User A login and cleanup
  console.log('Step 1: User A login and cleanup...');
  await agentA.login();
  
  const userASteamID = agentA.getSteamID()!;
  expect(userASteamID).toBeTruthy();
  console.log(`User A logged in with SteamID: ${userASteamID}`);

  logAgentState('User A (after login)', agentA);

  // Simulate existing friends and remove them
  agentA.addFriend('existing_friend_1');
  agentA.addFriend('existing_friend_2');
  logAgentState('User A (with existing friends)', agentA);

  const existingFriends = agentA.getFriends();
  console.log(`User A has ${existingFriends.length} existing friends, removing them...`);
  
  for (const friend of existingFriends) {
    agentA.removeFriend(friend.steamID);
  }

  logAgentState('User A (after friend cleanup)', agentA);

  // Step 2: User B login
  console.log('Step 2: User B login...');
  await agentB.login();
  
  const userBSteamID = agentB.getSteamID()!;
  expect(userBSteamID).toBeTruthy();
  console.log(`User B logged in with SteamID: ${userBSteamID}`);

  logAgentState('User B (after login)', agentB);

  // Step 2.5: User C login
  console.log('Step 2.5: User C login...');
  await agentC.login();
  
  const userCSteamID = agentC.getSteamID()!;
  expect(userCSteamID).toBeTruthy();
  console.log(`User C logged in with SteamID: ${userCSteamID}`);

  logAgentState('User C (after login)', agentC);

  // Step 3: User B sends friend request to User A (simulate)
  console.log('Step 3: User B sends friend request...');
  
  agentA.addFriend(userBSteamID); // User A receives the request
  logAgentState('User A (after receiving friend request)', agentA);
  logAgentState('User B (after sending friend request)', agentB);

  // Step 4: User A accepts friend request (simulate)
  console.log('Step 4: User A accepts friend request...');
  
  agentB.addFriend(userASteamID); // User B receives acceptance
  logAgentState('User A (after accepting friend request)', agentA);
  logAgentState('User B (after friend request accepted)', agentB);

  // Step 5: User A and User B exchange multiple messages
  console.log('Step 5: User A and User B exchange messages...');
  
  const messages = [
    { from: 'B', to: 'A', text: 'Hey! Great to be friends now!' },
    { from: 'A', to: 'B', text: 'Hello! Nice to meet you!' },
    { from: 'B', to: 'A', text: 'How are you doing today?' },
    { from: 'A', to: 'B', text: 'I\'m doing well, thanks for asking!' },
    { from: 'B', to: 'A', text: 'That\'s awesome! What are you up to?' }
  ];

  // Exchange conversation messages
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between messages
    
    if (msg.from === 'B') {
      agentB.sendMessage(userASteamID, msg.text);
      agentA.addMessageToHistory(userBSteamID, msg.text, 'incoming');
      console.log(`User B → User A: "${msg.text}"`);
    } else {
      agentA.sendMessage(userBSteamID, msg.text);
      agentB.addMessageToHistory(userASteamID, msg.text, 'incoming');
      console.log(`User A → User B: "${msg.text}"`);
    }
  }

  console.log('Conversation exchange complete, logging states...');
  logAgentState('User A (after conversation)', agentA);
  logAgentState('User B (after conversation)', agentB);

  // Final timestamped message from User B
  console.log('Step 6: User B sends final timestamped message...');
  const currentTime = new Date().toISOString();
  const finalMessage = `This is message from ${userBSteamID} time ${currentTime}`;
  
  agentB.sendMessage(userASteamID, finalMessage);
  agentA.addMessageToHistory(userBSteamID, finalMessage, 'incoming');
  console.log(`User B → User A (final): "${finalMessage}"`);

  logAgentState('User A (after final message)', agentA);
  logAgentState('User B (after final message)', agentB);

  // Step 6.5: User C sends friend request to User A and exchanges messages
  console.log('Step 6.5: User C sends friend request to User A...');
  
  // User C sends friend request to User A
  agentA.addFriend(userCSteamID); // User A receives friend request from C
  console.log('User A received friend request from User C');
  
  // User A accepts User C's friend request
  agentC.addFriend(userASteamID); // User C receives acceptance
  console.log('User C received friend request acceptance from User A');
  
  logAgentState('User A (after accepting User C)', agentA);
  logAgentState('User C (after being accepted by User A)', agentC);

  // User C sends random message to User A
  const randomMessages = [
    'Hey User A! I\'m the new friend C!',
    'Nice to meet you through Steam!',
    'Hope we can chat more often!'
  ];
  
  const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
  console.log(`User C sends random message: "${randomMessage}"`);
  
  agentC.sendMessage(userASteamID, randomMessage);
  agentA.addMessageToHistory(userCSteamID, randomMessage, 'incoming');
  
  console.log('User C → User A message exchange complete');
  logAgentState('User A (after message from User C)', agentA);
  logAgentState('User C (after sending message to User A)', agentC);

  // Step 7: Validate User A has exactly 2 friends now (B and C)
  console.log('Step 7: Validating final state...');
  const userAFriends = agentA.getFriends();
  
  expect(userAFriends.length).toBe(2);
  
  // Find friends by steamID
  const friendB = userAFriends.find(f => f.steamID === userBSteamID);
  const friendC = userAFriends.find(f => f.steamID === userCSteamID);
  
  expect(friendB).toBeTruthy();
  expect(friendC).toBeTruthy();
  console.log(`User A has ${userAFriends.length} friends (B and C) ✓`);

  // Step 8: Validate User A has TWO separate chat histories
  const allChatHistories = agentA.getAllChatHistories();
  expect(allChatHistories.length).toBe(2);
  console.log(`User A has ${allChatHistories.length} separate chat histories ✓`);

  // Validate chat history with User B (6 messages: 5 conversation + 1 final)
  const chatHistoryB = agentA.getChatHistory(userBSteamID);
  expect(chatHistoryB.messages.length).toBe(6);
  
  // Validate the last message from B is the timestamped one
  const lastMessageB = chatHistoryB.messages[chatHistoryB.messages.length - 1];
  expect(lastMessageB.message).toBe(finalMessage);
  expect(lastMessageB.direction).toBe('incoming');
  expect(lastMessageB.steamID).toBe(userBSteamID);
  
  console.log(`User A has chat history with User B: ${chatHistoryB.messages.length} messages ✓`);
  console.log(`Last message from B: "${lastMessageB.message}" ✓`);

  // Validate chat history with User C (1 message)
  const chatHistoryC = agentA.getChatHistory(userCSteamID);
  expect(chatHistoryC.messages.length).toBe(1);
  
  const messageFromC = chatHistoryC.messages[0];
  expect(messageFromC.message).toBe(randomMessage);
  expect(messageFromC.direction).toBe('incoming');
  expect(messageFromC.steamID).toBe(userCSteamID);
  
  console.log(`User A has chat history with User C: ${chatHistoryC.messages.length} message ✓`);
  console.log(`Message from C: "${messageFromC.message}" ✓`);

  // Demonstrate chat history persistence and growth
  console.log('\n🔍 CHAT HISTORY GROWTH ANALYSIS:');
  console.log(`Total friends: ${userAFriends.length}`);
  console.log(`Total chat histories: ${allChatHistories.length}`);
  console.log(`Messages with User B: ${chatHistoryB.messages.length}`);
  console.log(`Messages with User C: ${chatHistoryC.messages.length}`);
  console.log(`Total messages across all chats: ${chatHistoryB.messages.length + chatHistoryC.messages.length}`);

  console.log('\n=== FINAL STATE SUMMARY ===');
  logAgentState('User A (FINAL)', agentA);
  logAgentState('User B (FINAL)', agentB);
  logAgentState('User C (FINAL)', agentC);

  console.log('All test steps completed successfully! ✅');
});