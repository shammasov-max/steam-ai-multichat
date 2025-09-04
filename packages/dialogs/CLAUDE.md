# CLAUDE.MD - Dialog AI Module Implementation Specification

## Overview
TypeScript library for AI-powered dialog management using OpenAI models, designed as a self-contained module with a facade pattern. The library handles conversation state, context optimization, and success scoring internally.

**Schema Update**: The `completionCriteria`, `negotiationSettings`, and `referenceContext` fields have been removed from the dialogs schema. All behavior configuration is now handled through the `init` field, which contains the initial prompt that describes the dialog's purpose, completion criteria, negotiation settings, and any reference context.

## Tech Stack
- **Language:** TypeScript 5.0+
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL with Drizzle ORM
- **AI Provider:** OpenAI GPT-4
- **Key Dependencies:** `openai`, `drizzle-orm`, `js-yaml`

## Package Structure
```
dialogs/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── DialogManager.ts            # Main facade class
│   ├── types/
│   │   └── index.ts               # All TypeScript interfaces
│   ├── services/
│   │   ├── AIService.ts           # OpenAI integration
│   │   ├── ContextCompressor.ts   # Context optimization
│   │   ├── LanguageDetector.ts    # CJK/Latin detection
│   │   └── ScoringEngine.ts       # Success scoring
│   ├── schema/
│   │   └── dialogs.ts             # Database schema
│   └── config/
│       └── default.yaml           # Default configurations
├── package.json
└── tsconfig.json
```

## Database Schema (Drizzle)


## Core TypeScript Interfaces

```typescript
// src/types/index.ts

export interface DialogManagerConfig {
  database: {
    url: string;  // PostgreSQL connection string
  };
  openai: {
    apiKey: string;
    model?: 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
    maxTokensPerRequest?: number;  // default: 8000
  };
  configPath?: string;  // Path to YAML config
}

export interface CreateDialogParams {
  language: 'zh' | 'ja' | 'ko' | 'en' | 'es';
  userInfo?: {
    country?: string;
    city?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    games?: string[];
  };
  goal: string;  // Can be multiple pages
  init: string;  // Initial instructions for the dialog - replaces completionCriteria, negotiationSettings, and referenceContext
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
    continuationScore: number;  // 0-1
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
```


## Configuration (YAML)

```yaml
# config/default.yaml
scoring:
  thresholds:
    highSuccess: 0.7
    moderateSuccess: 0.5
    riskZone: 0.3
    critical: 0.2
  weights:
    userEngagement: 0.30
    topicRelevance: 0.25
    emotionalTone: 0.20
    responseQuality: 0.15
    goalProximity: 0.10

rejection:
  firstRejectionScore: 0.4
  secondRejectionScore: 0.2
  thirdRejectionScore: 0.05
  aggressiveRejectionScore: 0.1

topicDrift:
  allowedOfftopicMessages: 4
  scorePenaltyPerDrift: 0.05
  directReturnAttemptAfter: 5

context:
  compressionAfterMessages: 10
  maxMessagesInContext: 20
  keepLastMessagesVerbatim: 5
```

## Key Implementation Details

### Language Detection Algorithm
```typescript
// src/services/LanguageDetector.ts
export class LanguageDetector {
  detect(text: string, fallbackLanguage: string): string {
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';  // Chinese
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';  // Japanese
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';  // Korean
    if (/[а-яА-Я]/.test(text)) return 'ru';  // Russian (for testing)
    if (/[áéíóúñ¿¡]/i.test(text)) return 'es';  // Spanish
    return fallbackLanguage;
  }
}
```

### Context Compression Strategy
1. After every 10 messages, create a summary of previous exchanges
2. Store key facts separately (user preferences, explicit agreements/rejections)
3. Keep last 5 messages verbatim
4. Compress greetings/farewells to markers
5. Never compress critical information (rejections, agreements, specific questions)

### Success Scoring Algorithm
```typescript
calculateScore(factors: ScoringFactors): number {
  const weights = this.config.weights;
  return (
    factors.userEngagement * weights.userEngagement +
    factors.topicRelevance * weights.topicRelevance +
    factors.emotionalTone * weights.emotionalTone +
    factors.responseQuality * weights.responseQuality +
    factors.goalProximity * weights.goalProximity
  );
}
```

### Special Situation Handling

**Explicit Rejection:**
- First rejection → Soft alternative, score = 0.4
- Second rejection → Polite closure, score = 0.2  
- Aggressive rejection → Immediate termination, score = 0.1

**Topic Drift:**
- 1-2 off-topic messages → Support + soft return
- 3-4 messages → Short answers + explicit return
- 5+ messages → score = 0.35 + operator notification

### OpenAI Integration Pattern
```typescript
async generateResponse(context: CompressedContext, userMessage: string): Promise<string> {
  const systemPrompt = this.buildSystemPrompt(context);
  const response = await this.openai.chat.completions.create({
    model: this.config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...context.recentMessages,
      { role: 'user', content: userMessage }
    ],
    max_tokens: this.config.maxTokensPerRequest,
    temperature: 0.7
  });
  return response.choices[0].message.content;
}
```

## Usage Example

```typescript
import { DialogManager } from 'dialog-ai-module';

const manager = new DialogManager({
  database: { url: process.env.DATABASE_URL },
  openai: { 
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview'
  }
});

// Create dialog
const dialog = await manager.createDialog({
  language: 'zh',
  goal: 'Offer premium gaming coaching subscription',
  init: 'You are a friendly gaming coach salesperson. Your goal is to offer premium gaming coaching subscription. Look for agreement keywords like "是的", "好的", "同意" to indicate user acceptance.'
});

// Process user message
const response = await manager.processMessage({
  dialogId: dialog.dialogId,
  message: { text: '这个服务多少钱?', timestamp: new Date() }
});

// Check if operator intervention needed
if (response.successAssessment.continuationScore < 0.3) {
  await manager.controlDialog(dialog.dialogId, 'escalate');
}
```

## Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dialogs
OPENAI_API_KEY=sk-...
NODE_ENV=development
```

## Package.json
```json
{
  "name": "dialog-ai-module",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "openai": "^4.0.0",
    "js-yaml": "^4.1.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/js-yaml": "^4.0.0"
  }
}
```

## Critical Implementation Notes

1. **Context Window Optimization:** Never send more than 20 messages to GPT-4. Use compression for older messages.

2. **Token Counting:** Track token usage per dialog to prevent exceeding limits and estimate costs.

3. **Language Switching:** Detect language per message but maintain conversation flow in detected language.

4. **Logging:** Log all API calls, score changes, and strategy switches to database for analysis.

5. **Error Handling:** Gracefully handle OpenAI API failures with exponential backoff retry.

6. **State Management:** Store full conversation in database but use compressed version for API calls.

This specification provides everything needed to implement the dialog module. The facade pattern ensures clean integration with the CRM system while hiding complexity internally.
