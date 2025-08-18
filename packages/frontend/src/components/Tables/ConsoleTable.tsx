import React, { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent } from 'ag-grid-community'
import { Console as ConsoleEntry } from '../../types'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import 'ag-grid-community/styles/ag-grid.css'
import '../../styles/ag-grid-steam-theme.css'

interface ConsoleTableProps {
  entries: ConsoleEntry[]
}

// Custom cell renderers
const LevelRenderer = (params: any) => {
  const { level } = params.data
  
  const getLevelIcon = () => {
    switch (level) {
      case 'info': return <Info size={14} className="text-blue-400" />
      case 'success': return <CheckCircle size={14} className="text-green-400" />
      case 'warning': return <AlertTriangle size={14} className="text-yellow-400" />
      case 'error': return <XCircle size={14} className="text-red-400" />
      default: return <Info size={14} className="text-gray-400" />
    }
  }

  const getLevelColor = () => {
    switch (level) {
      case 'info': return 'text-blue-400'
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {getLevelIcon()}
      <span className={`${getLevelColor()} font-medium text-sm`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    </div>
  )
}

const TimestampRenderer = (params: any) => {
  const { timestamp } = params.data
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  return (
    <span className="font-mono text-sm text-gray-400">
      {formatTimestamp(timestamp)}
    </span>
  )
}

const MessageRenderer = (params: any) => {
  const { message, account } = params.data
  
  return (
    <div className="text-sm text-white">
      {account && (
        <span className="text-steam-green font-medium">[{account}] </span>
      )}
      <span>{message}</span>
    </div>
  )
}

const AccountRenderer = (params: any) => {
  const { account } = params.data
  
  if (!account) {
    return <span className="text-gray-500 italic">System</span>
  }
  
  return (
    <span className="text-steam-green font-mono text-sm">{account}</span>
  )
}

const ConsoleTable: React.FC<ConsoleTableProps> = ({ entries }) => {
  const gridRef = useRef<AgGridReact>(null)

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Time',
      field: 'timestamp',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 100,
      cellRenderer: TimestampRenderer,
      sort: 'desc'
    },
    {
      headerName: 'Level',
      field: 'level',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: LevelRenderer
    },
    {
      headerName: 'Account',
      field: 'account',
      sortable: true,
      filter: true,
      width: 140,
      cellRenderer: AccountRenderer
    },
    {
      headerName: 'Message',
      field: 'message',
      sortable: false,
      filter: true,
      flex: 1,
      minWidth: 300,
      cellRenderer: MessageRenderer,
      wrapText: true,
      autoHeight: false
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
        rowData={entries}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        animateRows={true}
        rowSelection="none"
        suppressMovableColumns={false}
        enableCellTextSelection={true}
        pagination={true}
        paginationPageSize={50}
        headerHeight={40}
        rowHeight={40}
        suppressMenuHide={false}
        enableBrowserTooltips={true}
        getRowId={(params) => params.data.id}
      />
    </div>
  )
}

export default ConsoleTable
