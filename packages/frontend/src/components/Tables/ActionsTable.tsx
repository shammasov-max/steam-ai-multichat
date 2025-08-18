import React, { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent } from 'ag-grid-community'
import { MessageSquare, UserPlus, Award, Clock, Send, Play, Square, Settings } from 'lucide-react'
import 'ag-grid-community/styles/ag-grid.css'
import '../../styles/ag-grid-steam-theme.css'

interface Action {
  id: string
  title: string
  description: string
  category: 'messaging' | 'social' | 'gaming'
  icon: string
  color: string
}

interface ActionsTableProps {
  actions: Action[]
}

// Custom cell renderers
const TitleRenderer = (params: any) => {
  const { title, icon, color } = params.data
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare size={16} />
      case 'UserPlus': return <UserPlus size={16} />
      case 'Award': return <Award size={16} />
      case 'Clock': return <Clock size={16} />
      case 'Send': return <Send size={16} />
      default: return <Settings size={16} />
    }
  }
  
  return (
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded ${color} shrink-0`}>
        <div className="text-white">
          {getIcon(icon)}
        </div>
      </div>
      <span className="font-medium text-white">{title}</span>
    </div>
  )
}

const CategoryRenderer = (params: any) => {
  const { category } = params.data
  
  const getCategoryColor = () => {
    switch (category) {
      case 'messaging': return 'text-blue-400'
      case 'social': return 'text-green-400'
      case 'gaming': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }
  
  const getCategoryBadge = () => {
    switch (category) {
      case 'messaging': return 'bg-blue-600/20 border-blue-600/30'
      case 'social': return 'bg-green-600/20 border-green-600/30'
      case 'gaming': return 'bg-purple-600/20 border-purple-600/30'
      default: return 'bg-gray-600/20 border-gray-600/30'
    }
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryBadge()} ${getCategoryColor()}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  )
}

const DescriptionRenderer = (params: any) => {
  const { description } = params.data
  
  return (
    <span className="text-sm text-gray-300">{description}</span>
  )
}

const ActionsRenderer = (params: any) => {
  const { data } = params
  
  const handleConfigure = () => {
    console.log('Configure action:', data.id)
  }
  
  const handleStart = () => {
    console.log('Start action:', data.id)
  }
  
  const handleStop = () => {
    console.log('Stop action:', data.id)
  }
  
  return (
    <div className="flex space-x-1">
      <button 
        onClick={handleConfigure}
        className="steam-action-button"
        title="Configure"
      >
        <Settings size={12} />
      </button>
      <button 
        onClick={handleStart}
        className="steam-action-button success"
        title="Start"
      >
        <Play size={12} />
      </button>
      <button 
        onClick={handleStop}
        className="steam-action-button danger"
        title="Stop"
      >
        <Square size={12} />
      </button>
    </div>
  )
}

const ActionsTable: React.FC<ActionsTableProps> = ({ actions }) => {
  const gridRef = useRef<AgGridReact>(null)

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Action',
      field: 'title',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 250,
      cellRenderer: TitleRenderer
    },
    {
      headerName: 'Category',
      field: 'category',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: CategoryRenderer
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: false,
      filter: true,
      flex: 1,
      minWidth: 200,
      cellRenderer: DescriptionRenderer
    },
    {
      headerName: 'Controls',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 140,
      cellRenderer: ActionsRenderer
    }
  ], [])

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  }, [])

  return (
    <div className="ag-theme-steam" style={{ height: '600px', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={actions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        animateRows={true}
        rowSelection="single"
        suppressRowClickSelection={false}
        suppressMovableColumns={false}
        enableCellTextSelection={true}
        pagination={true}
        paginationPageSize={20}
        headerHeight={40}
        rowHeight={60}
        suppressMenuHide={false}
        enableBrowserTooltips={true}
        getRowId={(params) => params.data.id}
      />
    </div>
  )
}

export default ActionsTable
