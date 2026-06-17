import * as React from "react"
import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export function DatePicker({ value, onChange }) {
  // Parse YYYY-MM-DD string to Date object
  const date = React.useMemo(() => {
    if (!value) return undefined;
    // parseISO parses YYYY-MM-DD local dates safely without timezone offsets
    return parseISO(value);
  }, [value]);

  const handleSelect = (selectedDate) => {
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <Popover>
      <div className="relative flex items-center gap-2">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="db-form-date-group hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-left font-normal"
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <CalendarIcon size={14} className="db-form-date-icon" />
            <span className="text-slate-700 text-sm">
              {date ? format(date, "PPP") : <span className="text-slate-400">Pick a date</span>}
            </span>
          </button>
        </PopoverTrigger>
        {value && (
          <button
            type="button"
            className="db-form-date-clear"
            onClick={handleClear}
            aria-label="Clear due date"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start" style={{ fontFamily: "var(--font-body)", border: "1px solid var(--color-border-strong)", borderRadius: "8px", overflow: "hidden" }}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          initialFocus
          disabled={{ before: today }}
        />
      </PopoverContent>
    </Popover>
  );
}
