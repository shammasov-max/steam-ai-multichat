# ctx - Compact Context Display

Ultra-concise context viewer with focus on the compact table format.

## Usage
```bash
/ctx              # Default: compact table view
/ctx table        # Same as default - compact table
/ctx free         # Show only free space
/ctx full         # Standard compact view
/ctx messages     # Detailed message analysis
```

## Primary Format - Compact Table

### `/ctx` or `/ctx table`
```
Free Space: 100.3k tokens (50.1%)

Состав сообщений (69.2k tokens):
| Тип активности | % | Tokens | Описание |
|---|---|---|---|
| Q&A планирование | 35% | 24.2k | 15 вопросов по parallel execution |
| Чтение файлов | 25% | 17.3k | CLAUDE.md, README, CHANGELOG |
| Запись/редактирование | 20% | 13.8k | Создание parallel-execution.md, edits |
| Пояснения | 15% | 10.4k | Insights, объяснения архитектуры |
| Команды | 5% | 3.5k | Glob, Todo, Memory, /context |

Главные потребители: Q&A диалог (24k), многократное чтение CLAUDE.md (8k), создание pattern doc (3k)
```

## Alternative Formats

### `/ctx free` - Free Space Only
```
FREE SPACE: 100.3k tokens (50.1%)
```

### `/ctx full` - Standard View
```
Context: 49% used (98k/200k)
Free: 102k tokens (51%)

Top consumers:
• Messages: 67.7k (34%)
• System tools: 12.4k (6%)
• MCP tools: 8.1k (4%)
• Memory: 6.7k (3%)
• Custom agents: 0.5k (0.3%)
```

### `/ctx messages` - Detailed Message Breakdown
```
MESSAGE ANALYSIS (69.2k tokens):

Planning & Discussion:
  Q&A сессия по plan generation    ████████░░░░  35% (24.2k)

File Operations:
  Чтение файлов                     ██████░░░░░░  25% (17.3k)
  Запись и редактирование           █████░░░░░░░  20% (13.8k)

Communication:
  Объяснения и insights             ████░░░░░░░░  15% (10.4k)
  Системные команды                 █░░░░░░░░░░░   5% (3.5k)

Top files by read frequency:
1. CLAUDE.md - 8k tokens (multiple reads)
2. README.md - 2k tokens
3. CHANGELOG.md - 2k tokens
```

## Features

- **Default to table** - Most concise format is the default
- **Localized** - Supports mixed language output
- **Practical** - Shows what's consuming space and why
- **Fast** - Instant overview without scrolling
- **Actionable** - Identifies largest consumers

## Implementation Notes

The table format provides:
- **Free space** prominently at top
- **Compact table** with percentages and token counts
- **Descriptions** in the language used during session
- **Summary line** highlighting main consumers

## Quick Reference

| Command | Output | Best For |
|---------|--------|----------|
| `/ctx` | Compact table | Default quick check |
| `/ctx free` | One line | Pre-operation check |
| `/ctx full` | Standard view | Overall breakdown |
| `/ctx messages` | Detailed analysis | Optimization planning |

## Examples

```bash
# Quick check (default table)
/ctx

# Before large operation
/ctx free
> FREE SPACE: 100.3k tokens (50.1%)

# Investigate high usage
/ctx messages
> Top consumer: Q&A сессия (24.2k tokens)
```

This command optimizes for the most common use case: quickly understanding what's using context and how much space remains.