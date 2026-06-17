import * as React from "react"
import { Tag, Check, ChevronDown, Plus, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "src/lib/utils"

const defaultCategories = ["personal", "work", "shopping", "fitness"]

export function CategorySelector({ value, onChange, categories = [] }) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  
  // Ensure default categories are always in the suggested list, followed by other custom categories
  const allCategories = React.useMemo(() => {
    const unique = new Set([
      ...defaultCategories,
      ...categories.map(c => c.toLowerCase())
    ])
    // Remove "styling" category name
    unique.delete("styling")
    return Array.from(unique)
  }, [categories])

  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return allCategories
    return allCategories.filter(cat => 
      cat.toLowerCase().includes(search.toLowerCase())
    )
  }, [allCategories, search])

  const colorMap = {
    personal: {
      dot: "#f97316",
    },
    work: {
      dot: "#3b82f6",
    },
    shopping: {
      dot: "#8b5cf6",
    },
    fitness: {
      dot: "#10b981",
    }
  }

  const getCategoryColor = (cat) => {
    const lowercase = cat.toLowerCase()
    return colorMap[lowercase] || {
      dot: "#64748b",
    }
  }

  const activeColor = getCategoryColor(value)

  const handleSelect = (cat) => {
    onChange(cat.toLowerCase())
    setOpen(false)
    setSearch("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = search.trim().toLowerCase()
      if (trimmed) {
        handleSelect(trimmed)
      }
    }
  }

  const hasExactMatch = filteredCategories.some(
    cat => cat.toLowerCase() === search.trim().toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="db-form-date-group hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-left font-normal"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "var(--font-body)",
          }}
        >
          <Tag size={14} style={{ color: activeColor.dot }} className="shrink-0" />
          <span className="text-slate-700 text-sm capitalize font-normal">
            {value || "personal"}
          </span>
          <ChevronDown size={12} className="text-slate-400 shrink-0" style={{ marginLeft: "2px" }} />
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50" align="start" style={{ fontFamily: "var(--font-body)" }}>
        {/* Search input container */}
        <div className="flex items-center gap-2 px-2 py-1 mb-1 border border-gray-100 rounded bg-gray-50/50">
          <Search size={12} className="text-gray-400 shrink-0" />
          <input
            type="text"
            className="w-full text-xs bg-transparent border-0 outline-none p-0 text-gray-700 placeholder-gray-400"
            placeholder="Search or add category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{ border: "none", outline: "none", boxShadow: "none" }}
          />
        </div>

        {/* Scrollable list */}
        <div className="max-h-[160px] overflow-y-auto space-y-0.5 pr-1">
          {filteredCategories.map((cat) => {
            const catColor = getCategoryColor(cat)
            const isSelected = cat.toLowerCase() === value.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left text-gray-600 hover:bg-gray-50 transition-colors hover:text-gray-950",
                  isSelected && "bg-gray-50/80 text-gray-950 font-semibold"
                )}
                onClick={() => handleSelect(cat)}
                style={{ cursor: "pointer" }}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: catColor.dot }}
                  />
                  <span className="capitalize">{cat}</span>
                </div>
                {isSelected && <Check size={12} className="text-gray-500" />}
              </button>
            )
          })}

          {/* Create new option */}
          {search.trim() && !hasExactMatch && (
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left hover:bg-slate-50 transition-colors border border-dashed border-slate-200 mt-1"
              style={{ color: "#0066ff", cursor: "pointer" }}
              onClick={() => handleSelect(search.trim())}
            >
              <Plus size={12} />
              <span className="truncate">Create "{search.trim()}"</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
