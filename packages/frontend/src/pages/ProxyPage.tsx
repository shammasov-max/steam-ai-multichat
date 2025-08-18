import React, { useState, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, FilterChangedEvent, SortChangedEvent, GridApi } from 'ag-grid-community'
import { ProxyServer } from '../types'
import SearchBox from '../components/UI/SearchBox'
import ViewSwitcher, { ViewType } from '../components/UI/ViewSwitcher'
import StatusFilter from '../components/Grid/StatusFilter'
import { Wifi, WifiOff, Plus, Upload, Download, Trash2, RefreshCw, Filter } from 'lucide-react'
import 'ag-grid-community/styles/ag-grid.css'
import '../styles/ag-grid-steam-theme.css'

// Custom cell renderers
const StatusRenderer = (params: any) => {
  const { status } = params.data
  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <Wifi size={14} />
      case 'disconnected': return <WifiOff size={14} />
      case 'error': return <WifiOff size={14} />
      default: return <WifiOff size={14} />
    }
  }

  return (
    <div className={`status-badge ${status}`}>
      <div className={`status-dot ${status}`}></div>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  )
}

const AccountsRenderer = (params: any) => {
  const { accounts } = params.data
  if (!accounts || accounts.length === 0) {
    return <span className="text-gray-400">No accounts</span>
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {accounts.slice(0, 3).map((account: string, index: number) => (
        <span key={index} className="account-tag">
          {account}
        </span>
      ))}
      {accounts.length > 3 && (
        <span className="account-tag">
          +{accounts.length - 3} more
        </span>
      )}
    </div>
  )
}

const ActionsRenderer = (params: any) => {
  const { data } = params
  
  const handleConnect = () => {
    console.log('Connect proxy:', data.id)
  }
  
  const handleTest = () => {
    console.log('Test proxy:', data.id)
  }
  
  const handleDelete = () => {
    console.log('Delete proxy:', data.id)
  }
  
  return (
    <div className="flex space-x-1">
      <button 
        onClick={handleConnect}
        className="steam-action-button success"
        title="Connect"
      >
        <RefreshCw size={12} />
      </button>
      <button 
        onClick={handleTest}
        className="steam-action-button"
        title="Test"
      >
        Test
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

const ProxyPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'error'>('all')
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const gridRef = useRef<AgGridReact>(null)
  const [selectedRows, setSelectedRows] = useState<ProxyServer[]>([])
  
  const [proxies] = useState<ProxyServer[]>([
    {
      id: '1',
      host: '192.168.1.100',
      port: 8080,
      username: 'proxyuser',
      password: '********',
      status: 'connected',
      accounts: ['steamuser123', 'botaccount456']
    },
    {
      id: '2',
      host: '10.0.0.50',
      port: 3128,
      status: 'disconnected',
      accounts: []
    },
    {
      id: '3',
      host: 'proxy.example.com',
      port: 8888,
      username: 'user',
      password: '********',
      status: 'error',
      accounts: ['testuser789']
    },
    {
      id: '4',
      host: '203.142.71.33',
      port: 8080,
      status: 'connected',
      accounts: ['demouser001']
    },
    {
      id: '5',
      host: 'premium-proxy.net',
      port: 1080,
      username: 'premiumuser',
      password: '********',
      status: 'connected',
      accounts: ['account001', 'account002', 'account003']
    },
    {
      id: '6',
      host: '198.51.100.10',
      port: 8080,
      status: 'disconnected',
      accounts: []
    },
    {
      id: '7',
      host: 'secure-proxy.com',
      port: 3128,
      username: 'secureuser',
      password: '********',
      status: 'connected',
      accounts: ['securebot001', 'securebot002']
    },
    {
      id: '8',
      host: '203.0.113.25',
      port: 1080,
      status: 'error',
      accounts: ['errorbot001']
    }
  ])

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Host',
      field: 'host',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center space-x-2">
            <span className="font-mono">{params.value}</span>
          </div>
        )
      }
    },
    {
      headerName: 'Port',
      field: 'port',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 80,
      cellRenderer: (params: any) => {
        return <span className="font-mono">{params.value}</span>
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: StatusFilter,
      width: 120,
      cellRenderer: StatusRenderer
    },
    {
      headerName: 'Username',
      field: 'username',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params: any) => {
        return params.value ? (
          <span className="text-gray-300">{params.value}</span>
        ) : (
          <span className="text-gray-500 italic">No auth</span>
        )
      }
    },
    {
      headerName: 'Assigned Accounts',
      field: 'accounts',
      sortable: false,
      filter: false,
      flex: 1,
      minWidth: 200,
      cellRenderer: AccountsRenderer
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

  // Filter the data based on search term and status filter
  const filteredProxies = useMemo(() => {
    return proxies.filter(proxy => {
      const matchesSearch = !searchTerm ||
        proxy.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proxy.port.toString().includes(searchTerm) ||
        (proxy.username && proxy.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        proxy.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proxy.accounts.some(account => account.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || proxy.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [proxies, searchTerm, statusFilter])

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  }, [])

  const onFilterChanged = useCallback((params: FilterChangedEvent) => {
    console.log('Filter changed:', params.api.getFilterModel())
  }, [])

  const onSortChanged = useCallback((params: SortChangedEvent) => {
    console.log('Sort changed:', params.api.getSortModel())
  }, [])

  const onSelectionChanged = useCallback(() => {
    const selectedNodes = gridRef.current?.api?.getSelectedNodes() || []
    setSelectedRows(selectedNodes.map(node => node.data))
  }, [])

  // Bulk actions
  const handleBulkTest = () => {
    console.log('Testing proxies:', selectedRows)
  }

  const handleBulkConnect = () => {
    console.log('Connecting proxies:', selectedRows)
  }

  const handleBulkDelete = () => {
    console.log('Deleting proxies:', selectedRows)
  }

  const clearFilters = () => {
    gridRef.current?.api?.setFilterModel(null)
  }

  const exportData = () => {
    // Custom CSV export since exportDataAsCsv is enterprise-only
    const headers = ['Host', 'Port', 'Status', 'Username', 'Accounts Count']
    const rows = filteredProxies.map(proxy => [
      proxy.host,
      proxy.port.toString(),
      proxy.status,
      proxy.username || 'No auth',
      proxy.accounts.length.toString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'proxies.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Import Proxy</h1>
        <div className="text-sm text-gray-300">
          {filteredProxies.length} of {proxies.length} proxy servers
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search proxies by host, port, username, status, or accounts..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="connected">Connected</option>
              <option value="disconnected">Disconnected</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <ViewSwitcher
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>Add Proxy</span>
        </button>
        <button className="btn-secondary flex items-center space-x-2">
          <Upload size={16} />
          <span>Import List</span>
        </button>
        <button
          onClick={exportData}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
        <button
          onClick={clearFilters}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Clear Filters</span>
        </button>
      </div>

      {selectedRows.length > 0 && (
        <div className="p-4 bg-steam-lightblue/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
              {selectedRows.length} proxy{selectedRows.length > 1 ? 'ies' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkConnect}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                <Wifi size={14} />
                <span>Connect</span>
              </button>
              <button
                onClick={handleBulkTest}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                <RefreshCw size={14} />
                <span>Test</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'list' ? (
        <div className="grid gap-4">
          {filteredProxies.map((proxy) => {
            const getStatusIcon = (status: ProxyServer['status']) => {
              switch (status) {
                case 'connected': return <Wifi size={16} className="text-green-400" />
                case 'disconnected': return <WifiOff size={16} className="text-gray-400" />
                case 'error': return <WifiOff size={16} className="text-red-400" />
                default: return <WifiOff size={16} className="text-gray-400" />
              }
            }

            const getStatusBadge = (status: ProxyServer['status']) => {
              switch (status) {
                case 'connected': return 'bg-green-600'
                case 'disconnected': return 'bg-gray-600'
                case 'error': return 'bg-red-600'
                default: return 'bg-gray-600'
              }
            }

            return (
              <div
                key={proxy.id}
                className="p-4 rounded-lg border border-steam-lightblue bg-steam-lightblue/20 hover:border-steam-green/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(proxy.status)}
                    <div>
                      <div className="font-medium text-white">
                        {proxy.host}:{proxy.port}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(proxy.status)} text-white`}>
                          {proxy.status.charAt(0).toUpperCase() + proxy.status.slice(1)}
                        </span>
                        {proxy.username && (
                          <span className="text-gray-400">• Auth: {proxy.username}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-green-400 transition-colors">
                      <RefreshCw size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {proxy.accounts.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-400 mb-2">
                      Assigned Accounts ({proxy.accounts.length}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {proxy.accounts.map((account, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-steam-blue rounded text-xs text-gray-300"
                        >
                          {account}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Host:</span>
                    <span className="text-white ml-2 font-mono">{proxy.host}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Port:</span>
                    <span className="text-white ml-2 font-mono">{proxy.port}</span>
                  </div>
                  {proxy.username && (
                    <>
                      <div>
                        <span className="text-gray-400">Username:</span>
                        <span className="text-white ml-2">{proxy.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Password:</span>
                        <span className="text-white ml-2">{proxy.password}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-steam-lightblue/30">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors">
                      Connect
                    </button>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
                      Test
                    </button>
                    <button className="px-3 py-1 bg-steam-lightblue hover:bg-steam-lightblue/80 rounded text-sm font-medium transition-colors">
                      Assign Accounts
                    </button>
                  </div>

                  <div className="text-xs text-gray-400">
                    Last tested: 2 minutes ago
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="ag-theme-steam" style={{ height: '600px', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={filteredProxies}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onFilterChanged={onFilterChanged}
            onSortChanged={onSortChanged}
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
          />
        </div>
      )}

      {filteredProxies.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-400">
          <Wifi size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No proxies found</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      )}

      {proxies.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Wifi size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No proxy servers configured</p>
          <p className="text-sm">Add proxy servers to route your bot traffic</p>
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        <p><strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Click column headers to sort by that field</li>
          <li>Use the filter icons in column headers for advanced filtering</li>
          <li>Select multiple rows using Ctrl/Cmd + click</li>
          <li>Resize columns by dragging the column borders</li>
          <li>Export filtered data to CSV using the Export button</li>
        </ul>
        <p className="text-xs text-gray-500 mt-2">
          <strong>Note:</strong> Using AG Grid Community Edition. Some advanced features like range selection and column pinning require AG Grid Enterprise.
        </p>
      </div>
    </div>
  )
}

export default ProxyPage
