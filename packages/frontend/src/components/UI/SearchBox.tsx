import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  const handleClear = () => {
    onChange('')
  }

  return (
    <div className={cn("relative", className)}>
      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10"
      />
      {value && (
        <Button
          onClick={handleClear}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  )
}

export default SearchBox
