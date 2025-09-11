// Simple playground mode
import { store } from './simple-store'
import { rootSaga } from './simple-sagas'

// Update status in HTML
function updateStatus(message: string) {
    const statusEl = document.getElementById('status')
    if (statusEl) {
        statusEl.textContent = message
        statusEl.style.color = message.includes('Error') ? 'red' : 'green'
    }
}

// Initialize the playground
async function initializePlayground() {
    try {
        updateStatus('Initializing effect-redux playground...')
        
        // Log initial state
        console.log('🏁 Initial Redux State:', store.getState())
        
        // Start the mock sagas
        console.log('🎬 Starting mock sagas...')
        store.runSaga({
            id: 'rootSaga',
            effect: rootSaga
        })
        
        updateStatus('Running! Check Redux DevTools and console.')
        
        // Expose utilities for debugging
        ;(window as any).helpers = {
            getState: () => store.getState(),
            dispatch: store.dispatch,
            restartSagas: () => {
                store.stopSaga('rootSaga')
                setTimeout(() => {
                    store.runSaga({
                        id: 'rootSaga',
                        effect: rootSaga
                    })
                    console.log('🔄 Sagas restarted')
                }, 100)
            }
        }
        
        console.log('🎮 Playground initialized!')
        console.log('💡 Use window.helpers.getState() to inspect state')
        console.log('💡 Use window.helpers.restartSagas() to restart workflows')
        console.log('📊 Open Redux DevTools to watch actions flow!')
        
    } catch (error) {
        console.error('❌ Failed to initialize playground:', error)
        updateStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayground)
} else {
    initializePlayground()
}