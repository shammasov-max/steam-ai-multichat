import React, { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent } from 'ag-grid-community'
import { Account } from '../../types'
import { Users, Play, Square, Trash2 } from 'lucide-react'
import 'ag-grid-community/styles/ag-grid.css'
import '../../styles/ag-grid-steam-theme.css'

interface AccountsTableProps {
  accounts: Account[]
  selectedAccounts: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

// Custom cell renderers
const StatusRenderer = (params: any) => {
  const { status, isLoggedIn } = params.data
  
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'idle': return 'text-yellow-400'
      case 'busy': return 'text-red-400'
      case 'offline': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusDot = () => {
    switch (status) {
      case 'online': return 'bg-green-400'
      case 'idle': return 'bg-yellow-400'
      case 'busy': return 'bg-red-400'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusDot()}`}></div>
      <span className={getStatusColor()}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {isLoggedIn && (
        <span className="text-green-400 text-xs">• Logged In</span>
      )}
    </div>
  )
}

const AvatarRenderer = (params: any) => {
  const { username } = params.data
  
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-steam-lightblue rounded-full flex items-center justify-center">
        <Users size={16} className="text-gray-300" />
      </div>
      <span className="font-medium text-white">{username}</span>
    </div>
  )
}

const LastActivityRenderer = (params: any) => {
  const { lastActivity } = params.data
  
  if (!lastActivity) {
    return <span className="text-gray-500 italic">Never</span>
  }
  
  return (
    <span className="text-gray-300 text-sm">
      {lastActivity.toLocaleString()}
    </span>
  )
}

const ActionsRenderer = (params: any) => {
  const { data } = params
  
  const handleStart = () => {
    console.log('Start account:', data.id)
  }
  
  const handleStop = () => {
    console.log('Stop account:', data.id)
  }
  
  const handleDelete = () => {
    console.log('Delete account:', data.id)
  }
  
  return (
    <div className="flex space-x-1">
      <button 
        onClick={handleStart}
        className="steam-action-button success"
        title="Start"
      >
        <Play size={12} />
      </button>
      <button 
        onClick={handleStop}
        className="steam-action-button"
        title="Stop"
      >
        <Square size={12} />
      </button>
      <button 
        onClick={handleDelete}
        className="steam-action-button danger"
        title="Delete"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

const AccountsTable: React.FC<AccountsTableProps> = ({ 
  accounts, 
  selectedAccounts, 
  onSelectionChange 
}) => {
  const gridRef = useRef<AgGridReact>(null)

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Account',
      field: 'username',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 200,
      cellRenderer: AvatarRenderer
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 150,
      cellRenderer: StatusRenderer
    },
    {
      headerName: 'Last Activity',
      field: 'lastActivity',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 180,
      cellRenderer: LastActivityRenderer
    },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 120,
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

  const onSelectionChanged = useCallback(() => {
    const selectedNodes = gridRef.current?.api?.getSelectedNodes() || []
    const selectedIds = selectedNodes.map(node => node.data.id)
    onSelectionChange(selectedIds)
  }, [onSelectionChange])

  return (
    <div className="ag-theme-steam" style={{ height: '600px', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={accounts}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onSelectionChanged={onSelectionChanged}
        animateRows={true}
        rowSelection="multiple"
        suppressRowClickSelection={false}
        rowMultiSelectWithClick={true}
        suppressMovableColumns={false}
        enableCellTextSelection={true}
        pagination={true}
        paginationPageSize={20}
        headerHeight={40}
        rowHeight={50}
        suppressMenuHide={false}
        enableBrowserTooltips={true}
        rowMultiSelectWithClick={true}
        getRowId={(params) => params.data.id}
      />
    </div>
  )
}

export default AccountsTable
