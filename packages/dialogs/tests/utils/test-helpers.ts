// import { db, logs, dialogStates, dialogMessages, dialogs } from '@packages/db'; // These exports don't exist in @packages/db
import { faker } from '@faker-js/faker';
import { CreateDialogParams } from '../../src/types';
// import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'; // Not using drizzle-orm in this project

export class TestHelpers {
  // static db: PostgresJsDatabase<any> = db; // Removed as db is not available

  static async cleanupDatabase() {
    // Implementation would depend on actual database setup
    console.log('Database cleanup would happen here');
  }

  static async disconnectDatabase() {
    // Implementation would depend on actual database setup
    console.log('Database disconnect would happen here');
  }

  static createMockDialogParams(overrides: Partial<CreateDialogParams> = {}): CreateDialogParams {
    return {
      language: 'en',
      userInfo: {
        country: faker.location.country(),
        city: faker.location.city(),
        age: faker.number.int({ min: 18, max: 65 }),
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        games: [faker.word.noun(), faker.word.noun()]
      },
      goal: 'Offer premium gaming coaching subscription service',
      init: 'You are a friendly sales assistant helping users discover our premium gaming coaching service. Be engaging and helpful.',
      ...overrides
    };
  }

  static createMockMessages(count: number = 5) {
    const messages = [];
    const topics = ['gaming', 'coaching', 'subscription', 'premium', 'training'];
    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      messages.push({
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message about ${topic}: ${faker.lorem.sentence()}`,
        createdAt: new Date()
      });
    }
    return messages;
  }

  static createMockUserMessage(content?: string) {
    return {
      text: content || faker.lorem.sentence(),
      timestamp: new Date()
    };
  }

  static createChineseTestMessages() {
    return [
      { role: 'USER', content: '你好，这是什么服务？' },
      { role: 'ASSISTANT', content: '您好！我们提供专业的游戏指导服务。' },
      { role: 'USER', content: '费用是多少？' },
      { role: 'ASSISTANT', content: '我们的高级订阅服务每月只需99元。' }
    ];
  }

  static createJapaneseTestMessages() {
    return [
      { role: 'USER', content: 'こんにちは、これは何のサービスですか？' },
      { role: 'ASSISTANT', content: 'こんにちは！プロのゲームコーチングサービスを提供しています。' },
      { role: 'USER', content: '料金はいくらですか？' },
      { role: 'ASSISTANT', content: 'プレミアムサブスクリプションは月額1,200円です。' }
    ];
  }

  static createRejectionMessages() {
    return [
      { role: 'USER', content: 'No thanks, not interested' },
      { role: 'ASSISTANT', content: 'I understand. May I ask what concerns you have?' },
      { role: 'USER', content: 'I really don\'t want this service' },
      { role: 'ASSISTANT', content: 'No problem at all. Have a great day!' }
    ];
  }

  static createAgreementMessages() {
    return [
      { role: 'USER', content: 'Tell me more about this service' },
      { role: 'ASSISTANT', content: 'Our coaching service helps improve your gaming skills...' },
      { role: 'USER', content: 'Yes, this sounds good. I agree' },
      { role: 'ASSISTANT', content: 'Excellent! Let me set that up for you.' }
    ];
  }

  static createProgressiveMessages() {
    return [
      { role: 'USER', content: 'What is this about?' },
      { role: 'ASSISTANT', content: 'This is about our premium gaming coaching service.' },
      { role: 'USER', content: 'How much does it cost?' },
      { role: 'ASSISTANT', content: 'It\'s $29.99 per month for unlimited coaching sessions.' },
      { role: 'USER', content: 'Can I try it first?' },
      { role: 'ASSISTANT', content: 'Absolutely! We offer a 7-day free trial.' },
      { role: 'USER', content: 'Okay, sign me up' },
      { role: 'ASSISTANT', content: 'Perfect! I\'ll get you started right away.' }
    ];
  }

  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static expectScoreInRange(score: number, min: number, max: number) {
    if (score < min || score > max) {
      throw new Error(`Score ${score} is not in expected range [${min}, ${max}]`);
    }
  }

  static expectValidLanguage(language: string) {
    const validLanguages = ['zh', 'ja', 'ko', 'en', 'es', 'ru'];
    if (!validLanguages.includes(language)) {
      throw new Error(`Invalid language: ${language}`);
    }
  }
}