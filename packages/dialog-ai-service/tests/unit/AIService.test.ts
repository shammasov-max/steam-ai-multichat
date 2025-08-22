import { test, expect } from '@playwright/test';
import { AIService } from '../../src/services/AIService';
import { MockOpenAI } from '../mocks/mock-openai';
import { TestData } from '../fixtures/test-data';

test.describe('AIService Unit Tests', () => {
  let aiService: AIService;
  let mockOpenAI: MockOpenAI;

  test.beforeEach(() => {
    mockOpenAI = MockOpenAI.getInstance();
    mockOpenAI.reset();
    
    // Create AIService with mock client
    aiService = new AIService({ 
      apiKey: 'test-key',
      model: 'gpt-4-turbo-preview',
      maxTokensPerRequest: 8000
    });
    
    // Replace the OpenAI client with our mock
    (aiService as any).openai = mockOpenAI.getMockClient();
  });

  test.afterEach(() => {
    mockOpenAI.reset();
  });

  test('should initialize with default configuration', () => {
    const service = new AIService({ apiKey: 'test-key' });
    expect((service as any).config.model).toBe('gpt-4-turbo-preview');
    expect((service as any).config.maxTokensPerRequest).toBe(8000);
  });

  test('should initialize with custom configuration', () => {
    const service = new AIService({ 
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
      maxTokensPerRequest: 4000
    });
    expect((service as any).config.model).toBe('gpt-3.5-turbo');
    expect((service as any).config.maxTokensPerRequest).toBe(4000);
  });

  test('should generate response for English conversation', async () => {
    mockOpenAI.mockSuccessfulResponse('Hello! I can help you with our gaming service.', 150);

    const context = {
      summary: 'New conversation',
      keyFacts: [],
      recentMessages: [
        { role: 'user' as const, content: 'Hello' }
      ],
      goal: 'Offer gaming service',
      userInfo: { age: 25 }
    };

    const result = await aiService.generateResponse(
      context,
      'Tell me about your service',
      'en',
      { type: 'user_agreement', keywords: ['yes', 'agree'] }
    );

    expect(result.text).toBe('Hello! I can help you with our gaming service.');
    expect(result.tokensUsed).toBe(150);
    expect(typeof result.strategy).toBe('string');
  });

  test('should generate response for Chinese conversation', async () => {
    mockOpenAI.mockChineseResponse();

    const context = {
      summary: '新对话开始',
      keyFacts: [],
      recentMessages: [
        { role: 'user' as const, content: '你好' }
      ],
      goal: '提供游戏服务',
      userInfo: { age: 25 }
    };

    const result = await aiService.generateResponse(
      context,
      '告诉我关于你们的服务',
      'zh',
      { type: 'user_agreement', keywords: ['是的', '同意'] }
    );

    expect(result.text).toContain('游戏指导服务');
    expect(result.tokensUsed).toBe(120);
  });

  test('should generate response for Japanese conversation', async () => {
    mockOpenAI.mockJapaneseResponse();

    const context = {
      summary: '新しい会話',
      keyFacts: [],
      recentMessages: [
        { role: 'user' as const, content: 'こんにちは' }
      ],
      goal: 'ゲームサービスを提供',
      userInfo: { age: 25 }
    };

    const result = await aiService.generateResponse(
      context,
      'サービスについて教えてください',
      'ja',
      { type: 'user_agreement', keywords: ['はい', '同意'] }
    );

    expect(result.text).toContain('ゲームコーチング');
    expect(result.tokensUsed).toBe(130);
  });

  test('should handle completion criteria for user agreement', async () => {
    mockOpenAI.mockAgreementResponse();

    const context = {
      summary: 'User is considering the service',
      keyFacts: ['User asked about pricing'],
      recentMessages: [
        { role: 'user' as const, content: 'How much does it cost?' },
        { role: 'assistant' as const, content: 'It\'s $29.99 per month' }
      ],
      goal: 'Get user to agree to subscription',
      userInfo: { age: 30 }
    };

    const result = await aiService.generateResponse(
      context,
      'Okay, I agree to try it',
      'en',
      { 
        type: 'user_agreement', 
        keywords: ['yes', 'agree', 'okay', 'sure'] 
      }
    );

    expect(result.text).toContain('Excellent');
    expect(result.tokensUsed).toBe(100);
  });

  test('should handle completion criteria for link requirement', async () => {
    mockOpenAI.mockSuccessfulResponse('Here is your registration link: https://example.com/register', 180);

    const context = {
      summary: 'User agreed to service',
      keyFacts: ['User wants to sign up'],
      recentMessages: [
        { role: 'user' as const, content: 'I want to sign up' }
      ],
      goal: 'Provide registration link',
      userInfo: { age: 28 }
    };

    const result = await aiService.generateResponse(
      context,
      'Send me the link',
      'en',
      { 
        type: 'link_sent',
        requiredLinkPattern: 'https://example.com/*'
      }
    );

    expect(result.text).toContain('https://example.com/register');
    expect(result.tokensUsed).toBe(180);
  });

  test('should include user information in system prompt', async () => {
    mockOpenAI.mockSuccessfulResponse('Based on your interest in strategy games...', 160);

    const context = {
      summary: 'User profile established',
      keyFacts: [],
      recentMessages: [],
      goal: 'Personalized service offer',
      userInfo: {
        age: 24,
        games: ['Strategy games', 'RPGs'],
        country: 'USA'
      }
    };

    await aiService.generateResponse(
      context,
      'What can you offer me?',
      'en',
      { type: 'user_agreement' }
    );

    // Verify the system prompt included user info
    const callHistory = mockOpenAI.getCallHistory();
    const lastCall = callHistory.chatCalls[callHistory.chatCalls.length - 1];
    const systemMessage = lastCall.args[0].messages[0];
    
    expect(systemMessage.content).toContain('"age": 24');
    expect(systemMessage.content).toContain('Strategy games');
  });

  test('should include reference context when provided', async () => {
    mockOpenAI.mockSuccessfulResponse('Given the current promotion...', 140);

    const context = {
      summary: 'Promotional context',
      keyFacts: [],
      recentMessages: [],
      goal: 'Offer promotional service',
      userInfo: { age: 25 },
      referenceContext: 'Current 50% off promotion for new users'
    };

    await aiService.generateResponse(
      context,
      'Tell me about offers',
      'en',
      { type: 'user_agreement' }
    );

    const callHistory = mockOpenAI.getCallHistory();
    const lastCall = callHistory.chatCalls[callHistory.chatCalls.length - 1];
    const systemMessage = lastCall.args[0].messages[0];
    
    expect(systemMessage.content).toContain('50% off promotion');
  });

  test('should calculate appropriate max tokens', async () => {
    mockOpenAI.mockSuccessfulResponse('Response with calculated tokens', 200);

    const longContext = {
      summary: 'A'.repeat(1000),
      keyFacts: Array(10).fill('Long fact '.repeat(20)),
      recentMessages: Array(15).fill({ 
        role: 'user' as const, 
        content: 'Long message content '.repeat(50) 
      }),
      goal: 'Goal '.repeat(100),
      userInfo: { age: 25 }
    };

    await aiService.generateResponse(
      longContext,
      'Very long user message '.repeat(100),
      'en',
      { type: 'user_agreement' }
    );

    // Verify the service calculated and used appropriate max tokens
    const callHistory = mockOpenAI.getCallHistory();
    const lastCall = callHistory.chatCalls[callHistory.chatCalls.length - 1];
    const maxTokens = lastCall.args[0].max_tokens;
    
    expect(maxTokens).toBeGreaterThanOrEqual(500);
    expect(maxTokens).toBeLessThanOrEqual(2000);
  });

  test('should extract strategy from response', async () => {
    mockOpenAI.mockSuccessfulResponse(
      '[STRATEGY: persuasion] This is a great opportunity for you to improve your gaming skills!',
      150
    );

    const context = {
      summary: 'User is hesitant',
      keyFacts: [],
      recentMessages: [],
      goal: 'Convince user',
      userInfo: { age: 25 }
    };

    const result = await aiService.generateResponse(
      context,
      'I\'m not sure about this',
      'en',
      { type: 'user_agreement' }
    );

    expect(result.strategy).toBe('persuasion');
    expect(result.text).not.toContain('[STRATEGY:');
  });

  test('should clean internal markers from response', async () => {
    mockOpenAI.mockSuccessfulResponse(
      '[INTERNAL: User seems interested] [STRATEGY: engagement] This is a great service! [INTERNAL: Keep it friendly]',
      150
    );

    const context = {
      summary: 'Clean response test',
      keyFacts: [],
      recentMessages: [],
      goal: 'Test cleaning',
      userInfo: { age: 25 }
    };

    const result = await aiService.generateResponse(
      context,
      'Tell me more',
      'en',
      { type: 'user_agreement' }
    );

    expect(result.text).toBe('This is a great service!');
    expect(result.text).not.toContain('[INTERNAL:');
    expect(result.text).not.toContain('[STRATEGY:');
  });

  test('should handle OpenAI API errors gracefully', async () => {
    mockOpenAI.mockConnectionError();

    const context = {
      summary: 'Error test',
      keyFacts: [],
      recentMessages: [],
      goal: 'Test error handling',
      userInfo: { age: 25 }
    };

    await expect(
      aiService.generateResponse(
        context,
        'This should fail',
        'en',
        { type: 'user_agreement' }
      )
    ).rejects.toThrow('Failed to generate AI response');
  });

  test('should test connection successfully', async () => {
    const result = await aiService.testConnection();
    expect(result).toBe(true);
  });

  test('should handle connection test failure', async () => {
    mockOpenAI.modelsStub().list.rejects(new Error('Connection failed'));
    
    const result = await aiService.testConnection();
    expect(result).toBe(false);
  });

  test('should format recent messages correctly', async () => {
    mockOpenAI.mockSuccessfulResponse('Formatted correctly', 100);

    const context = {
      summary: 'Message formatting test',
      keyFacts: [],
      recentMessages: [
        { role: 'user' as const, content: 'User message 1' },
        { role: 'assistant' as const, content: 'Assistant response 1' },
        { role: 'user' as const, content: 'User message 2' }
      ],
      goal: 'Test formatting',
      userInfo: { age: 25 }
    };

    await aiService.generateResponse(
      context,
      'Current message',
      'en',
      { type: 'user_agreement' }
    );

    const callHistory = mockOpenAI.getCallHistory();
    const lastCall = callHistory.chatCalls[callHistory.chatCalls.length - 1];
    const messages = lastCall.args[0].messages;

    // Check that recent messages are formatted correctly
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('User message 1');
    expect(messages[2].role).toBe('assistant');
    expect(messages[2].content).toBe('Assistant response 1');
    expect(messages[3].role).toBe('user');
    expect(messages[3].content).toBe('User message 2');
    expect(messages[4].role).toBe('user');
    expect(messages[4].content).toBe('Current message');
  });
});