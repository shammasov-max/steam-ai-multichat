export const TestData = {
  // Language Detection Test Cases
  languageTexts: {
    chinese: [
      '你好，我想了解一下这个服务',
      '这个价格太贵了',
      '我对这个游戏很感兴趣',
      '不需要，谢谢'
    ],
    japanese: [
      'こんにちは、このサービスについて教えてください',
      'この価格は高すぎます',
      'このゲームに興味があります',
      'いいえ、結構です'
    ],
    korean: [
      '안녕하세요, 이 서비스에 대해 알고 싶습니다',
      '이 가격은 너무 비싸요',
      '이 게임에 관심이 있어요',
      '아니요, 괜찮습니다'
    ],
    english: [
      'Hello, I want to learn about this service',
      'This price is too expensive',
      'I am interested in this game',
      'No, thank you'
    ],
    spanish: [
      'Hola, quiero aprender sobre este servicio',
      'Este precio es demasiado caro',
      'Estoy interesado en este juego',
      'No, gracias'
    ]
  },

  // Scoring Test Cases
  scoringScenarios: {
    highEngagement: [
      { role: 'USER', content: 'Tell me more about this coaching service! I am very interested and would like to know all the details.' },
      { role: 'ASSISTANT', content: 'Great! Our coaching service offers personalized training...' },
      { role: 'USER', content: 'That sounds amazing! How can I sign up? What are the next steps?' }
    ],
    lowEngagement: [
      { role: 'USER', content: 'ok' },
      { role: 'ASSISTANT', content: 'Would you like to know more about our service?' },
      { role: 'USER', content: 'maybe' },
      { role: 'ASSISTANT', content: 'I can help you understand the benefits...' },
      { role: 'USER', content: 'sure' }
    ],
    rejection: [
      { role: 'USER', content: 'No thanks, I am not interested in this at all' },
      { role: 'ASSISTANT', content: 'I understand. May I ask what specific concerns you have?' },
      { role: 'USER', content: 'I just don\'t want it. Please stop asking' },
      { role: 'ASSISTANT', content: 'I respect your decision. Have a great day!' }
    ],
    aggressiveRejection: [
      { role: 'USER', content: 'Stop bothering me with this crap! I hate these scam services!' },
      { role: 'ASSISTANT', content: 'I apologize for any inconvenience. I understand your frustration.' },
      { role: 'USER', content: 'Just leave me alone, you stupid bot!' }
    ],
    topicDrift: [
      { role: 'USER', content: 'What\'s the weather like today?' },
      { role: 'ASSISTANT', content: 'I\'m here to help with our gaming coaching service. Speaking of games...' },
      { role: 'USER', content: 'Do you know any good restaurants nearby?' },
      { role: 'ASSISTANT', content: 'While I don\'t have restaurant recommendations, I can tell you about our gaming service...' },
      { role: 'USER', content: 'How about the latest movie releases?' }
    ]
  },

  // Context Compression Test Cases
  compressionScenarios: {
    longConversation: Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
      content: `Message ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      createdAt: new Date(Date.now() + i * 1000)
    })),
    
    conversationWithFacts: [
      { role: 'USER', content: 'Hi, my name is John and I live in New York' },
      { role: 'ASSISTANT', content: 'Nice to meet you John! How can I help you today?' },
      { role: 'USER', content: 'I am 25 years old and I love playing strategy games' },
      { role: 'ASSISTANT', content: 'Strategy games are great! Our coaching service specializes in those.' },
      { role: 'USER', content: 'No thanks, I am not interested in coaching' },
      { role: 'ASSISTANT', content: 'I understand. What if I told you about our free trial?' },
      { role: 'USER', content: 'Actually, yes, that sounds good. I agree to try it' }
    ],

    multilingualConversation: [
      { role: 'USER', content: 'Hello, can you help me?' },
      { role: 'ASSISTANT', content: 'Of course! How can I assist you today?' },
      { role: 'USER', content: '你好，我想了解一下这个服务' },
      { role: 'ASSISTANT', content: '您好！我很乐意为您介绍我们的服务。' },
      { role: 'USER', content: 'こんにちは、このサービスについて教えてください' },
      { role: 'ASSISTANT', content: 'こんにちは！喜んでサービスについてご説明します。' }
    ]
  },

  // Performance Test Data
  performanceData: {
    bulkDialogs: Array.from({ length: 100 }, (_, i) => ({
      externalId: `perf-test-${i}`,
      language: ['zh', 'ja', 'ko', 'en', 'es'][i % 5],
      goal: `Performance test goal ${i}`,
      completionCriteria: { type: 'user_agreement' as const }
    })),

    bulkMessages: Array.from({ length: 1000 }, (_, i) => ({
      text: `Performance test message ${i}`,
      timestamp: new Date()
    }))
  },

  // Error Scenarios
  errorScenarios: {
    invalidLanguage: 'invalid-lang',
    invalidDialogId: 'non-existent-dialog-id',
    emptyMessage: '',
    nullMessage: null,
    undefinedMessage: undefined,
    malformedCompletionCriteria: { type: 'invalid-type' },
    missingRequiredFields: {}
  },

  // Configuration Test Data
  configs: {
    minimal: {
      database: { url: 'postgresql://test:test@localhost:5432/test' },
      openai: { apiKey: 'test-key' }
    },
    full: {
      database: { url: 'postgresql://test:test@localhost:5432/test' },
      openai: { 
        apiKey: 'test-key',
        model: 'gpt-4-turbo-preview' as const,
        maxTokensPerRequest: 8000
      },
      configPath: './config/test.yaml'
    },
    invalid: {
      database: { url: '' },
      openai: { apiKey: '' }
    }
  }
};