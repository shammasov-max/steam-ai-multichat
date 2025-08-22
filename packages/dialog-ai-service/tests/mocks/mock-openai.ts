import sinon from 'sinon';

export class MockOpenAI {
  private static instance: MockOpenAI;
  private chatStub: sinon.SinonStub;
  private modelsStub: sinon.SinonStub;

  constructor() {
    this.setupMocks();
  }

  static getInstance(): MockOpenAI {
    if (!MockOpenAI.instance) {
      MockOpenAI.instance = new MockOpenAI();
    }
    return MockOpenAI.instance;
  }

  private setupMocks() {
    // Mock chat completions
    this.chatStub = sinon.stub().returns({
      create: sinon.stub().resolves({
        choices: [
          {
            message: {
              content: 'This is a mocked AI response for testing purposes.'
            }
          }
        ],
        usage: {
          total_tokens: 150,
          prompt_tokens: 100,
          completion_tokens: 50
        }
      })
    });

    // Mock models list
    this.modelsStub = sinon.stub().returns({
      list: sinon.stub().resolves({
        data: [
          { id: 'gpt-4-turbo-preview' },
          { id: 'gpt-3.5-turbo' }
        ]
      })
    });
  }

  getMockClient() {
    return {
      chat: {
        completions: this.chatStub()
      },
      models: this.modelsStub()
    };
  }

  mockSuccessfulResponse(content: string, tokens: number = 150) {
    this.chatStub().create.resolves({
      choices: [{ message: { content } }],
      usage: { total_tokens: tokens }
    });
  }

  mockError(error: Error) {
    this.chatStub().create.rejects(error);
  }

  mockChineseResponse() {
    this.mockSuccessfulResponse('这是一个很好的游戏指导服务，可以帮助您提高技能。', 120);
  }

  mockJapaneseResponse() {
    this.mockSuccessfulResponse('素晴らしいゲームコーチングサービスです。スキル向上をお手伝いします。', 130);
  }

  mockRejectionResponse() {
    this.mockSuccessfulResponse('I understand your concerns. Let me address them...', 140);
  }

  mockAgreementResponse() {
    this.mockSuccessfulResponse('Excellent! I\'ll help you get started with our service.', 100);
  }

  mockLongResponse() {
    const longContent = 'This is a very long response that exceeds normal limits. '.repeat(50);
    this.mockSuccessfulResponse(longContent, 500);
  }

  mockConnectionError() {
    this.mockError(new Error('OpenAI API connection failed'));
  }

  mockRateLimitError() {
    this.mockError(new Error('Rate limit exceeded'));
  }

  mockInvalidAPIKeyError() {
    this.mockError(new Error('Invalid API key'));
  }

  reset() {
    this.chatStub().create.reset();
    this.modelsStub().list.reset();
  }

  getCallHistory() {
    return {
      chatCalls: this.chatStub().create.getCalls(),
      modelCalls: this.modelsStub().list.getCalls()
    };
  }

  verifyLastCall(expectedContent: string) {
    const calls = this.chatStub().create.getCalls();
    const lastCall = calls[calls.length - 1];
    const messages = lastCall.args[0].messages;
    const userMessage = messages.find((m: any) => m.role === 'user');
    
    if (!userMessage || !userMessage.content.includes(expectedContent)) {
      throw new Error(`Expected last call to contain "${expectedContent}"`);
    }
  }
}