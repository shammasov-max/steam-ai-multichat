import { test, expect } from '@playwright/test';
import { ContextCompressor } from '../../src/services/ContextCompressor';
import { TestData } from '../fixtures/test-data';
import { TestHelpers } from '../utils/test-helpers';

test.describe('ContextCompressor Unit Tests', () => {
  let contextCompressor: ContextCompressor;
  let defaultConfig: any;

  test.beforeEach(() => {
    defaultConfig = {
      compressionAfterMessages: 10,
      maxMessagesInContext: 20,
      keepLastMessagesVerbatim: 5
    };
    
    contextCompressor = new ContextCompressor(defaultConfig);
  });

  test.describe('Configuration and Initialization', () => {
    test('should initialize with provided configuration', () => {
      expect((contextCompressor as any).config).toEqual(defaultConfig);
    });

    test('should initialize with default configuration when none provided', () => {
      const compressor = new ContextCompressor();
      expect((compressor as any).config).toEqual({
        compressionAfterMessages: 10,
        maxMessagesInContext: 20,
        keepLastMessagesVerbatim: 5
      });
    });

    test('should use custom configuration values', () => {
      const customConfig = {
        compressionAfterMessages: 15,
        maxMessagesInContext: 30,
        keepLastMessagesVerbatim: 8
      };
      
      const compressor = new ContextCompressor(customConfig);
      expect((compressor as any).config).toEqual(customConfig);
    });
  });

  test.describe('Basic Compression', () => {
    test('should compress simple conversation without summary for few messages', async () => {
      const messages = TestHelpers.createMockMessages(5);
      const goal = 'Test goal';
      const userInfo = { age: 25 };
      
      const result = await contextCompressor.compress(messages, goal, userInfo);
      
      expect(result.summary).toBe('');
      expect(result.keyFacts).toBeInstanceOf(Array);
      expect(result.recentMessages).toHaveLength(5);
      expect(result.goal).toBe(goal);
      expect(result.userInfo).toEqual(userInfo);
    });

    test('should create summary when message count exceeds threshold', async () => {
      const messages = TestData.compressionScenarios.longConversation;
      const goal = 'Long conversation test';
      
      const result = await contextCompressor.compress(messages, goal);
      
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.recentMessages.length).toBeLessThanOrEqual(defaultConfig.maxMessagesInContext);
    });

    test('should include reference context when provided', async () => {
      const messages = TestHelpers.createMockMessages(3);
      const goal = 'Test with reference';
      const referenceContext = 'Important reference information';
      
      const result = await contextCompressor.compress(messages, goal, null, referenceContext);
      
      expect(result.referenceContext).toBe(referenceContext);
    });

    test('should limit recent messages to configured maximum', async () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message ${i}`,
        createdAt: new Date(Date.now() + i * 1000)
      }));
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      expect(result.recentMessages.length).toBeLessThanOrEqual(defaultConfig.maxMessagesInContext);
    });
  });

  test.describe('Key Facts Extraction', () => {
    test('should extract rejection facts', async () => {
      const messages = [
        { role: 'USER', content: 'No thanks, not interested in this service' },
        { role: 'ASSISTANT', content: 'I understand your concerns' },
        { role: 'USER', content: 'I really don\'t want this' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      const rejectionFacts = result.keyFacts.filter(fact => 
        fact.includes('rejection') || fact.includes('User rejection')
      );
      expect(rejectionFacts.length).toBeGreaterThan(0);
    });

    test('should extract agreement facts', async () => {
      const messages = [
        { role: 'USER', content: 'Yes, I agree to try this service' },
        { role: 'ASSISTANT', content: 'Excellent! Let me set that up' },
        { role: 'USER', content: 'Sure, sounds good to me' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      const agreementFacts = result.keyFacts.filter(fact => 
        fact.includes('agreement') || fact.includes('User agreement')
      );
      expect(agreementFacts.length).toBeGreaterThan(0);
    });

    test('should extract preference facts', async () => {
      const messages = [
        { role: 'USER', content: 'I like strategy games the most' },
        { role: 'ASSISTANT', content: 'Great! We specialize in strategy coaching' },
        { role: 'USER', content: 'I prefer evening sessions' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      const preferenceFacts = result.keyFacts.filter(fact => 
        fact.includes('likes') || fact.includes('prefers')
      );
      expect(preferenceFacts.length).toBeGreaterThan(0);
    });

    test('should extract question facts', async () => {
      const messages = [
        { role: 'USER', content: 'How much does this service cost?' },
        { role: 'ASSISTANT', content: 'Our pricing starts at $29.99' },
        { role: 'USER', content: 'What\'s included in the package?' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      const questionFacts = result.keyFacts.filter(fact => 
        fact.includes('question') || fact.includes('User question')
      );
      expect(questionFacts.length).toBeGreaterThan(0);
    });

    test('should extract personal information facts', async () => {
      const messages = [
        { role: 'USER', content: 'My name is John' },
        { role: 'ASSISTANT', content: 'Nice to meet you John' },
        { role: 'USER', content: 'I am 25 years old' },
        { role: 'ASSISTANT', content: 'Great age for gaming improvement' },
        { role: 'USER', content: 'I live in New York' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      const personalFacts = result.keyFacts.filter(fact => 
        fact.includes('name:') || fact.includes('age:') || fact.includes('location:')
      );
      expect(personalFacts.length).toBeGreaterThan(0);
    });

    test('should limit key facts to 10 items', async () => {
      const messages = Array.from({ length: 20 }, (_, i) => ({
        role: 'USER',
        content: `Important fact number ${i}: I like gaming very much`,
        createdAt: new Date()
      }));
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      expect(result.keyFacts.length).toBeLessThanOrEqual(10);
    });

    test('should deduplicate similar facts', async () => {
      const messages = [
        { role: 'USER', content: 'I like strategy games' },
        { role: 'USER', content: 'I like strategy games' },
        { role: 'USER', content: 'I LIKE STRATEGY GAMES' },
        { role: 'USER', content: 'I really like strategy games' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      // Should not have exact duplicates
      const uniqueFacts = new Set(result.keyFacts);
      expect(uniqueFacts.size).toBe(result.keyFacts.length);
    });
  });

  test.describe('Message Compression', () => {
    test('should keep short messages unchanged', () => {
      const shortMessage = 'Hello there!';
      const compressed = (contextCompressor as any).compressMessage(shortMessage);
      expect(compressed).toBe(shortMessage);
    });

    test('should compress greetings to markers', () => {
      const greetings = [
        'Hello, how are you today?',
        '你好，您好吗？',
        'こんにちは、元気ですか？',
        '안녕하세요, 어떻게 지내세요?',
        'Hola, ¿cómo estás?'
      ];
      
      greetings.forEach(greeting => {
        const compressed = (contextCompressor as any).compressMessage(greeting);
        expect(compressed).toBe('[Greeting exchanged]');
      });
    });

    test('should compress farewells to markers', () => {
      const farewells = [
        'Goodbye, talk to you later!',
        '再见，下次聊！',
        'さようなら、またね！',
        '안녕히 가세요, 다음에 봐요!',
        'Adiós, hasta luego!'
      ];
      
      farewells.forEach(farewell => {
        const compressed = (contextCompressor as any).compressMessage(farewell);
        expect(compressed).toBe('[Farewell message]');
      });
    });

    test('should compress long messages while preserving important content', () => {
      const longMessage = 'This is a very long message that contains important information. '.repeat(20) + 
                          'The price is $99 and I am very interested in this service.';
      
      const compressed = (contextCompressor as any).compressMessage(longMessage);
      
      expect(compressed.length).toBeLessThan(longMessage.length);
      expect(compressed).toContain('...');
    });

    test('should detect and preserve important information in long messages', () => {
      const messageWithImportantInfo = 'This is some regular text. ' +
        'I really don\'t want this service and I refuse the offer. ' +
        'This is more regular text that can be compressed away.';
      
      const compressed = (contextCompressor as any).compressMessage(messageWithImportantInfo);
      
      expect(compressed).toContain('don\'t want');
      expect(compressed).toContain('refuse');
    });

    test('should detect greeting patterns correctly', () => {
      const greetingTexts = [
        'Hi there!',
        'Hello everyone',
        'Hey, what\'s up?',
        'Greetings from me',
        '你好世界',
        '您好，很高兴见到您',
        'こんにちは皆さん',
        'おはようございます',
        '안녕하세요 여러분',
        'Hola amigos',
        'Buenos días'
      ];
      
      greetingTexts.forEach(text => {
        const isGreeting = (contextCompressor as any).isGreeting(text);
        expect(isGreeting).toBe(true);
      });
    });

    test('should detect farewell patterns correctly', () => {
      const farewellTexts = [
        'Bye everyone!',
        'Goodbye and take care',
        'See you later',
        'Talk to you soon',
        '再见大家',
        '拜拜',
        'さようなら皆さん',
        'またね',
        '안녕히 계세요',
        '다음에 봐요',
        'Adiós amigos',
        'Hasta luego'
      ];
      
      farewellTexts.forEach(text => {
        const isFarewell = (contextCompressor as any).isFarewell(text);
        expect(isFarewell).toBe(true);
      });
    });

    test('should detect important information patterns', () => {
      const importantTexts = [
        'No thanks, not interested',
        'Yes, I agree to this',
        'How much does it cost?',
        'The price is $50',
        'My name is John',
        'What are the features?',
        'I refuse this offer'
      ];
      
      importantTexts.forEach(text => {
        const isImportant = (contextCompressor as any).containsImportantInfo(text.toLowerCase());
        expect(isImportant).toBe(true);
      });
    });
  });

  test.describe('Summary Creation', () => {
    test('should create meaningful summary from conversation', async () => {
      const conversationMessages = TestData.compressionScenarios.conversationWithFacts;
      
      const summary = (contextCompressor as any).createSummary(conversationMessages);
      
      expect(summary).toBeTruthy();
      expect(summary.length).toBeGreaterThan(10);
      expect(typeof summary).toBe('string');
    });

    test('should extract topics correctly', () => {
      const messages = [
        { role: 'USER', content: 'I want to improve my gaming skills' },
        { role: 'ASSISTANT', content: 'Our coaching service can help' },
        { role: 'USER', content: 'What\'s the monthly subscription price?' },
        { role: 'ASSISTANT', content: 'Our premium service offers exclusive features' }
      ];
      
      const topics = (contextCompressor as any).extractTopics(messages);
      
      expect(topics).toContain('gaming');
      expect(topics).toContain('coaching');
      expect(topics).toContain('subscription');
      expect(topics).toContain('premium');
    });

    test('should determine user stance correctly', () => {
      const resistantMessages = [
        { role: 'USER', content: 'No thanks' },
        { role: 'USER', content: 'Not interested' },
        { role: 'USER', content: 'Don\'t want it' }
      ];
      
      const stance = (contextCompressor as any).determineUserStance(resistantMessages);
      expect(stance).toBe('resistant');
    });

    test('should determine receptive user stance', () => {
      const receptiveMessages = [
        { role: 'USER', content: 'Yes, I\'m interested' },
        { role: 'USER', content: 'Sure, sounds good' },
        { role: 'USER', content: 'Okay, let\'s do it' }
      ];
      
      const stance = (contextCompressor as any).determineUserStance(receptiveMessages);
      expect(stance).toBe('receptive');
    });

    test('should assess progress correctly', () => {
      const progressMessages = [
        { role: 'USER', content: 'Tell me more' },
        { role: 'ASSISTANT', content: 'Here are the details' },
        { role: 'USER', content: 'Yes, I agree' }
      ];
      
      const progress = (contextCompressor as any).assessProgress(progressMessages);
      expect(progress).toBe('positive trajectory');
    });

    test('should detect mixed signals in progress', () => {
      const mixedMessages = [
        { role: 'USER', content: 'Yes, sounds interesting' },
        { role: 'ASSISTANT', content: 'Great! Here are details' },
        { role: 'USER', content: 'Actually, no thanks' },
        { role: 'ASSISTANT', content: 'I understand' },
        { role: 'USER', content: 'Maybe I\'ll think about it' }
      ];
      
      const progress = (contextCompressor as any).assessProgress(mixedMessages);
      expect(progress).toBe('mixed signals');
    });

    test('should count rejection attempts in summary', async () => {
      const rejectionMessages = [
        { role: 'USER', content: 'No thanks, not interested' },
        { role: 'ASSISTANT', content: 'I understand' },
        { role: 'USER', content: 'I really don\'t want this' },
        { role: 'ASSISTANT', content: 'No problem' }
      ];
      
      const summary = (contextCompressor as any).createSummary(rejectionMessages);
      expect(summary).toContain('rejected');
      expect(summary).toContain('2'); // Two rejections
    });
  });

  test.describe('Recent Messages Processing', () => {
    test('should format recent messages correctly', async () => {
      const messages = [
        { role: 'USER', content: 'First message', createdAt: new Date() },
        { role: 'ASSISTANT', content: 'Second message', createdAt: new Date() },
        { role: 'USER', content: 'Third message', createdAt: new Date() }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      expect(result.recentMessages).toHaveLength(3);
      expect(result.recentMessages[0].role).toBe('user');
      expect(result.recentMessages[1].role).toBe('assistant');
      expect(result.recentMessages[2].role).toBe('user');
      expect(result.recentMessages[0].content).toBe('First message');
    });

    test('should compress individual messages in recent messages', async () => {
      const longMessage = 'This is a very long message. '.repeat(50);
      const messages = [
        { role: 'USER', content: longMessage, createdAt: new Date() }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      expect(result.recentMessages[0].content.length).toBeLessThan(longMessage.length);
    });

    test('should maintain chronological order of recent messages', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message ${i}`,
        createdAt: new Date(Date.now() + i * 1000)
      }));
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      for (let i = 1; i < result.recentMessages.length; i++) {
        const currentIndex = parseInt(result.recentMessages[i].content.split(' ')[1]);
        const previousIndex = parseInt(result.recentMessages[i-1].content.split(' ')[1]);
        expect(currentIndex).toBeGreaterThan(previousIndex);
      }
    });
  });

  test.describe('Multi-language Support', () => {
    test('should handle multilingual conversations', async () => {
      const multilingualMessages = TestData.compressionScenarios.multilingualConversation;
      
      const result = await contextCompressor.compress(multilingualMessages, 'Multilingual test');
      
      expect(result.keyFacts.length).toBeGreaterThanOrEqual(0);
      expect(result.recentMessages.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    test('should detect Chinese rejection patterns', () => {
      const chineseText = '不需要，谢谢';
      const isRejection = (contextCompressor as any).containsRejection(chineseText);
      expect(isRejection).toBe(true);
    });

    test('should detect Chinese agreement patterns', () => {
      const chineseText = '好的，我同意';
      const isAgreement = (contextCompressor as any).containsAgreement(chineseText);
      expect(isAgreement).toBe(true);
    });

    test('should detect Japanese patterns', () => {
      const japaneseRejection = 'いいえ、結構です';
      const japaneseAgreement = 'はい、いいです';
      
      expect((contextCompressor as any).containsRejection(japaneseRejection)).toBe(true);
      expect((contextCompressor as any).containsAgreement(japaneseAgreement)).toBe(true);
    });

    test('should detect Korean patterns', () => {
      const koreanRejection = '아니요, 관심없어요';
      const koreanAgreement = '네, 좋아요';
      
      expect((contextCompressor as any).containsRejection(koreanRejection)).toBe(true);
      expect((contextCompressor as any).containsAgreement(koreanAgreement)).toBe(true);
    });

    test('should detect Spanish patterns', () => {
      const spanishRejection = 'No gracias, no me interesa';
      const spanishAgreement = 'Sí, de acuerdo';
      
      expect((contextCompressor as any).containsRejection(spanishRejection)).toBe(true);
      expect((contextCompressor as any).containsAgreement(spanishAgreement)).toBe(true);
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle empty message list', async () => {
      const result = await contextCompressor.compress([], 'Empty test');
      
      expect(result.summary).toBe('');
      expect(result.keyFacts).toHaveLength(0);
      expect(result.recentMessages).toHaveLength(0);
      expect(result.goal).toBe('Empty test');
    });

    test('should handle null and undefined inputs gracefully', async () => {
      const result = await contextCompressor.compress(
        [], 
        'Test goal', 
        null, 
        undefined
      );
      
      expect(result.userInfo).toBeNull();
      expect(result.referenceContext).toBeUndefined();
    });

    test('should handle messages without created timestamps', async () => {
      const messages = [
        { role: 'USER', content: 'Message without timestamp' },
        { role: 'ASSISTANT', content: 'Response without timestamp' }
      ];
      
      const result = await contextCompressor.compress(messages, 'Test goal');
      
      expect(result.recentMessages).toHaveLength(2);
      expect(result.recentMessages[0].content).toBe('Message without timestamp');
    });

    test('should handle very long goal strings', async () => {
      const veryLongGoal = 'This is a very long goal string. '.repeat(100);
      const messages = TestHelpers.createMockMessages(3);
      
      const result = await contextCompressor.compress(messages, veryLongGoal);
      
      expect(result.goal).toBe(veryLongGoal);
      expect(result.recentMessages.length).toBeGreaterThan(0);
    });

    test('should extract snippet with correct length limit', () => {
      const longText = 'This is a very long text that should be truncated';
      const snippet = (contextCompressor as any).extractSnippet(longText, 20);
      
      expect(snippet.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(snippet).toContain('...');
    });

    test('should not truncate short text in extractSnippet', () => {
      const shortText = 'Short text';
      const snippet = (contextCompressor as any).extractSnippet(shortText, 50);
      
      expect(snippet).toBe(shortText);
      expect(snippet).not.toContain('...');
    });
  });
});