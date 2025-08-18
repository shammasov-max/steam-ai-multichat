import React from 'react'
import { Grid, List } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export type ViewType = 'list' | 'table'

interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  className?: string
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = ""
}) => {
  return (
    <div className={cn("flex items-center bg-steam-blue rounded-lg border border-steam-lightblue overflow-hidden", className)}>
      <Button
        onClick={() => onViewChange('list')}
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        className={cn(
          "flex items-center space-x-2 rounded-none border-0",
          currentView === 'list'
            ? 'bg-steam-green text-white hover:bg-steam-green/80'
            : 'text-gray-300 hover:text-white hover:bg-steam-lightblue/30'
        )}
        title="List View"
      >
        <List size={16} />
        <span className="hidden sm:inline">List</span>
      </Button>

      <Button
        onClick={() => onViewChange('table')}
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        className={cn(
          "flex items-center space-x-2 rounded-none border-l border-steam-lightblue",
          currentView === 'table'
            ? 'bg-steam-green text-white hover:bg-steam-green/80'
            : 'text-gray-300 hover:text-white hover:bg-steam-lightblue/30'
        )}
        title="Table View"
      >
        <Grid size={16} />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  )
}

export default ViewSwitcher
