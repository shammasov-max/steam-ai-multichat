import React from 'react'
import { Grid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewType = 'list' | 'grid'

interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center bg-steam-blue rounded-lg p-1">
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          "p-2 rounded transition-colors",
          currentView === 'list' 
            ? "bg-steam-green text-white" 
            : "text-gray-400 hover:text-white"
        )}
        title="List View"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          "p-2 rounded transition-colors",
          currentView === 'grid' 
            ? "bg-steam-green text-white" 
            : "text-gray-400 hover:text-white"
        )}
        title="Grid View"
      >
        <Grid size={16} />
      </button>
    </div>
  )
}

export default ViewSwitcher