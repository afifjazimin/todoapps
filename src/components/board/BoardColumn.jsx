import React, { useEffect, useRef, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, CircleCheck, Inbox, Share2 } from "lucide-react";
import { ColumnMenu } from "./ColumnMenu";
import { BoardCard, SortableBoardCard } from "./BoardCard";
import { toCardId, toColumnDndId } from "./boardUtils";

const InlineInput = ({ initialValue = "", placeholder, onSubmit, onCancel, id, ariaLabel, submitOnBlur = false }) => {
    const [value, setValue] = useState(initialValue);
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const submit = async () => {
        const trimmed = value.trim();
        if (busyRef.current) return;
        if (!trimmed) {
            onCancel();
            return;
        }
        busyRef.current = true;
        setBusy(true);
        const keepOpen = await onSubmit(trimmed);
        busyRef.current = false;
        setBusy(false);
        if (keepOpen === "keep") {
            setValue("");
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    };

    return (
        <input
            ref={inputRef}
            id={id}
            className="board-inline-input"
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") { e.preventDefault(); submit(); }
                if (e.key === "Escape") onCancel();
            }}
            onBlur={() => {
                if (busyRef.current) return;
                if (!value.trim()) onCancel();
                else if (submitOnBlur) submit();
            }}
        />
    );
};

export const BoardColumn = ({
    column,
    tasks,
    cardIds,
    canDelete,
    loading = false,
    onOpenTask,
    onToggleComplete,
    onAddTask,
    onRenameColumn,
    onUpdateColumn,
    onRequestDelete,
}) => {
    const [renaming, setRenaming] = useState(false);
    const [adding, setAdding] = useState(false);

    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: toColumnDndId(column.id),
        data: { type: "column", columnId: column.id },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        "--column-color": column.color,
    };

    const taskById = Object.fromEntries(tasks.map(t => [toCardId(t.id), t]));

    return (
        <section
            ref={setNodeRef}
            style={style}
            className={`board-column${isDragging ? " board-column--dragging" : ""}${column.isDone ? " board-column--done" : ""}`}
            aria-label={`${column.name} column`}
            id={`board-column-${column.id}`}
        >
            <header className="board-column-header">
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    className="board-column-grip"
                    aria-label={`Reorder ${column.name} column`}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={14} />
                </button>
                <span className="board-column-dot" aria-hidden="true" />

                {renaming ? (
                    <InlineInput
                        id={`column-rename-${column.id}`}
                        ariaLabel="Column name"
                        initialValue={column.name}
                        submitOnBlur
                        onSubmit={async (name) => {
                            if (name !== column.name) await onRenameColumn(column.id, name);
                            setRenaming(false);
                        }}
                        onCancel={() => setRenaming(false)}
                    />
                ) : (
                    <h2 className="board-column-title" onDoubleClick={() => setRenaming(true)} title="Double-click to rename">
                        {column.name}
                    </h2>
                )}

                {column.isDone && (
                    <span className="board-column-done-badge" title="Tasks here count as completed">
                        <CircleCheck size={12} />
                    </span>
                )}
                <span className="board-column-count">{tasks.length}</span>

                <ColumnMenu
                    column={column}
                    canDelete={canDelete}
                    onRename={() => setRenaming(true)}
                    onUpdate={(patch) => onUpdateColumn(column.id, patch)}
                    onDelete={() => onRequestDelete(column.id)}
                />
            </header>

            <div className="board-column-add">
                {adding ? (
                    <InlineInput
                        id={`column-add-task-${column.id}`}
                        ariaLabel={`New task in ${column.name}`}
                        placeholder="Task name, then Enter"
                        onSubmit={async (title) => {
                            const ok = await onAddTask(column.id, title);
                            return ok ? "keep" : undefined;
                        }}
                        onCancel={() => setAdding(false)}
                    />
                ) : (
                    <button
                        type="button"
                        id={`column-add-task-btn-${column.id}`}
                        className="board-add-task-btn"
                        onClick={() => setAdding(true)}
                    >
                        <Plus size={14} />
                        <span>Add task</span>
                    </button>
                )}
            </div>

            <div className="board-column-body">
                {loading ? (
                    <div className="board-column-loading">
                        <div className="board-card-skeleton" />
                        <div className="board-card-skeleton" style={{ opacity: 0.6 }} />
                    </div>
                ) : (
                    <>
                        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                            {cardIds.map(cardId => {
                                const task = taskById[cardId];
                                if (!task) return null;
                                return (
                                    <SortableBoardCard
                                        key={cardId}
                                        task={task}
                                        columnId={column.id}
                                        onOpen={onOpenTask}
                                        onToggleComplete={onToggleComplete}
                                    />
                                );
                            })}
                        </SortableContext>
                        {cardIds.length === 0 && (
                            <div className="board-column-empty">
                                <Inbox size={18} />
                                <span>Drop tasks here</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

// Read-only virtual column for tasks other people shared with the current user.
export const SharedColumn = ({ tasks, onOpenTask, onToggleComplete }) => (
    <section className="board-column board-column--shared" aria-label="Shared with me column" id="board-column-shared">
        <header className="board-column-header">
            <span className="board-column-shared-icon" aria-hidden="true">
                <Share2 size={13} />
            </span>
            <h2 className="board-column-title">Shared with me</h2>
            <span className="board-column-count">{tasks.length}</span>
        </header>
        <p className="board-column-hint">Tasks others shared with you. They stay in the owner's board.</p>
        <div className="board-column-body">
            {tasks.map(task => (
                <BoardCard
                    key={task.id}
                    task={task}
                    isShared
                    onOpen={onOpenTask}
                    onToggleComplete={onToggleComplete}
                />
            ))}
        </div>
    </section>
);
