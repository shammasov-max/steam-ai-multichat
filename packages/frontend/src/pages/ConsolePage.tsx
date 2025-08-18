import React, { useState } from 'react'
import Console from '../components/Console/Console'
import SearchBox from '../components/UI/SearchBox'
import ViewSwitcher, { ViewType } from '../components/UI/ViewSwitcher'
import ConsoleTable from '../components/Tables/ConsoleTable'
import { Console as ConsoleEntry } from '../types'
import { Filter } from 'lucide-react'

interface ConsolePageProps {
  entries: ConsoleEntry[]
}

const ConsolePage: React.FC<ConsolePageProps> = ({ entries }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all')
  const [currentView, setCurrentView] = useState<ViewType>('list')

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.account && entry.account.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLevel = levelFilter === 'all' || entry.level === levelFilter
    return matchesSearch && matchesLevel
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Console Output</h1>
        <div className="text-sm text-gray-300">
          {filteredEntries.length} of {entries.length} entries
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search console messages or accounts..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <ViewSwitcher
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>

      {currentView === 'list' ? (
        <Console entries={filteredEntries} />
      ) : (
        <ConsoleTable entries={filteredEntries} />
      )}
    </div>
  )
}

export default ConsolePage
