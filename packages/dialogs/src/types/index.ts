export interface DialogManagerConfig {
  database: {
    url: string;
  };
  openai: {
    apiKey: string;
    model?: 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
    maxTokensPerRequest?: number;
  };
  configPath?: string;
}

export interface CreateDialogParams {
  externalId: string;
  language: 'zh' | 'ja' | 'ko' | 'en' | 'es';
  userInfo?: {
    country?: string;
    city?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    games?: string[];
  };
  goal: string;
  completionCriteria: {
    type: 'user_agreement' | 'link_sent' | 'specific_message' | 'custom';
    keywords?: string[];
    requiredLinkPattern?: string;
    customCondition?: string;
  };
  negotiationSettings?: {
    startImmediately?: boolean;
    maxConsecutiveMessages?: number;
    revivalTimeoutHours?: number;
    maxRevivalAttempts?: number;
  };
  referenceContext?: string;
}

export interface ProcessMessageParams {
  dialogId: string;
  message: {
    text: string;
    timestamp: Date;
  };
}

export interface ProcessMessageResult {
  dialogId: string;
  responseMessages: Array<{
    text: string;
    sequenceNumber: number;
  }>;
  successAssessment: {
    continuationScore: number;
    trend: 'rising' | 'stable' | 'declining';
    factors: {
      userEngagement: number;
      topicRelevance: number;
      emotionalTone: number;
      responseQuality: number;
      goalProximity: number;
    };
    issuesDetected?: Array<{
      type: 'explicit_rejection' | 'topic_drift' | 'aggressive_response' | 'low_engagement';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
    operatorAlert?: {
      required: boolean;
      urgency: 'low' | 'medium' | 'high' | 'critical';
      reason: string;
    };
  };
  dialogState: {
    totalMessages: number;
    goalProgress: number;
    languageActive: string;
    tokensUsed: number;
  };
}

export interface CreateDialogResult {
  dialogId: string;
  status: 'created' | 'error';
  initialState: {
    language: string;
    goal: string;
    completionCriteria: any;
  };
}

export interface DialogState {
  dialogId: string;
  status: 'active' | 'paused' | 'completed' | 'escalated';
  totalMessages: number;
  lastMessageAt: Date;
  continuationScore: number;
  goalProgress: number;
  tokensUsed: number;
  language: string;
}

export interface ControlResult {
  dialogId: string;
  action: string;
  success: boolean;
  newStatus: 'active' | 'paused' | 'completed' | 'escalated';
  message?: string;
}

export interface CompressedContext {
  summary: string;
  keyFacts: string[];
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  goal: string;
  userInfo?: any;
  referenceContext?: string;
}

export interface ScoringFactors {
  userEngagement: number;
  topicRelevance: number;
  emotionalTone: number;
  responseQuality: number;
  goalProximity: number;
}

export interface Config {
  scoring: {
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
  };
  rejection: {
    firstRejectionScore: number;
    secondRejectionScore: number;
    thirdRejectionScore: number;
    aggressiveRejectionScore: number;
  };
  topicDrift: {
    allowedOfftopicMessages: number;
    scorePenaltyPerDrift: number;
    directReturnAttemptAfter: number;
  };
  context: {
    compressionAfterMessages: number;
    maxMessagesInContext: number;
    keepLastMessagesVerbatim: number;
  };
}