import { test, expect } from '@playwright/test';
import { ScoringEngine } from '../../src/services/ScoringEngine';
import { TestData } from '../fixtures/test-data';
import { TestHelpers } from '../utils/test-helpers';

test.describe('ScoringEngine Unit Tests', () => {
  let scoringEngine: ScoringEngine;
  let defaultConfig: any;

  test.beforeEach(() => {
    defaultConfig = {
      thresholds: {
        highSuccess: 0.7,
        moderateSuccess: 0.5,
        riskZone: 0.3,
        critical: 0.2
      },
      weights: {
        userEngagement: 0.30,
        topicRelevance: 0.25,
        emotionalTone: 0.20,
        responseQuality: 0.15,
        goalProximity: 0.10
      }
    };
    
    scoringEngine = new ScoringEngine(defaultConfig);
  });

  test.describe('Configuration and Initialization', () => {
    test('should initialize with provided configuration', () => {
      expect((scoringEngine as any).config).toEqual(defaultConfig);
    });

    test('should initialize with empty previous scores', () => {
      expect((scoringEngine as any).previousScores).toEqual([]);
    });

    test('should calculate weighted score correctly', () => {
      const factors = {
        userEngagement: 0.8,
        topicRelevance: 0.7,
        emotionalTone: 0.6,
        responseQuality: 0.9,
        goalProximity: 0.5
      };

      const expectedScore = 
        0.8 * 0.30 + // userEngagement
        0.7 * 0.25 + // topicRelevance  
        0.6 * 0.20 + // emotionalTone
        0.9 * 0.15 + // responseQuality
        0.5 * 0.10;  // goalProximity

      const score = (scoringEngine as any).calculateScore(factors);
      expect(score).toBeCloseTo(expectedScore, 3);
      TestHelpers.expectScoreInRange(score, 0, 1);
    });

    test('should clamp scores to 0-1 range', () => {
      const highFactors = {
        userEngagement: 2.0,
        topicRelevance: 1.5,
        emotionalTone: 1.8,
        responseQuality: 1.2,
        goalProximity: 1.1
      };

      const score = (scoringEngine as any).calculateScore(highFactors);
      expect(score).toBe(1.0);

      const lowFactors = {
        userEngagement: -0.5,
        topicRelevance: -0.3,
        emotionalTone: -0.2,
        responseQuality: -0.1,
        goalProximity: -0.4
      };

      const lowScore = (scoringEngine as any).calculateScore(lowFactors);
      expect(lowScore).toBe(0.0);
    });
  });

  test.describe('User Engagement Scoring', () => {
    test('should score high engagement correctly', () => {
      const messages = TestData.scoringScenarios.highEngagement;
      const userMessages = messages.filter(m => m.role === 'USER');
      
      const score = (scoringEngine as any).calculateUserEngagement(userMessages);
      TestHelpers.expectScoreInRange(score, 0.8, 1.0);
    });

    test('should score low engagement correctly', () => {
      const messages = TestData.scoringScenarios.lowEngagement;
      const userMessages = messages.filter(m => m.role === 'USER');
      
      const score = (scoringEngine as any).calculateUserEngagement(userMessages);
      TestHelpers.expectScoreInRange(score, 0.2, 0.6);
    });

    test('should penalize one-word responses', () => {
      const oneWordMessages = [
        { role: 'USER', content: 'ok' },
        { role: 'USER', content: 'yes' },
        { role: 'USER', content: 'no' }
      ];
      
      const score = (scoringEngine as any).calculateUserEngagement(oneWordMessages);
      expect(score).toBeLessThan(0.7);
    });

    test('should reward questions and detailed responses', () => {
      const engagedMessages = [
        { role: 'USER', content: 'Can you tell me more about the pricing options? I want to understand what\'s included.' },
        { role: 'USER', content: 'How does the coaching process work? What can I expect?' },
        { role: 'USER', content: 'This sounds interesting! What are the next steps?' }
      ];
      
      const score = (scoringEngine as any).calculateUserEngagement(engagedMessages);
      expect(score).toBeGreaterThan(0.8);
    });

    test('should detect positive engagement patterns', () => {
      const positiveMessages = [
        { role: 'USER', content: 'Tell me more about this service, I am interested' },
        { role: 'USER', content: 'Sounds good, please explain how it works' },
        { role: 'USER', content: 'I like what I hear so far' }
      ];
      
      const score = (scoringEngine as any).calculateUserEngagement(positiveMessages);
      expect(score).toBeGreaterThan(0.9);
    });

    test('should detect negative engagement patterns', () => {
      const negativeMessages = [
        { role: 'USER', content: 'Not interested, leave me alone' },
        { role: 'USER', content: 'Stop bothering me with this' },
        { role: 'USER', content: 'Don\'t want this service' }
      ];
      
      const score = (scoringEngine as any).calculateUserEngagement(negativeMessages);
      expect(score).toBeLessThan(0.5);
    });

    test('should handle empty message list', () => {
      const score = (scoringEngine as any).calculateUserEngagement([]);
      expect(score).toBe(1.0);
    });

    test('should consider message length appropriately', () => {
      const shortMessages = [
        { role: 'USER', content: 'hi' },
        { role: 'USER', content: 'ok' }
      ];
      
      const longMessages = [
        { role: 'USER', content: 'I would like to learn more about your gaming coaching service because I am really interested in improving my skills.' }
      ];
      
      const shortScore = (scoringEngine as any).calculateUserEngagement(shortMessages);
      const longScore = (scoringEngine as any).calculateUserEngagement(longMessages);
      
      expect(longScore).toBeGreaterThan(shortScore);
    });
  });

  test.describe('Topic Relevance Scoring', () => {
    test('should score high relevance for on-topic conversation', () => {
      const messages = [
        { role: 'USER', content: 'I want to improve my gaming skills' },
        { role: 'ASSISTANT', content: 'Our coaching service can help with that' },
        { role: 'USER', content: 'What kind of coaching do you offer?' },
        { role: 'ASSISTANT', content: 'We provide personalized gaming training' }
      ];
      
      const goal = 'Offer gaming coaching service';
      const score = (scoringEngine as any).calculateTopicRelevance(messages, goal);
      
      expect(score).toBeGreaterThan(0.5);
    });

    test('should score low relevance for off-topic conversation', () => {
      const messages = TestData.scoringScenarios.topicDrift;
      const goal = 'Offer gaming coaching service';
      
      const score = (scoringEngine as any).calculateTopicRelevance(messages, goal);
      expect(score).toBeLessThan(0.3);
    });

    test('should extract keywords correctly', () => {
      const text = 'I love playing strategy games and want coaching';
      const keywords = (scoringEngine as any).extractKeywords(text);
      
      expect(keywords.has('love')).toBe(true);
      expect(keywords.has('playing')).toBe(true);
      expect(keywords.has('strategy')).toBe(true);
      expect(keywords.has('games')).toBe(true);
      expect(keywords.has('want')).toBe(true);
      expect(keywords.has('coaching')).toBe(true);
      
      // Stop words should be filtered out
      expect(keywords.has('and')).toBe(false);
      expect(keywords.has('the')).toBe(false);
    });

    test('should calculate keyword overlap correctly', () => {
      const keywords1 = new Set(['gaming', 'coaching', 'service']);
      const keywords2 = new Set(['gaming', 'training', 'service', 'help']);
      
      const overlap = (scoringEngine as any).calculateKeywordOverlap(keywords1, keywords2);
      expect(overlap).toBeCloseTo(0.5, 2); // 2 out of 4 max
    });

    test('should handle empty keyword sets', () => {
      const keywords1 = new Set<string>();
      const keywords2 = new Set(['test']);
      
      const overlap = (scoringEngine as any).calculateKeywordOverlap(keywords1, keywords2);
      expect(overlap).toBe(0);
    });

    test('should limit to recent messages for relevance calculation', () => {
      const messages = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: i < 10 ? 'off topic message' : 'gaming coaching service'
      }));
      
      const goal = 'gaming coaching service';
      const score = (scoringEngine as any).calculateTopicRelevance(messages, goal);
      
      // Should focus on recent messages which are on-topic
      expect(score).toBeGreaterThan(0.3);
    });
  });

  test.describe('Emotional Tone Scoring', () => {
    test('should detect positive emotions', () => {
      const positiveMessages = [
        { role: 'USER', content: 'Thank you so much! This is great! 😊' },
        { role: 'USER', content: 'I appreciate your help, this is wonderful' },
        { role: 'USER', content: 'Excellent service, I love it!' }
      ];
      
      const score = (scoringEngine as any).calculateEmotionalTone(positiveMessages);
      expect(score).toBeGreaterThan(0.7);
    });

    test('should detect negative emotions', () => {
      const negativeMessages = [
        { role: 'USER', content: 'This is terrible and awful 😠' },
        { role: 'USER', content: 'I hate this service, it\'s the worst' },
        { role: 'USER', content: 'Very disappointing experience' }
      ];
      
      const score = (scoringEngine as any).calculateEmotionalTone(negativeMessages);
      expect(score).toBeLessThan(0.3);
    });

    test('should detect aggressive language', () => {
      const aggressiveMessages = [
        { role: 'USER', content: 'This is fucking stupid!' },
        { role: 'USER', content: 'You are an idiot, shut up!' },
        { role: 'USER', content: 'This damn service is a scam!' }
      ];
      
      const score = (scoringEngine as any).calculateEmotionalTone(aggressiveMessages);
      expect(score).toBeLessThan(0.2);
    });

    test('should detect frustration patterns', () => {
      const frustratedMessages = [
        { role: 'USER', content: 'How many times do I have to tell you?' },
        { role: 'USER', content: 'I already said I\'m not interested' },
        { role: 'USER', content: 'Why do you keep asking the same thing?' }
      ];
      
      const score = (scoringEngine as any).calculateEmotionalTone(frustratedMessages);
      expect(score).toBeLessThan(0.4);
    });

    test('should default to neutral for empty messages', () => {
      const score = (scoringEngine as any).calculateEmotionalTone([]);
      expect(score).toBe(0.5);
    });

    test('should handle neutral messages appropriately', () => {
      const neutralMessages = [
        { role: 'USER', content: 'Can you tell me about the pricing?' },
        { role: 'USER', content: 'What are the features included?' },
        { role: 'USER', content: 'I need more information' }
      ];
      
      const score = (scoringEngine as any).calculateEmotionalTone(neutralMessages);
      expect(score).toBeCloseTo(0.5, 1);
    });
  });

  test.describe('Response Quality Scoring', () => {
    test('should evaluate assistant response quality', () => {
      const goodResponses = [
        { role: 'ASSISTANT', content: 'Thank you for your interest! Our gaming coaching service offers personalized training sessions designed specifically for your skill level and gaming preferences. We have certified coaches who specialize in various game genres.' },
        { role: 'ASSISTANT', content: 'I understand your concerns about pricing. Let me break down what\'s included in our service so you can see the value we provide.' }
      ];
      
      const score = (scoringEngine as any).calculateResponseQuality(goodResponses);
      expect(score).toBeGreaterThan(0.6);
    });

    test('should penalize very short responses', () => {
      const shortResponses = [
        { role: 'ASSISTANT', content: 'OK' },
        { role: 'ASSISTANT', content: 'Yes' },
        { role: 'ASSISTANT', content: 'Sure' }
      ];
      
      const score = (scoringEngine as any).calculateResponseQuality(shortResponses);
      expect(score).toBeLessThan(0.6);
    });

    test('should penalize very long responses', () => {
      const longResponse = 'This is a very long response that goes on and on without really saying much of value. '.repeat(20);
      const longResponses = [
        { role: 'ASSISTANT', content: longResponse }
      ];
      
      const score = (scoringEngine as any).calculateResponseQuality(longResponses);
      expect(score).toBeLessThan(0.7);
    });

    test('should detect repetitive responses', () => {
      const repetitiveResponses = [
        { role: 'ASSISTANT', content: 'Our service is great and can help you' },
        { role: 'ASSISTANT', content: 'Our service is great and can help you improve' },
        { role: 'ASSISTANT', content: 'Our service is great and can help you' }
      ];
      
      const score = (scoringEngine as any).calculateResponseQuality(repetitiveResponses);
      expect(score).toBeLessThan(0.6);
    });

    test('should reward personalized responses', () => {
      const personalizedResponses = [
        { role: 'ASSISTANT', content: 'Based on what you mentioned about your interest in strategy games, I think you would really benefit from our specialized coaching.' },
        { role: 'ASSISTANT', content: 'You said you want to improve your ranking, so let me explain how our service specifically addresses that.' }
      ];
      
      const score = (scoringEngine as any).calculateResponseQuality(personalizedResponses);
      expect(score).toBeGreaterThan(0.7);
    });

    test('should handle empty assistant message list', () => {
      const score = (scoringEngine as any).calculateResponseQuality([]);
      expect(score).toBe(0.5);
    });

    test('should calculate Levenshtein distance correctly', () => {
      const distance = (scoringEngine as any).levenshteinDistance('hello', 'helo');
      expect(distance).toBe(1);
      
      const distance2 = (scoringEngine as any).levenshteinDistance('kitten', 'sitting');
      expect(distance2).toBe(3);
      
      const distance3 = (scoringEngine as any).levenshteinDistance('same', 'same');
      expect(distance3).toBe(0);
    });
  });

  test.describe('Goal Proximity Scoring', () => {
    test('should detect user agreement keywords', () => {
      const agreementMessages = [
        { role: 'USER', content: 'Yes, I agree to try this service' },
        { role: 'USER', content: 'Okay, sign me up' },
        { role: 'USER', content: 'Sure, let\'s do it' }
      ];
      
      const criteria = {
        type: 'user_agreement',
        keywords: ['yes', 'agree', 'okay', 'sure']
      };
      
      const score = (scoringEngine as any).calculateGoalProximity(agreementMessages, criteria);
      expect(score).toBe(1.0);
    });

    test('should not find agreement when none exists', () => {
      const neutralMessages = [
        { role: 'USER', content: 'Tell me more about this' },
        { role: 'USER', content: 'How much does it cost?' },
        { role: 'USER', content: 'What are the features?' }
      ];
      
      const criteria = {
        type: 'user_agreement',
        keywords: ['yes', 'agree', 'okay', 'sure']
      };
      
      const score = (scoringEngine as any).calculateGoalProximity(neutralMessages, criteria);
      expect(score).toBeLessThan(0.5);
    });

    test('should detect progress indicators', () => {
      const progressMessages = [
        { role: 'USER', content: 'How much does this cost?' },
        { role: 'USER', content: 'When can I start?' },
        { role: 'USER', content: 'Can I try this service?' },
        { role: 'USER', content: 'How do I sign up?' }
      ];
      
      const indicators = (scoringEngine as any).detectProgressIndicators(progressMessages);
      expect(indicators).toBeGreaterThanOrEqual(4);
    });

    test('should handle non-user-agreement criteria types', () => {
      const messages = [
        { role: 'USER', content: 'Send me the link' }
      ];
      
      const criteria = {
        type: 'link_sent',
        requiredLinkPattern: 'https://example.com/*'
      };
      
      const score = (scoringEngine as any).calculateGoalProximity(messages, criteria);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(1);
    });
  });

  test.describe('Issue Detection', () => {
    test('should detect explicit rejection', () => {
      const rejectionMessages = TestData.scoringScenarios.rejection;
      const factors = {
        userEngagement: 0.3,
        topicRelevance: 0.5,
        emotionalTone: 0.4,
        responseQuality: 0.7,
        goalProximity: 0.1
      };
      
      const issues = (scoringEngine as any).detectIssues(rejectionMessages, factors);
      const rejectionIssue = issues.find((issue: any) => issue.type === 'explicit_rejection');
      
      expect(rejectionIssue).toBeDefined();
      expect(rejectionIssue.severity).toBe('high');
    });

    test('should detect aggressive responses', () => {
      const aggressiveMessages = TestData.scoringScenarios.aggressiveRejection;
      const factors = {
        userEngagement: 0.2,
        topicRelevance: 0.3,
        emotionalTone: 0.1,
        responseQuality: 0.7,
        goalProximity: 0.1
      };
      
      const issues = (scoringEngine as any).detectIssues(aggressiveMessages, factors);
      const aggressiveIssue = issues.find((issue: any) => issue.type === 'aggressive_response');
      const rejectionIssue = issues.find((issue: any) => issue.type === 'explicit_rejection');
      
      expect(aggressiveIssue).toBeDefined();
      expect(aggressiveIssue.severity).toBe('high');
      expect(rejectionIssue.severity).toBe('critical'); // Aggressive rejection
    });

    test('should detect topic drift', () => {
      const factors = {
        userEngagement: 0.5,
        topicRelevance: 0.2, // Low topic relevance
        emotionalTone: 0.5,
        responseQuality: 0.7,
        goalProximity: 0.3
      };
      
      const issues = (scoringEngine as any).detectIssues([], factors);
      const driftIssue = issues.find((issue: any) => issue.type === 'topic_drift');
      
      expect(driftIssue).toBeDefined();
      expect(driftIssue.severity).toBe('medium');
    });

    test('should detect low engagement', () => {
      const factors = {
        userEngagement: 0.1, // Very low engagement
        topicRelevance: 0.5,
        emotionalTone: 0.5,
        responseQuality: 0.7,
        goalProximity: 0.3
      };
      
      const issues = (scoringEngine as any).detectIssues([], factors);
      const engagementIssue = issues.find((issue: any) => issue.type === 'low_engagement');
      
      expect(engagementIssue).toBeDefined();
      expect(engagementIssue.severity).toBe('high'); // Very low engagement
    });

    test('should not detect issues when everything is fine', () => {
      const goodMessages = TestData.scoringScenarios.highEngagement;
      const factors = {
        userEngagement: 0.8,
        topicRelevance: 0.7,
        emotionalTone: 0.8,
        responseQuality: 0.9,
        goalProximity: 0.6
      };
      
      const issues = (scoringEngine as any).detectIssues(goodMessages, factors);
      expect(issues).toHaveLength(0);
    });
  });

  test.describe('Trend Determination', () => {
    test('should determine rising trend', () => {
      const scoringEngine = new ScoringEngine(defaultConfig);
      
      // Simulate previous scores
      (scoringEngine as any).previousScores = [0.4, 0.5, 0.6];
      
      const trend = (scoringEngine as any).determineTrend(0.8);
      expect(trend).toBe('rising');
    });

    test('should determine declining trend', () => {
      const scoringEngine = new ScoringEngine(defaultConfig);
      
      // Simulate previous scores
      (scoringEngine as any).previousScores = [0.8, 0.7, 0.6];
      
      const trend = (scoringEngine as any).determineTrend(0.4);
      expect(trend).toBe('declining');
    });

    test('should determine stable trend', () => {
      const scoringEngine = new ScoringEngine(defaultConfig);
      
      // Simulate previous scores
      (scoringEngine as any).previousScores = [0.5, 0.5, 0.5];
      
      const trend = (scoringEngine as any).determineTrend(0.52);
      expect(trend).toBe('stable');
    });

    test('should default to stable with insufficient history', () => {
      const trend = (scoringEngine as any).determineTrend(0.5);
      expect(trend).toBe('stable');
    });
  });

  test.describe('Full Dialog Evaluation', () => {
    test('should evaluate complete dialog successfully', async () => {
      const messages = TestData.scoringScenarios.highEngagement;
      const goal = 'Offer premium gaming coaching service';
      const criteria = { type: 'user_agreement', keywords: ['yes', 'interested', 'sure'] };
      
      const result = await scoringEngine.evaluateDialog(messages, goal, criteria);
      
      expect(result.continuationScore).toBeGreaterThan(0);
      expect(result.continuationScore).toBeLessThanOrEqual(1);
      expect(result.trend).toMatch(/^(rising|stable|declining)$/);
      expect(typeof result.factors.userEngagement).toBe('number');
      expect(typeof result.factors.topicRelevance).toBe('number');
      expect(typeof result.factors.emotionalTone).toBe('number');
      expect(typeof result.factors.responseQuality).toBe('number');
      expect(typeof result.factors.goalProximity).toBe('number');
      expect(typeof result.goalProgress).toBe('number');
    });

    test('should track previous scores correctly', async () => {
      const messages = TestData.scoringScenarios.highEngagement;
      const goal = 'Test goal';
      const criteria = { type: 'user_agreement' };
      
      await scoringEngine.evaluateDialog(messages, goal, criteria);
      await scoringEngine.evaluateDialog(messages, goal, criteria);
      await scoringEngine.evaluateDialog(messages, goal, criteria);
      
      const previousScores = (scoringEngine as any).previousScores;
      expect(previousScores.length).toBe(3);
    });

    test('should limit previous scores to 5 entries', async () => {
      const messages = TestData.scoringScenarios.highEngagement;
      const goal = 'Test goal';
      const criteria = { type: 'user_agreement' };
      
      for (let i = 0; i < 7; i++) {
        await scoringEngine.evaluateDialog(messages, goal, criteria);
      }
      
      const previousScores = (scoringEngine as any).previousScores;
      expect(previousScores.length).toBe(5);
    });

    test('should calculate goal progress correctly', async () => {
      const progressMessages = TestData.scoringScenarios.highEngagement;
      const goal = 'Get user agreement';
      const criteria = { type: 'user_agreement', keywords: ['interested', 'sure'] };
      
      const result = await scoringEngine.evaluateDialog(progressMessages, goal, criteria);
      expect(result.goalProgress).toBeGreaterThan(0);
      expect(result.goalProgress).toBeLessThanOrEqual(1);
    });

    test('should return issues when detected', async () => {
      const problematicMessages = TestData.scoringScenarios.aggressiveRejection;
      const goal = 'Get user agreement';
      const criteria = { type: 'user_agreement' };
      
      const result = await scoringEngine.evaluateDialog(problematicMessages, goal, criteria);
      expect(result.issuesDetected).toBeDefined();
      expect(result.issuesDetected!.length).toBeGreaterThan(0);
    });

    test('should not return issues when dialog is healthy', async () => {
      const healthyMessages = TestData.scoringScenarios.highEngagement;
      const goal = 'Get user agreement';
      const criteria = { type: 'user_agreement', keywords: ['interested', 'sure'] };
      
      const result = await scoringEngine.evaluateDialog(healthyMessages, goal, criteria);
      expect(result.issuesDetected).toBeUndefined();
    });
  });
});