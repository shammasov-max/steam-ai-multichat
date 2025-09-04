import React, { useRef, useEffect } from 'react'
import { Console as ConsoleEntry } from '../../types'
import { AlertTriangle, CheckCircle, Info, XCircle, Terminal } from 'lucide-react'

interface ConsoleProps {
  entries: ConsoleEntry[]
}

const Console: React.FC<ConsoleProps> = ({ entries }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const getLevelIcon = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'info': return <Info size={14} className="text-blue-400" />
      case 'success': return <CheckCircle size={14} className="text-green-400" />
      case 'warning': return <AlertTriangle size={14} className="text-yellow-400" />
      case 'error': return <XCircle size={14} className="text-red-400" />
      default: return <Info size={14} className="text-gray-400" />
    }
  }

  const getLevelColor = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-400'
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="bg-steam-blue rounded-lg border border-steam-lightblue overflow-hidden">
      <div className="bg-steam-lightblue px-4 py-3 border-b border-steam-lightblue">
        <div className="flex items-center space-x-2">
          <Terminal size={18} className="text-steam-green" />
          <h2 className="text-lg font-semibold text-white">Console Output</h2>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>{entries.length} entries</span>
            <div className="w-2 h-2 bg-steam-green rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-sm">
        {entries.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Terminal size={48} className="mx-auto mb-4 opacity-50" />
            <p>No console output yet...</p>
            <p className="text-xs mt-2">Console messages will appear here</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start space-x-3 py-1 hover:bg-steam-lightblue/20 rounded px-2 -mx-2">
              <span className="text-gray-400 text-xs mt-0.5 shrink-0">
                {formatTimestamp(entry.timestamp)}
              </span>
              <div className="shrink-0 mt-0.5">
                {getLevelIcon(entry.level)}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`${getLevelColor(entry.level)} break-words`}>
                  {entry.account && (
                    <span className="text-steam-green font-medium">[{entry.account}] </span>
                  )}
                  {entry.message}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
      
      <div className="bg-steam-lightblue/30 px-4 py-2 border-t border-steam-lightblue">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Auto-scroll enabled</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Success</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Warning</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>Error</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Console
