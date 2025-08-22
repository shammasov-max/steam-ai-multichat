import { CompressedContext } from '../types';

interface Message {
  role: string;
  content: string;
  createdAt?: Date;
}

interface ContextConfig {
  compressionAfterMessages: number;
  maxMessagesInContext: number;
  keepLastMessagesVerbatim: number;
}

export class ContextCompressor {
  private config: ContextConfig;

  constructor(config?: ContextConfig) {
    this.config = config || {
      compressionAfterMessages: 10,
      maxMessagesInContext: 20,
      keepLastMessagesVerbatim: 5
    };
  }

  async compress(
    messages: Message[],
    goal: string,
    userInfo?: any,
    referenceContext?: string
  ): Promise<CompressedContext> {
    const keyFacts = this.extractKeyFacts(messages);
    const recentMessages = this.getRecentMessages(messages);
    let summary = '';

    if (messages.length > this.config.compressionAfterMessages) {
      const messagesToCompress = messages.slice(0, -this.config.keepLastMessagesVerbatim);
      summary = this.createSummary(messagesToCompress);
    }

    return {
      summary,
      keyFacts,
      recentMessages,
      goal,
      userInfo,
      referenceContext
    };
  }

  private extractKeyFacts(messages: Message[]): string[] {
    const facts: string[] = [];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      if (this.containsRejection(content)) {
        facts.push(`User rejection detected: "${this.extractSnippet(message.content)}"`);
      }
      
      if (this.containsAgreement(content)) {
        facts.push(`User agreement: "${this.extractSnippet(message.content)}"`);
      }
      
      if (this.containsPreference(content)) {
        const preference = this.extractPreference(message.content);
        if (preference) facts.push(preference);
      }
      
      if (this.containsQuestion(content) && message.role === 'USER') {
        facts.push(`User question: "${this.extractSnippet(message.content)}"`);
      }
      
      if (this.containsPersonalInfo(content)) {
        const info = this.extractPersonalInfo(message.content);
        if (info) facts.push(info);
      }
    }
    
    return this.deduplicateFacts(facts).slice(0, 10);
  }

  private getRecentMessages(messages: Message[]): CompressedContext['recentMessages'] {
    const recentCount = Math.min(
      this.config.maxMessagesInContext,
      messages.length
    );
    
    const recentMessages = messages.slice(-recentCount);
    
    return recentMessages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: this.compressMessage(msg.content)
    }));
  }

  private createSummary(messages: Message[]): string {
    const topics = this.extractTopics(messages);
    const userStance = this.determineUserStance(messages);
    const progressMade = this.assessProgress(messages);
    
    const parts: string[] = [];
    
    if (topics.length > 0) {
      parts.push(`Topics discussed: ${topics.join(', ')}`);
    }
    
    if (userStance) {
      parts.push(`User stance: ${userStance}`);
    }
    
    if (progressMade) {
      parts.push(`Progress: ${progressMade}`);
    }
    
    const rejectionCount = messages.filter(m => 
      m.role === 'USER' && this.containsRejection(m.content.toLowerCase())
    ).length;
    
    if (rejectionCount > 0) {
      parts.push(`User has rejected ${rejectionCount} time(s)`);
    }
    
    return parts.join('. ') || 'Conversation ongoing.';
  }

  private compressMessage(content: string): string {
    if (content.length <= 500) return content;
    
    const isGreeting = this.isGreeting(content);
    const isFarewell = this.isFarewell(content);
    
    if (isGreeting) return '[Greeting exchanged]';
    if (isFarewell) return '[Farewell message]';
    
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    const important = sentences.filter(s => 
      this.containsImportantInfo(s.toLowerCase())
    );
    
    if (important.length > 0) {
      return important.join(' ').substring(0, 400) + '...';
    }
    
    return content.substring(0, 400) + '...';
  }

  private containsRejection(content: string): boolean {
    const rejectionPatterns = [
      /no thanks/i,
      /not interested/i,
      /don't want/i,
      /不需要/i,
      /不感兴趣/i,
      /不用了/i,
      /いいえ/i,
      /結構です/i,
      /아니요/i,
      /관심없/i,
      /no gracias/i,
      /no me interesa/i
    ];
    
    return rejectionPatterns.some(pattern => pattern.test(content));
  }

  private containsAgreement(content: string): boolean {
    const agreementPatterns = [
      /yes|yeah|sure|okay|ok|agree|sounds good|let's do it/i,
      /好的|可以|同意|没问题|行/i,
      /はい|いいです|分かりました|了解/i,
      /네|좋아요|알겠습니다/i,
      /sí|de acuerdo|está bien|vale/i
    ];
    
    return agreementPatterns.some(pattern => pattern.test(content));
  }

  private containsPreference(content: string): boolean {
    const preferencePatterns = [
      /i (like|prefer|love|hate|dislike)/i,
      /我(喜欢|偏好|讨厌)/i,
      /(好き|嫌い|苦手)/i,
      /(좋아|싫어)/i,
      /me (gusta|encanta|disgusta)/i
    ];
    
    return preferencePatterns.some(pattern => pattern.test(content));
  }

  private extractPreference(content: string): string | null {
    const match = content.match(/i (like|prefer|love|hate|dislike) (\w+)/i);
    if (match) {
      return `User ${match[1]}s: ${match[2]}`;
    }
    return null;
  }

  private containsQuestion(content: string): boolean {
    return content.includes('?') || 
           /^(what|when|where|who|why|how|is|are|can|could|would|will)/i.test(content);
  }

  private containsPersonalInfo(content: string): boolean {
    const patterns = [
      /my name is/i,
      /i am \d+ years old/i,
      /i live in/i,
      /i work/i,
      /我叫/i,
      /我住在/i,
      /私は.*です/i
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  private extractPersonalInfo(content: string): string | null {
    const nameMatch = content.match(/my name is (\w+)/i);
    if (nameMatch) return `User name: ${nameMatch[1]}`;
    
    const ageMatch = content.match(/i am (\d+) years old/i);
    if (ageMatch) return `User age: ${ageMatch[1]}`;
    
    const locationMatch = content.match(/i live in ([\w\s]+)/i);
    if (locationMatch) return `User location: ${locationMatch[1]}`;
    
    return null;
  }

  private extractSnippet(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  private deduplicateFacts(facts: string[]): string[] {
    const seen = new Set<string>();
    return facts.filter(fact => {
      const normalized = fact.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();
    const topicKeywords = {
      gaming: /game|play|level|character|quest|mission/i,
      coaching: /coach|training|improve|skill|lesson/i,
      subscription: /subscribe|payment|price|cost|fee|monthly/i,
      premium: /premium|vip|exclusive|special|upgrade/i,
      support: /help|support|assist|guide|tutorial/i
    };
    
    for (const message of messages) {
      for (const [topic, pattern] of Object.entries(topicKeywords)) {
        if (pattern.test(message.content)) {
          topics.add(topic);
        }
      }
    }
    
    return Array.from(topics);
  }

  private determineUserStance(messages: Message[]): string {
    const userMessages = messages.filter(m => m.role === 'USER');
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    for (const message of userMessages) {
      const content = message.content.toLowerCase();
      if (this.containsAgreement(content)) {
        positiveCount++;
      } else if (this.containsRejection(content)) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }
    
    if (negativeCount > positiveCount * 2) return 'resistant';
    if (positiveCount > negativeCount * 2) return 'receptive';
    if (neutralCount > (positiveCount + negativeCount)) return 'neutral/exploring';
    return 'mixed';
  }

  private assessProgress(messages: Message[]): string {
    const totalMessages = messages.length;
    const agreements = messages.filter(m => 
      m.role === 'USER' && this.containsAgreement(m.content.toLowerCase())
    ).length;
    const rejections = messages.filter(m => 
      m.role === 'USER' && this.containsRejection(m.content.toLowerCase())
    ).length;
    
    if (agreements > 0 && rejections === 0) return 'positive trajectory';
    if (rejections > agreements) return 'facing resistance';
    if (totalMessages > 10 && agreements === 0) return 'slow progress';
    if (agreements > 0 && rejections > 0) return 'mixed signals';
    return 'initial phase';
  }

  private isGreeting(content: string): boolean {
    const greetings = [
      /^(hi|hello|hey|greetings)/i,
      /^(你好|您好)/i,
      /^(こんにちは|おはよう)/i,
      /^(안녕|안녕하세요)/i,
      /^(hola|buenos)/i
    ];
    
    return greetings.some(pattern => pattern.test(content));
  }

  private isFarewell(content: string): boolean {
    const farewells = [
      /(bye|goodbye|see you|talk to you later)/i,
      /(再见|拜拜)/i,
      /(さようなら|またね)/i,
      /(안녕히|다음에)/i,
      /(adiós|hasta luego)/i
    ];
    
    return farewells.some(pattern => pattern.test(content));
  }

  private containsImportantInfo(content: string): boolean {
    return this.containsRejection(content) ||
           this.containsAgreement(content) ||
           this.containsQuestion(content) ||
           this.containsPersonalInfo(content) ||
           content.includes('$') ||
           content.includes('price') ||
           content.includes('cost') ||
           /\d+/.test(content);
  }
}