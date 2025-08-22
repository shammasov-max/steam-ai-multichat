import { ScoringFactors } from '../types';

interface Message {
  role: string;
  content: string;
}

interface ScoringConfig {
  thresholds: {
    highSuccess: number;
    moderateSuccess: number;
    riskZone: number;
    critical: number;
  };
  weights: {
    userEngagement: number;
    topicRelevance: number;
    emotionalTone: number;
    responseQuality: number;
    goalProximity: number;
  };
}

export interface ScoringResult {
  continuationScore: number;
  trend: 'rising' | 'stable' | 'declining';
  factors: ScoringFactors;
  goalProgress: number;
  issuesDetected?: Array<{
    type: 'explicit_rejection' | 'topic_drift' | 'aggressive_response' | 'low_engagement';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}

export class ScoringEngine {
  private config: ScoringConfig;
  private previousScores: number[] = [];

  constructor(config: ScoringConfig) {
    this.config = config;
  }

  async evaluateDialog(
    messages: Message[],
    goal: string,
    completionCriteria: any
  ): Promise<ScoringResult> {
    const factors = this.calculateFactors(messages, goal, completionCriteria);
    const continuationScore = this.calculateScore(factors);
    const trend = this.determineTrend(continuationScore);
    const goalProgress = this.calculateGoalProgress(messages, completionCriteria);
    const issuesDetected = this.detectIssues(messages, factors);

    this.previousScores.push(continuationScore);
    if (this.previousScores.length > 5) {
      this.previousScores.shift();
    }

    return {
      continuationScore,
      trend,
      factors,
      goalProgress,
      issuesDetected: issuesDetected.length > 0 ? issuesDetected : undefined
    };
  }

  private calculateFactors(
    messages: Message[],
    goal: string,
    completionCriteria: any
  ): ScoringFactors {
    const userMessages = messages.filter(m => m.role === 'USER');
    const lastUserMessages = userMessages.slice(-3);

    const userEngagement = this.calculateUserEngagement(lastUserMessages);
    const topicRelevance = this.calculateTopicRelevance(messages, goal);
    const emotionalTone = this.calculateEmotionalTone(lastUserMessages);
    const responseQuality = this.calculateResponseQuality(messages);
    const goalProximity = this.calculateGoalProximity(messages, completionCriteria);

    return {
      userEngagement,
      topicRelevance,
      emotionalTone,
      responseQuality,
      goalProximity
    };
  }

  private calculateScore(factors: ScoringFactors): number {
    const weights = this.config.weights;
    
    const weightedScore = 
      factors.userEngagement * weights.userEngagement +
      factors.topicRelevance * weights.topicRelevance +
      factors.emotionalTone * weights.emotionalTone +
      factors.responseQuality * weights.responseQuality +
      factors.goalProximity * weights.goalProximity;

    return Math.max(0, Math.min(1, weightedScore));
  }

  private calculateUserEngagement(userMessages: Message[]): number {
    if (userMessages.length === 0) return 1.0;

    let score = 1.0;
    
    for (const message of userMessages) {
      const content = message.content.toLowerCase();
      const length = content.length;

      if (length < 10) {
        score -= 0.1;
      } else if (length > 100) {
        score += 0.05;
      }

      if (content.includes('?')) {
        score += 0.1;
      }

      if (this.isOneWordResponse(content)) {
        score -= 0.15;
      }

      if (this.containsPositiveEngagement(content)) {
        score += 0.15;
      }

      if (this.containsNegativeEngagement(content)) {
        score -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateTopicRelevance(messages: Message[], goal: string): number {
    const goalKeywords = this.extractKeywords(goal.toLowerCase());
    let relevanceScore = 0;
    let totalMessages = 0;

    for (const message of messages.slice(-10)) {
      const content = message.content.toLowerCase();
      const messageKeywords = this.extractKeywords(content);
      
      const overlap = this.calculateKeywordOverlap(goalKeywords, messageKeywords);
      relevanceScore += overlap;
      totalMessages++;
    }

    if (totalMessages === 0) return 0.5;

    const averageRelevance = relevanceScore / totalMessages;
    return Math.max(0, Math.min(1, averageRelevance));
  }

  private calculateEmotionalTone(userMessages: Message[]): number {
    if (userMessages.length === 0) return 0.5;

    let toneScore = 0.5;

    for (const message of userMessages) {
      const content = message.content.toLowerCase();

      if (this.containsPositiveEmotions(content)) {
        toneScore += 0.2;
      }

      if (this.containsNegativeEmotions(content)) {
        toneScore -= 0.25;
      }

      if (this.containsAggression(content)) {
        toneScore -= 0.4;
      }

      if (this.containsFrustration(content)) {
        toneScore -= 0.15;
      }
    }

    return Math.max(0, Math.min(1, toneScore));
  }

  private calculateResponseQuality(messages: Message[]): number {
    const assistantMessages = messages.filter(m => m.role === 'ASSISTANT');
    if (assistantMessages.length === 0) return 0.5;

    const lastAssistantMessages = assistantMessages.slice(-3);
    let qualityScore = 0.7;

    for (const message of lastAssistantMessages) {
      const content = message.content;

      if (content.length < 50) {
        qualityScore -= 0.1;
      }

      if (content.length > 500) {
        qualityScore -= 0.05;
      }

      if (this.isRepetitive(content, assistantMessages)) {
        qualityScore -= 0.15;
      }

      if (this.containsPersonalization(content)) {
        qualityScore += 0.1;
      }
    }

    return Math.max(0, Math.min(1, qualityScore));
  }

  private calculateGoalProximity(messages: Message[], completionCriteria: any): number {
    const userMessages = messages.filter(m => m.role === 'USER');
    
    if (completionCriteria.type === 'user_agreement' && completionCriteria.keywords) {
      for (const message of userMessages.slice().reverse()) {
        const content = message.content.toLowerCase();
        for (const keyword of completionCriteria.keywords) {
          if (content.includes(keyword.toLowerCase())) {
            return 1.0;
          }
        }
      }
    }

    const progressIndicators = this.detectProgressIndicators(userMessages);
    return Math.min(1, progressIndicators * 0.2);
  }

  private calculateGoalProgress(messages: Message[], completionCriteria: any): number {
    const proximityScore = this.calculateGoalProximity(messages, completionCriteria);
    const messageCount = messages.length;
    
    const progressFromMessages = Math.min(messageCount / 20, 0.5);
    
    return Math.min(1, proximityScore * 0.7 + progressFromMessages * 0.3);
  }

  private determineTrend(currentScore: number): 'rising' | 'stable' | 'declining' {
    if (this.previousScores.length < 2) return 'stable';

    const recentScores = this.previousScores.slice(-3);
    const averageRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    const difference = currentScore - averageRecent;
    
    if (difference > 0.1) return 'rising';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private detectIssues(messages: Message[], factors: ScoringFactors): Array<{
    type: 'explicit_rejection' | 'topic_drift' | 'aggressive_response' | 'low_engagement';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }> {
    const issues = [];

    const userMessages = messages.filter(m => m.role === 'USER');
    const recentUserMessages = userMessages.slice(-5);

    for (const message of recentUserMessages) {
      const content = message.content.toLowerCase();
      
      if (this.containsExplicitRejection(content)) {
        issues.push({
          type: 'explicit_rejection' as const,
          severity: this.containsAggression(content) ? 'critical' as const : 'high' as const,
          description: 'User has explicitly rejected the offer'
        });
      }

      if (this.containsAggression(content)) {
        issues.push({
          type: 'aggressive_response' as const,
          severity: 'high' as const,
          description: 'User is showing aggressive behavior'
        });
      }
    }

    if (factors.topicRelevance < 0.3) {
      issues.push({
        type: 'topic_drift' as const,
        severity: 'medium' as const,
        description: 'Conversation has drifted significantly from the goal'
      });
    }

    if (factors.userEngagement < 0.3) {
      issues.push({
        type: 'low_engagement' as const,
        severity: factors.userEngagement < 0.1 ? 'high' as const : 'medium' as const,
        description: 'User engagement is very low'
      });
    }

    return issues;
  }

  private extractKeywords(text: string): Set<string> {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    return new Set(words);
  }

  private calculateKeywordOverlap(keywords1: Set<string>, keywords2: Set<string>): number {
    if (keywords1.size === 0 || keywords2.size === 0) return 0;
    
    let overlap = 0;
    for (const keyword of keywords1) {
      if (keywords2.has(keyword)) {
        overlap++;
      }
    }
    
    return overlap / Math.max(keywords1.size, keywords2.size);
  }

  private isOneWordResponse(content: string): boolean {
    const words = content.trim().split(/\s+/);
    return words.length <= 2;
  }

  private containsPositiveEngagement(content: string): boolean {
    const patterns = [
      /tell me more/i,
      /interested/i,
      /sounds good/i,
      /i like/i,
      /please explain/i,
      /how does.*work/i,
      /what.*about/i
    ];
    return patterns.some(p => p.test(content));
  }

  private containsNegativeEngagement(content: string): boolean {
    const patterns = [
      /not interested/i,
      /don't want/i,
      /leave me alone/i,
      /stop/i,
      /no thanks/i,
      /不需要/i,
      /不感兴趣/i
    ];
    return patterns.some(p => p.test(content));
  }

  private containsPositiveEmotions(content: string): boolean {
    const patterns = [
      /😊|😄|😃|👍|❤️|💕/,
      /thank you/i,
      /appreciate/i,
      /great/i,
      /awesome/i,
      /wonderful/i,
      /excellent/i,
      /perfect/i,
      /love it/i
    ];
    return patterns.some(p => p.test(content));
  }

  private containsNegativeEmotions(content: string): boolean {
    const patterns = [
      /😠|😡|😤|👎|💔/,
      /hate/i,
      /terrible/i,
      /awful/i,
      /disgusting/i,
      /horrible/i,
      /worst/i,
      /disappoint/i
    ];
    return patterns.some(p => p.test(content));
  }

  private containsAggression(content: string): boolean {
    const patterns = [
      /fuck|shit|damn|hell|bastard|asshole/i,
      /stupid|idiot|moron|dumb/i,
      /shut up/i,
      /go away/i,
      /scam/i,
      /fraud/i
    ];
    return patterns.some(p => p.test(content));
  }

  private containsFrustration(content: string): boolean {
    const patterns = [
      /why.*keep.*asking/i,
      /already.*said/i,
      /told you/i,
      /how many times/i,
      /annoying/i,
      /irritating/i,
      /bothering/i
    ];
    return patterns.some(p => p.test(content));
  }

  private containsExplicitRejection(content: string): boolean {
    const patterns = [
      /\bno\b/i,
      /not interested/i,
      /don't want/i,
      /never/i,
      /refuse/i,
      /decline/i,
      /reject/i,
      /不要/i,
      /不需要/i,
      /拒绝/i
    ];
    return patterns.some(p => p.test(content));
  }

  private isRepetitive(content: string, previousMessages: Message[]): boolean {
    if (previousMessages.length < 2) return false;
    
    const similarity = (s1: string, s2: string): number => {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      
      if (longer.length === 0) return 1.0;
      
      const distance = this.levenshteinDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    };
    
    for (const prevMessage of previousMessages.slice(-3)) {
      if (similarity(content.toLowerCase(), prevMessage.content.toLowerCase()) > 0.7) {
        return true;
      }
    }
    
    return false;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[s2.length][s1.length];
  }

  private containsPersonalization(content: string): boolean {
    const patterns = [
      /\byou mentioned\b/i,
      /\byou said\b/i,
      /\byour.*interest\b/i,
      /\bbased on.*you\b/i,
      /\bspecifically for you\b/i,
      /\byour game\b/i,
      /\byour experience\b/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectProgressIndicators(messages: Message[]): number {
    let indicators = 0;
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      if (content.includes('how much') || content.includes('what price')) {
        indicators++;
      }
      
      if (content.includes('when') || content.includes('how long')) {
        indicators++;
      }
      
      if (content.includes('sign up') || content.includes('register')) {
        indicators++;
      }
      
      if (content.includes('try') || content.includes('test')) {
        indicators++;
      }
    }
    
    return indicators;
  }
}