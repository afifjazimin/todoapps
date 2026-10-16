import React, { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Ellipsis, Pencil, CircleCheck, Trash2, Check } from "lucide-react";
import { COLUMN_COLORS } from "./boardUtils";

export const ColumnMenu = ({ column, canDelete, onRename, onUpdate, onDelete }) => {
    const [open, setOpen] = useState(false);

    const run = (fn) => () => {
        setOpen(false);
        fn();
    };

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <button
                    type="button"
                    id={`column-menu-${column.id}`}
                    className="board-icon-btn"
                    aria-label={`Column options for ${column.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Ellipsis size={16} />
                </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content className="board-menu" align="end" sideOffset={6}>
                    <button type="button" className="board-menu-item" onClick={run(onRename)}>
                        <Pencil size={14} />
                        <span>Rename</span>
                    </button>

                    <button
                        type="button"
                        className={`board-menu-item${column.isDone ? " board-menu-item--active" : ""}`}
                        onClick={run(() => onUpdate({ isDone: !column.isDone }))}
                    >
                        <CircleCheck size={14} />
                        <span>{column.isDone ? "Unmark as Done column" : "Mark as Done column"}</span>
                    </button>

                    <div className="board-menu-divider" />
                    <span className="board-menu-label">Color</span>
                    <div className="board-menu-colors">
                        {COLUMN_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                className="board-color-swatch"
                                style={{ background: color }}
                                aria-label={`Set color ${color}`}
                                aria-pressed={column.color === color}
                                onClick={() => onUpdate({ color })}
                            >
                                {column.color === color && <Check size={12} />}
                            </button>
                        ))}
                    </div>

                    <div className="board-menu-divider" />
                    <button
                        type="button"
                        className="board-menu-item board-menu-item--danger"
                        onClick={run(onDelete)}
                        disabled={!canDelete}
                        title={canDelete ? undefined : "A board needs at least one column"}
                    >
                        <Trash2 size={14} />
                        <span>Delete column</span>
                    </button>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
};
