/**
 * Example of using the @steam-bot/isomorphic package
 * This demonstrates integration with the main steam-bot application
 */

// Domain models
import type { AppState, Bot, Task } from '@steam-bot/isomorphic'

// Events
import { events } from '@steam-bot/isomorphic'
import type { DomainEvent } from '@steam-bot/isomorphic'

// Commands
import { commands } from '@steam-bot/isomorphic'
import type { Command } from '@steam-bot/isomorphic'

// State management
import { rootReducer, createInitialAppState } from '@steam-bot/isomorphic'

// Utilities
import { generateBotId, generateTaskId } from '@steam-bot/isomorphic'
import { EventBuffer, createSSESnapshot, formatSSEMessage } from '@steam-bot/isomorphic'

// Example: Initialize application state
const initializeApp = () => {
  const state = createInitialAppState()
  console.log('Initial state created:', state)
  return state
}

// Example: Handle bot connection
const handleBotConnection = (state: AppState, maFileData: string, proxyUrl: string) => {
  const botId = generateBotId()
  
  // Create bot connected event
  const event = events.botConnected({ botId })
  
  // Apply event to state
  const newState = rootReducer(state, event)
  
  console.log('Bot connected:', botId)
  return newState
}

// Example: Create and assign task
const createAndAssignTask = (
  state: AppState,
  playerSteamId64: string,
  item: string,
  priceMin: number,
  priceMax: number
) => {
  const taskId = generateTaskId()
  
  // Create task
  const createEvent = events.taskCreated({
    taskId,
    playerSteamId64,
    item,
    priceMin,
    priceMax
  })
  
  let newState = rootReducer(state, createEvent)
  
  // Find available bot
  const availableBot = Object.values(newState.bots)
    .find(bot => bot.status === 'connected')
  
  if (availableBot) {
    // Assign task to bot
    const assignEvent = events.taskAssigned({
      taskId,
      botId: availableBot.id
    })
    
    newState = rootReducer(newState, assignEvent)
    console.log(`Task ${taskId} assigned to bot ${availableBot.id}`)
  }
  
  return newState
}

// Example: Event batching for SSE
const setupEventStreaming = () => {
  const buffer = new EventBuffer(100, (events: DomainEvent[]) => {
    // This would be sent to connected clients
    const batch = { events }
    const sseMessage = formatSSEMessage({
      type: 'batch',
      data: events,
      timestamp: Date.now()
    })
    
    console.log('Sending batch:', events.length, 'events')
    // In real app: sendToClients(sseMessage)
  })
  
  return buffer
}

// Example: Command handling
const handleCommand = async (command: Command, state: AppState): Promise<AppState> => {
  switch (command.type) {
    case 'CreateTask':
      return createAndAssignTask(
        state,
        command.playerSteamId64,
        command.item,
        command.priceMin,
        command.priceMax
      )
    
    case 'ToggleAgent':
      const event = events.chatAgentToggled({
        chatId: command.chatId,
        enabled: command.enabled
      })
      return rootReducer(state, event)
    
    default:
      console.log('Unknown command:', command.type)
      return state
  }
}

// Example usage
const main = () => {
  // Initialize
  let state = initializeApp()
  const eventBuffer = setupEventStreaming()
  
  // Connect a bot
  state = handleBotConnection(state, '{"shared_secret":"..."}', 'http://proxy.example.com')
  
  // Create a task
  state = createAndAssignTask(
    state,
    '76561198000000001',
    'AK-47 | Redline',
    10,
    20
  )
  
  // Handle a command
  const createTaskCommand = commands.createTask({
    playerSteamId64: '76561198000000002',
    item: 'AWP | Dragon Lore',
    priceMin: 1000,
    priceMax: 2000
  })
  
  handleCommand(createTaskCommand, state).then(newState => {
    console.log('State after command:', newState)
  })
  
  // Create snapshot for new SSE connection
  const snapshot = createSSESnapshot(state)
  const snapshotMessage = formatSSEMessage(snapshot)
  console.log('Snapshot ready for SSE:', snapshotMessage.length, 'bytes')
}

// Run example
if (require.main === module) {
  main()
}

export {
  initializeApp,
  handleBotConnection,
  createAndAssignTask,
  setupEventStreaming,
  handleCommand
}
