import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Columns3 } from "lucide-react";
import { Todo } from "../Todo.js";
import { EditTodoForm } from "../EditTodoForm.js";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

// Minimal accessible modal shell (Escape / backdrop click to close, focus on open).
export const Modal = ({ title, onClose, children, size = "md", labelledBy }) => {
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        panelRef.current?.focus();
        const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            previouslyFocused?.focus?.();
        };
    }, []);

    return createPortal(
        <div className="board-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div
                ref={panelRef}
                className={`board-modal board-modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
            >
                <div className="board-modal-header">
                    <h2 id={labelledBy} className="board-modal-title">{title}</h2>
                    <button type="button" className="board-icon-btn" onClick={onClose} aria-label="Close dialog" id="board-modal-close">
                        <X size={16} />
                    </button>
                </div>
                <div className="board-modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export const TaskDetailModal = ({ task, columns, currentColumnId, isOwner, categories, handlers, onMove, onClose }) => {
    const activeColumnId = currentColumnId || columns[0]?.id;
    const selectedCol = columns.find(c => c.id === activeColumnId) || columns[0];

    return (
        <Modal title="Task details" onClose={onClose} size="lg" labelledBy="task-detail-title">
            {isOwner && columns.length > 0 && (
                <div className="board-modal-field">
                    <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <Columns3 size={13} className="text-slate-400" />
                            Board Stage & Column
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Select column to move task
                        </span>
                    </div>

                    <Select
                        value={activeColumnId || ""}
                        onValueChange={(val) => onMove(task.id, val)}
                    >
                        <SelectTrigger id="task-detail-column-select" className="w-full">
                            <SelectValue placeholder="Select column">
                                {selectedCol && (
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: selectedCol.color || '#94a3b8',
                                                boxShadow: `0 0 0 2px #fff, 0 0 6px ${selectedCol.color || '#94a3b8'}60`
                                            }}
                                        />
                                        <span className="font-semibold text-slate-900">{selectedCol.name}</span>
                                        {selectedCol.isDone && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Completed Stage
                                            </span>
                                        )}
                                    </div>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {columns.map(col => (
                                <SelectItem key={col.id} value={col.id}>
                                    <div className="flex items-center justify-between w-full gap-3 py-0.5">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: col.color || '#94a3b8',
                                                    boxShadow: `0 0 0 2px #fff, 0 0 5px ${col.color || '#94a3b8'}50`
                                                }}
                                            />
                                            <span className="text-slate-800 font-medium">{col.name}</span>
                                        </div>
                                        {col.isDone && (
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                                Completed Stage
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {!isOwner && (
                <p className="board-modal-note">Shared by {task.ownerEmail}. It lives in the owner's board.</p>
            )}

            <div className="board-modal-task">
                {task.isEditing ? (
                    <EditTodoForm categories={categories} editTodo={handlers.editTask} task={task} />
                ) : (
                    <Todo
                        task={task}
                        defaultShowSubTasks
                        toggleComplete={handlers.toggleComplete}
                        deleteTodo={handlers.deleteTodo}
                        editTodo={handlers.editTodo}
                        toggleSubTask={handlers.toggleSubTask}
                        deleteSubTask={handlers.deleteSubTask}
                        editSubTask={handlers.editSubTask}
                        shareTodo={handlers.shareTodo}
                        unshareTodo={handlers.unshareTodo}
                        addSubTask={handlers.addSubTask}
                    />
                )}
            </div>
        </Modal>
    );
};

export const DeleteColumnDialog = ({ column, taskCount, otherColumns, onConfirm, onClose }) => {
    const [targetId, setTargetId] = useState(otherColumns[0]?.id || "");
    const [busy, setBusy] = useState(false);
    const selectedTarget = otherColumns.find(c => c.id === targetId) || otherColumns[0];

    const confirm = async () => {
        setBusy(true);
        const ok = await onConfirm(column.id, taskCount > 0 ? targetId : null);
        setBusy(false);
        if (ok) onClose();
    };

    return (
        <Modal title={`Delete "${column.name}"?`} onClose={onClose} size="sm" labelledBy="delete-column-title">
            {taskCount > 0 ? (
                <>
                    <p className="board-modal-text">
                        This column has <strong>{taskCount}</strong> task{taskCount !== 1 ? "s" : ""}. Move {taskCount !== 1 ? "them" : "it"} to:
                    </p>
                    <Select
                        value={targetId}
                        onValueChange={(val) => setTargetId(val)}
                    >
                        <SelectTrigger id="delete-column-target-select" className="w-full">
                            <SelectValue placeholder="Select target column">
                                {selectedTarget && (
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: selectedTarget.color || '#94a3b8' }}
                                        />
                                        <span className="font-semibold text-slate-900">{selectedTarget.name}</span>
                                    </div>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {otherColumns.map(col => (
                                <SelectItem key={col.id} value={col.id}>
                                    <div className="flex items-center gap-2.5 py-0.5">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: col.color || '#94a3b8' }}
                                        />
                                        <span className="text-slate-800 font-medium">{col.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
            ) : (
                <p className="board-modal-text">This column is empty. This can't be undone.</p>
            )}
            <div className="board-modal-actions">
                <button type="button" className="board-btn board-btn--ghost" onClick={onClose} id="delete-column-cancel">Cancel</button>
                <button
                    type="button"
                    className="board-btn board-btn--danger"
                    onClick={confirm}
                    disabled={busy || (taskCount > 0 && !targetId)}
                    id="delete-column-confirm"
                >
                    {busy ? "Deleting..." : "Delete column"}
                </button>
            </div>
        </Modal>
    );
};
