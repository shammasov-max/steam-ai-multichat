import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { IFilterComp, IFilterParams } from 'ag-grid-community'

interface StatusFilterProps extends IFilterParams {
  // Add any custom props here
}

export interface StatusFilterRef {
  doesFilterPass: (params: any) => boolean
  isFilterActive: () => boolean
  getModel: () => any
  setModel: (model: any) => void
}

const StatusFilter = forwardRef<StatusFilterRef, StatusFilterProps>((props, ref) => {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const statuses = [
    { value: 'connected', label: 'Connected', color: 'text-green-400' },
    { value: 'disconnected', label: 'Disconnected', color: 'text-gray-400' },
    { value: 'error', label: 'Error', color: 'text-red-400' }
  ]

  useImperativeHandle(ref, () => ({
    doesFilterPass: (params: any) => {
      if (selectedStatuses.length === 0) return true
      return selectedStatuses.includes(params.data.status)
    },
    isFilterActive: () => selectedStatuses.length > 0,
    getModel: () => selectedStatuses.length > 0 ? { statuses: selectedStatuses } : null,
    setModel: (model: any) => {
      setSelectedStatuses(model ? model.statuses || [] : [])
    }
  }))

  const toggleStatus = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    
    setSelectedStatuses(newStatuses)
    props.filterChangedCallback()
  }

  const clearFilter = () => {
    setSelectedStatuses([])
    props.filterChangedCallback()
  }

  return (
    <div className="p-3 bg-steam-blue border border-steam-lightblue rounded">
      <div className="mb-3">
        <label className="block text-sm font-medium text-white mb-2">
          Filter by Status
        </label>
        <div className="space-y-2">
          {statuses.map(status => (
            <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status.value)}
                onChange={() => toggleStatus(status.value)}
                className="w-4 h-4 text-steam-green bg-steam-blue border-steam-lightblue rounded focus:ring-steam-green"
              />
              <span className={`text-sm ${status.color}`}>
                {status.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={clearFilter}
          className="px-3 py-1 bg-steam-lightblue hover:bg-steam-lightblue/80 rounded text-sm text-white"
        >
          Clear
        </button>
      </div>
    </div>
  )
})

StatusFilter.displayName = 'StatusFilter'

export default StatusFilter
