import OpenAI from 'openai';
import { CompressedContext } from '../types';

export interface AIServiceConfig {
  apiKey: string;
  model?: 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
  maxTokensPerRequest?: number;
}

export interface AIResponse {
  text: string;
  tokensUsed: number;
  strategy?: string;
}

export class AIService {
  private openai: OpenAI;
  private config: Required<AIServiceConfig>;

  constructor(config: AIServiceConfig) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      maxTokensPerRequest: config.maxTokensPerRequest || 8000
    };
  }

  async generateResponse(
    context: CompressedContext,
    userMessage: string,
    language: string,
    completionCriteria: any
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context, language, completionCriteria);
      
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...this.formatRecentMessages(context.recentMessages),
        { role: 'user', content: userMessage }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: this.calculateMaxTokens(messages),
        temperature: 0.7,
        presence_penalty: 0.3,
        frequency_penalty: 0.3
      });

      const choice = response.choices[0];
      const tokensUsed = response.usage?.total_tokens || 0;

      const strategy = this.extractStrategy(choice.message?.content || '');

      return {
        text: this.cleanResponse(choice.message?.content || ''),
        tokensUsed,
        strategy
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate AI response: ${errorMessage}`);
    }
  }

  private buildSystemPrompt(
    context: CompressedContext,
    language: string,
    completionCriteria: any
  ): string {
    const languageInstructions = this.getLanguageInstructions(language);
    const goalInstructions = this.formatGoalInstructions(context.goal, completionCriteria);
    const contextSummary = context.summary || 'New conversation started.';
    const keyFacts = context.keyFacts.length > 0 
      ? `Key facts:\n${context.keyFacts.map(f => `- ${f}`).join('\n')}`
      : '';

    return `You are an AI assistant helping to achieve a specific goal through natural conversation.

${languageInstructions}

GOAL:
${goalInstructions}

CONTEXT:
${contextSummary}
${keyFacts}

USER INFO:
${context.userInfo ? JSON.stringify(context.userInfo, null, 2) : 'No specific user information available.'}

${context.referenceContext ? `REFERENCE CONTEXT:\n${context.referenceContext}\n` : ''}

INSTRUCTIONS:
1. Maintain natural, engaging conversation in ${language}
2. Guide the conversation towards the goal without being pushy
3. Be helpful and understanding of user concerns
4. If user shows resistance, offer alternatives or address concerns
5. Detect emotional tone and adjust response accordingly
6. Keep responses concise but informative
7. Build trust through empathy and understanding

IMPORTANT:
- Never lie or provide false information
- Respect user's decision if they explicitly refuse
- Maintain professional and friendly tone
- Focus on user benefits and value proposition`;
  }

  private getLanguageInstructions(language: string): string {
    const instructions: Record<string, string> = {
      zh: 'Respond in Simplified Chinese. Use polite and respectful language appropriate for Chinese culture.',
      ja: 'Respond in Japanese. Use appropriate keigo (polite language) and cultural considerations.',
      ko: 'Respond in Korean. Use appropriate honorifics and formal language.',
      en: 'Respond in English. Use clear, professional, and friendly language.',
      es: 'Respond in Spanish. Use formal "usted" form unless context suggests informal "tú".'
    };
    return instructions[language] || instructions.en;
  }

  private formatGoalInstructions(goal: string, criteria: any): string {
    let instructions = goal;
    
    if (criteria.type === 'user_agreement' && criteria.keywords) {
      instructions += `\n\nSuccess indicators: User agrees using keywords like: ${criteria.keywords.join(', ')}`;
    } else if (criteria.type === 'link_sent' && criteria.requiredLinkPattern) {
      instructions += `\n\nSuccess indicator: Provide link matching pattern: ${criteria.requiredLinkPattern}`;
    } else if (criteria.type === 'specific_message') {
      instructions += `\n\nSuccess indicator: Deliver specific message when appropriate`;
    } else if (criteria.type === 'custom' && criteria.customCondition) {
      instructions += `\n\nCustom success condition: ${criteria.customCondition}`;
    }
    
    return instructions;
  }

  private formatRecentMessages(messages: CompressedContext['recentMessages']): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  private calculateMaxTokens(messages: OpenAI.Chat.ChatCompletionMessageParam[]): number {
    const estimatedPromptTokens = JSON.stringify(messages).length / 4;
    const remainingTokens = this.config.maxTokensPerRequest - estimatedPromptTokens;
    return Math.max(500, Math.min(2000, Math.floor(remainingTokens)));
  }

  private extractStrategy(response: string): string | undefined {
    const strategyMatch = response.match(/\[STRATEGY: (.*?)\]/);
    return strategyMatch ? strategyMatch[1] : undefined;
  }

  private cleanResponse(response: string): string {
    return response
      .replace(/\[STRATEGY:.*?\]/g, '')
      .replace(/\[INTERNAL:.*?\]/g, '')
      .trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.models.list();
      return response.data.length > 0;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}