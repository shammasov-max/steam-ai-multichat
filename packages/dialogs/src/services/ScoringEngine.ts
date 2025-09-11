import { ScoringFactors } from '../types'

interface Message {
  role: string
  content: string
}

interface ScoringConfig {
  thresholds: Record<'highSuccess' | 'moderateSuccess' | 'riskZone' | 'critical', number>
  weights: Record<keyof ScoringFactors, number>
}

export interface ScoringResult {
  continuationScore: number
  trend: 'rising' | 'stable' | 'declining'
  factors: ScoringFactors
  goalProgress: number
  issuesDetected?: Array<{
    type: 'explicit_rejection' | 'topic_drift' | 'aggressive_response' | 'low_engagement'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }>
}

const PATTERNS = {
  positiveEngagement: [/tell me more/i, /interested/i, /sounds good/i, /i like/i, /please explain/i, /how does.*work/i, /what.*about/i],
  negativeEngagement: [/not interested/i, /don't want/i, /leave me alone/i, /stop/i, /no thanks/i, /不需要/i, /不感兴趣/i],
  positiveEmotions: [/😊|😄|😃|👍|❤️|💕/, /thank you/i, /appreciate/i, /great/i, /awesome/i, /wonderful/i, /excellent/i, /perfect/i, /love it/i],
  negativeEmotions: [/😠|😡|😤|👎|💔/, /hate/i, /terrible/i, /awful/i, /disgusting/i, /horrible/i, /worst/i, /disappoint/i],
  aggression: [/fuck|shit|damn|hell|bastard|asshole/i, /stupid|idiot|moron|dumb/i, /shut up/i, /go away/i, /scam/i, /fraud/i],
  frustration: [/why.*keep.*asking/i, /already.*said/i, /told you/i, /how many times/i, /annoying/i, /irritating/i, /bothering/i],
  rejection: [/\bno\b/i, /not interested/i, /don't want/i, /never/i, /refuse/i, /decline/i, /reject/i, /不要/i, /不需要/i, /拒绝/i],
  personalization: [/\byou mentioned\b/i, /\byou said\b/i, /\byour.*interest\b/i, /\bbased on.*you\b/i, /\bspecifically for you\b/i, /\byour game\b/i, /\byour experience\b/i],
  progress: [/how much|what price/, /when|how long/, /sign up|register/, /try|test/]
} as const

const STOP_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once'])

export class ScoringEngine {
  constructor(private config: ScoringConfig, private previousScores: number[] = []) {}

  async evaluateDialog(messages: Message[], goal: string, init: string): Promise<ScoringResult> {
    const factors = this.calculateFactors(messages, goal)
    const continuationScore = this.calculateScore(factors)
    const trend = this.determineTrend(continuationScore)
    const goalProgress = this.calculateGoalProgress(messages)
    const issuesDetected = this.detectIssues(messages, factors)

    this.updateHistory(continuationScore)

    return {
      continuationScore,
      trend,
      factors,
      goalProgress,
      ...(issuesDetected.length > 0 && { issuesDetected })
    }
  }

  private calculateFactors(messages: Message[], goal: string): ScoringFactors {
    if (!messages?.length) return { userEngagement: 0, topicRelevance: 0, emotionalTone: 0.5, responseQuality: 0, goalProximity: 0 }
    
    const userMessages = messages.filter(m => m.role === 'USER')
    const assistantMessages = messages.filter(m => m.role === 'ASSISTANT')
    const lastUserMessages = userMessages.slice(-3)

    return {
      userEngagement: this.calculateEngagement(lastUserMessages),
      topicRelevance: this.calculateRelevance(messages.slice(-10), goal),
      emotionalTone: this.calculateTone(lastUserMessages),
      responseQuality: this.calculateQuality(assistantMessages),
      goalProximity: this.calculateProximity(userMessages)
    }
  }

  private calculateScore(factors: ScoringFactors): number {
    const score = Object.entries(factors).reduce((sum, [key, value]) => 
      sum + value * this.config.weights[key as keyof ScoringFactors], 0)
    return Math.max(0, Math.min(1, score))
  }

  private calculateEngagement(messages: Message[]): number {
    if (!messages.length) return 1.0
    
    return messages.reduce((score, msg) => {
      const content = msg.content.toLowerCase()
      const length = content.length
      const words = content.trim().split(/\s+/)
      
      return score
        + (length < 10 ? -0.1 : length > 100 ? 0.05 : 0)
        + (content.includes('?') ? 0.1 : 0)
        + (words.length <= 2 ? -0.15 : 0)
        + (this.matchesAny(content, PATTERNS.positiveEngagement) ? 0.15 : 0)
        + (this.matchesAny(content, PATTERNS.negativeEngagement) ? -0.2 : 0)
    }, 1.0)
  }

  private calculateRelevance(messages: Message[], goal: string): number {
    const goalKeywords = this.extractKeywords(goal.toLowerCase())
    if (!messages.length || !goalKeywords.size) return 0.5
    
    const scores = messages.map(msg => {
      const msgKeywords = this.extractKeywords(msg.content.toLowerCase())
      return this.keywordOverlap(goalKeywords, msgKeywords)
    })
    
    return Math.max(0, Math.min(1, scores.reduce((a, b) => a + b, 0) / scores.length))
  }

  private calculateTone(messages: Message[]): number {
    if (!messages.length) return 0.5
    
    return messages.reduce((score, msg) => {
      const content = msg.content.toLowerCase()
      return score
        + (this.matchesAny(content, PATTERNS.positiveEmotions) ? 0.2 : 0)
        + (this.matchesAny(content, PATTERNS.negativeEmotions) ? -0.25 : 0)
        + (this.matchesAny(content, PATTERNS.aggression) ? -0.4 : 0)
        + (this.matchesAny(content, PATTERNS.frustration) ? -0.15 : 0)
    }, 0.5)
  }

  private calculateQuality(messages: Message[]): number {
    if (!messages.length) return 0.5
    
    const recent = messages.slice(-3)
    return recent.reduce((score, msg, i) => {
      const content = msg.content
      const isRepetitive = messages.slice(Math.max(0, i - 3), i)
        .some(prev => this.similarity(content, prev.content) > 0.7)
      
      return score
        + (content.length < 50 ? -0.1 : content.length > 500 ? -0.05 : 0)
        + (isRepetitive ? -0.15 : 0)
        + (this.matchesAny(content, PATTERNS.personalization) ? 0.1 : 0)
    }, 0.7)
  }

  private calculateProximity(messages: Message[]): number {
    const indicators = messages.reduce((count, msg) => 
      count + PATTERNS.progress.filter(p => p.test(msg.content.toLowerCase())).length, 0)
    return Math.min(1, indicators * 0.2)
  }

  private calculateGoalProgress(messages: Message[]): number {
    const proximity = this.calculateProximity(messages.filter(m => m.role === 'USER'))
    const progressFromMessages = Math.min(messages.length / 20, 0.5)
    return Math.min(1, proximity * 0.7 + progressFromMessages * 0.3)
  }

  private determineTrend(current: number): 'rising' | 'stable' | 'declining' {
    if (!this.previousScores.length) {
      return current > 0.7 ? 'rising' : current < 0.3 ? 'declining' : 'stable'
    }
    
    const recent = this.previousScores.slice(-Math.min(3, this.previousScores.length))
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    const diff = current - avg
    
    return diff > 0.1 ? 'rising' : diff < -0.1 ? 'declining' : 'stable'
  }

  private detectIssues(messages: Message[], factors: ScoringFactors): Array<{
    type: 'explicit_rejection' | 'topic_drift' | 'aggressive_response' | 'low_engagement'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }> {
    const issues: Array<{
      type: 'explicit_rejection' | 'topic_drift' | 'aggressive_response' | 'low_engagement'
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
    }> = []
    const userMessages = messages.filter(m => m.role === 'USER').slice(-5)
    
    for (const msg of userMessages) {
      const content = msg.content.toLowerCase()
      
      if (this.matchesAny(content, PATTERNS.rejection)) {
        issues.push({
          type: 'explicit_rejection' as 'explicit_rejection',
          severity: (this.matchesAny(content, PATTERNS.aggression) ? 'critical' : 'high') as 'critical' | 'high',
          description: 'User has explicitly rejected the offer'
        })
      }
      
      if (this.matchesAny(content, PATTERNS.aggression)) {
        issues.push({
          type: 'aggressive_response' as 'aggressive_response',
          severity: 'critical' as 'critical',
          description: 'User is showing aggressive behavior'
        })
      }
    }
    
    if (factors.topicRelevance < 0.3) {
      issues.push({
        type: 'topic_drift' as 'topic_drift',
        severity: 'medium' as 'medium',
        description: 'Conversation has drifted significantly from the goal'
      })
    }
    
    if (factors.userEngagement < 0.3) {
      issues.push({
        type: 'low_engagement' as 'low_engagement',
        severity: (factors.userEngagement < 0.1 ? 'high' : 'medium') as 'high' | 'medium',
        description: 'User engagement is very low'
      })
    }
    
    return issues
  }

  private updateHistory(score: number) {
    this.previousScores.push(score)
    if (this.previousScores.length > 5) this.previousScores.shift()
  }

  private matchesAny(text: string, patterns: readonly RegExp[]): boolean {
    return patterns.some(p => p.test(text))
  }

  private extractKeywords(text: string): Set<string> {
    return new Set(
      text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    )
  }

  private keywordOverlap(set1: Set<string>, set2: Set<string>): number {
    if (!set1.size || !set2.size) return 0
    const overlap = [...set1].filter(k => set2.has(k)).length
    return overlap / Math.max(set1.size, set2.size)
  }

  private similarity(s1: string, s2: string): number {
    const [longer, shorter] = s1.length > s2.length ? [s1, s2] : [s2, s1]
    if (!longer.length) return 1.0
    
    const editDistance = this.levenshtein(longer.toLowerCase(), shorter.toLowerCase())
    return (longer.length - editDistance) / longer.length
  }

  private levenshtein(s1: string, s2: string): number {
    const dp: number[][] = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(0))
    
    for (let i = 0; i <= s2.length; i++) dp[i]![0] = i
    for (let j = 0; j <= s1.length; j++) dp[0]![j] = j
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        dp[i]![j] = s2[i - 1] === s1[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j - 1]!, dp[i]![j - 1]!, dp[i - 1]![j]!)
      }
    }
    
    return dp[s2.length]![s1.length]!
  }
}