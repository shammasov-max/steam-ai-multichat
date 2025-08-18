import React, { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent } from 'ag-grid-community'
import { Friend } from '../../types'
import { Users, MessageCircle, ExternalLink } from 'lucide-react'
import 'ag-grid-community/styles/ag-grid.css'
import '../../styles/ag-grid-steam-theme.css'

interface FriendsTableProps {
  friends: Friend[]
}

// Custom cell renderers
const StatusRenderer = (params: any) => {
  const { status } = params.data
  
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'away': return 'text-yellow-400'
      case 'busy': return 'text-red-400'
      case 'offline': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusDot = () => {
    switch (status) {
      case 'online': return 'bg-green-400'
      case 'away': return 'bg-yellow-400'
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
    </div>
  )
}

const NameRenderer = (params: any) => {
  const { name } = params.data
  
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-steam-lightblue rounded-full flex items-center justify-center">
        <Users size={16} className="text-gray-300" />
      </div>
      <span className="font-medium text-white">{name}</span>
    </div>
  )
}

const SteamIdRenderer = (params: any) => {
  const { steamId } = params.data
  
  return (
    <span className="font-mono text-sm text-gray-300">{steamId}</span>
  )
}

const LastMessageRenderer = (params: any) => {
  const { lastMessage } = params.data
  
  if (!lastMessage) {
    return <span className="text-gray-500 italic">No messages</span>
  }
  
  return (
    <div className="text-sm text-gray-300 max-w-xs">
      <span className="truncate block">"{lastMessage}"</span>
    </div>
  )
}

const LastSeenRenderer = (params: any) => {
  const { lastSeen } = params.data
  
  if (!lastSeen) {
    return <span className="text-gray-500 italic">Never</span>
  }
  
  return (
    <span className="text-gray-300 text-sm">
      {lastSeen.toLocaleString()}
    </span>
  )
}

const ActionsRenderer = (params: any) => {
  const { data } = params
  
  const handleMessage = () => {
    console.log('Message friend:', data.id)
  }
  
  const handleProfile = () => {
    console.log('View profile:', data.steamId)
  }
  
  return (
    <div className="flex space-x-1">
      <button 
        onClick={handleMessage}
        className="steam-action-button success"
        title="Send Message"
      >
        <MessageCircle size={12} />
      </button>
      <button 
        onClick={handleProfile}
        className="steam-action-button"
        title="View Profile"
      >
        <ExternalLink size={12} />
      </button>
    </div>
  )
}

const FriendsTable: React.FC<FriendsTableProps> = ({ friends }) => {
  const gridRef = useRef<AgGridReact>(null)

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Name',
      field: 'name',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 200,
      cellRenderer: NameRenderer
    },
    {
      headerName: 'Steam ID',
      field: 'steamId',
      sortable: true,
      filter: true,
      width: 180,
      cellRenderer: SteamIdRenderer
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: StatusRenderer
    },
    {
      headerName: 'Last Message',
      field: 'lastMessage',
      sortable: false,
      filter: true,
      flex: 1,
      minWidth: 200,
      cellRenderer: LastMessageRenderer
    },
    {
      headerName: 'Last Seen',
      field: 'lastSeen',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 160,
      cellRenderer: LastSeenRenderer
    },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 100,
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
        rowData={friends}
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
        rowHeight={50}
        suppressMenuHide={false}
        enableBrowserTooltips={true}
        getRowId={(params) => params.data.id}
      />
    </div>
  )
}

export default FriendsTable
