import sinon from 'sinon';
import { DialogStatus } from '@prisma/client';

export class MockPrisma {
  private static instance: MockPrisma;
  private mockClient: any;

  constructor() {
    this.setupMocks();
  }

  static getInstance(): MockPrisma {
    if (!MockPrisma.instance) {
      MockPrisma.instance = new MockPrisma();
    }
    return MockPrisma.instance;
  }

  private setupMocks() {
    this.mockClient = {
      dialog: {
        create: sinon.stub(),
        findUnique: sinon.stub(),
        findMany: sinon.stub(),
        update: sinon.stub(),
        delete: sinon.stub(),
        deleteMany: sinon.stub()
      },
      message: {
        create: sinon.stub(),
        findMany: sinon.stub(),
        deleteMany: sinon.stub()
      },
      dialogState: {
        create: sinon.stub(),
        findMany: sinon.stub(),
        deleteMany: sinon.stub()
      },
      log: {
        create: sinon.stub(),
        findMany: sinon.stub(),
        deleteMany: sinon.stub()
      },
      $disconnect: sinon.stub().resolves()
    };
  }

  getMockClient() {
    return this.mockClient;
  }

  mockDialogCreation(dialogId: string = 'test-dialog-id') {
    this.mockClient.dialog.create.resolves({
      id: dialogId,
      externalId: 'ext-123',
      status: DialogStatus.ACTIVE,
      language: 'en',
      goal: 'Test goal',
      completionCriteria: { type: 'user_agreement' },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.mockClient.dialogState.create.resolves({
      id: 'state-123',
      dialogId,
      continuationScore: 1.0,
      currentStrategy: 'initial',
      tokensUsed: 0,
      goalProgress: 0,
      createdAt: new Date()
    });
  }

  mockDialogRetrieval(dialogId: string, includeMessages: boolean = true) {
    const mockDialog = {
      id: dialogId,
      externalId: 'ext-123',
      status: DialogStatus.ACTIVE,
      language: 'en',
      goal: 'Test goal',
      completionCriteria: { type: 'user_agreement' },
      userInfo: { age: 25, games: ['game1'] },
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: includeMessages ? [
        {
          id: 'msg-1',
          role: 'USER',
          content: 'Hello',
          sequenceNumber: 1,
          createdAt: new Date()
        },
        {
          id: 'msg-2', 
          role: 'ASSISTANT',
          content: 'Hi there!',
          sequenceNumber: 2,
          createdAt: new Date()
        }
      ] : [],
      states: [
        {
          id: 'state-1',
          continuationScore: 0.8,
          currentStrategy: 'engagement',
          tokensUsed: 150,
          goalProgress: 0.3,
          createdAt: new Date()
        }
      ]
    };

    this.mockClient.dialog.findUnique.resolves(mockDialog);
  }

  mockMessageCreation(messageId: string = 'new-msg-id') {
    this.mockClient.message.create.resolves({
      id: messageId,
      dialogId: 'test-dialog-id',
      role: 'USER',
      content: 'Test message',
      sequenceNumber: 3,
      createdAt: new Date()
    });
  }

  mockDialogStateCreation() {
    this.mockClient.dialogState.create.resolves({
      id: 'new-state-id',
      dialogId: 'test-dialog-id',
      continuationScore: 0.7,
      currentStrategy: 'persuasion',
      tokensUsed: 300,
      goalProgress: 0.5,
      createdAt: new Date()
    });
  }

  mockLogCreation() {
    this.mockClient.log.create.resolves({
      id: 1,
      dialogId: 'test-dialog-id',
      level: 'INFO',
      data: { action: 'test' },
      text: 'Test log',
      datetime: new Date()
    });
  }

  mockDialogNotFound() {
    this.mockClient.dialog.findUnique.resolves(null);
  }

  mockDatabaseError(error: Error) {
    this.mockClient.dialog.create.rejects(error);
    this.mockClient.dialog.findUnique.rejects(error);
    this.mockClient.message.create.rejects(error);
  }

  mockDialogUpdate(dialogId: string, newStatus: DialogStatus) {
    this.mockClient.dialog.update.resolves({
      id: dialogId,
      status: newStatus,
      updatedAt: new Date()
    });
  }

  reset() {
    Object.values(this.mockClient).forEach((model: any) => {
      if (typeof model === 'object') {
        Object.values(model).forEach((method: any) => {
          if (typeof method?.reset === 'function') {
            method.reset();
          }
        });
      }
    });
  }

  getCallHistory() {
    return {
      dialogCreates: this.mockClient.dialog.create.getCalls(),
      dialogFinds: this.mockClient.dialog.findUnique.getCalls(),
      messageCreates: this.mockClient.message.create.getCalls(),
      stateCreates: this.mockClient.dialogState.create.getCalls(),
      logCreates: this.mockClient.log.create.getCalls()
    };
  }

  verifyDialogCreated(externalId: string) {
    const calls = this.mockClient.dialog.create.getCalls();
    const createCall = calls.find((call: any) => 
      call.args[0].data.externalId === externalId
    );
    
    if (!createCall) {
      throw new Error(`Dialog with externalId "${externalId}" was not created`);
    }
  }
}