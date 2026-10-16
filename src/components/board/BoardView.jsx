import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    closestCenter,
    getFirstCollision,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { BoardColumn, SharedColumn } from "./BoardColumn";
import { BoardCard } from "./BoardCard";
import { TaskDetailModal, DeleteColumnDialog } from "./BoardModals";
import {
    fromCardId,
    fromColumnDndId,
    isColumnDndId,
    positionBetween,
    resolveColumnId,
    sortTodos,
    toCardId,
    toColumnDndId,
    todoSortKey,
} from "./boardUtils";
import "../../styles/Board.css";

const AddColumn = ({ onAdd }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setOpen(false); return; }
        setBusy(true);
        const ok = await onAdd(trimmed);
        setBusy(false);
        if (ok) { setName(""); setOpen(false); }
    };

    if (!open) {
        return (
            <button type="button" className="board-add-column" onClick={() => setOpen(true)} id="board-add-column-btn">
                <Plus size={16} />
                <span>Add column</span>
            </button>
        );
    }

    return (
        <div className="board-add-column board-add-column--open">
            <input
                autoFocus
                id="board-add-column-input"
                className="board-inline-input"
                placeholder="Column name"
                aria-label="New column name"
                value={name}
                disabled={busy}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); submit(); }
                    if (e.key === "Escape") { setName(""); setOpen(false); }
                }}
            />
            <div className="board-add-column-actions">
                <button type="button" className="board-btn board-btn--primary" onClick={submit} disabled={busy || !name.trim()} id="board-add-column-save">
                    {busy ? "Adding..." : "Add"}
                </button>
                <button type="button" className="board-btn board-btn--ghost" onClick={() => { setName(""); setOpen(false); }} id="board-add-column-cancel">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export const BoardView = ({
    columns,
    todos,
    allTodos,
    userId,
    categories,
    taskHandlers,
    onToggleComplete,
    onMoveTodo,
    onAddTask,
    onAddColumn,
    onRenameColumn,
    onUpdateColumn,
    onDeleteColumn,
    onReorderColumn,
}) => {
    const [activeId, setActiveId] = useState(null);
    const [dragItems, setDragItems] = useState(null);
    const [openTaskId, setOpenTaskId] = useState(null);
    const [deletingColumnId, setDeletingColumnId] = useState(null);

    const owns = useCallback((t) => t.userId === userId, [userId]);

    const todoById = useMemo(() => Object.fromEntries(todos.map(t => [t.id, t])), [todos]);

    const sharedTodos = useMemo(
        () => todos
            .filter(t => !owns(t))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
        [todos, owns]
    );

    // columnId -> ordered card ids, derived from server state
    const derivedItems = useMemo(() => {
        const map = Object.fromEntries(columns.map(c => [c.id, []]));
        sortTodos(todos.filter(owns)).forEach(t => {
            const cid = resolveColumnId(t, columns);
            if (cid) map[cid].push(toCardId(t.id));
        });
        return map;
    }, [todos, columns, owns]);

    const items = dragItems || derivedItems;
    const itemsRef = useRef(items);
    itemsRef.current = items;

    const columnDndIds = useMemo(() => columns.map(c => toColumnDndId(c.id)), [columns]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
        })
    );

    const findContainer = (id, source = items) => {
        if (id == null) return null;
        if (isColumnDndId(id)) {
            const colId = fromColumnDndId(id);
            return source[colId] ? colId : null;
        }
        return Object.keys(source).find(key => source[key].includes(id)) || null;
    };

    // Columns only collide with columns; cards prefer the card under the pointer,
    // falling back to the closest card inside the hovered column.
    const collisionDetection = useCallback((args) => {
        const activeType = args.active.data.current?.type;
        if (activeType === "column") {
            return closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(c => c.data.current?.type === "column"),
            });
        }

        const pointerHits = pointerWithin(args);
        const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
        const overId = getFirstCollision(hits, "id");
        if (overId == null) return [];

        if (isColumnDndId(overId)) {
            const colId = fromColumnDndId(overId);
            const cardIds = (itemsRef.current[colId] || []).filter(id => id !== args.active.id);
            if (cardIds.length > 0) {
                const inner = closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter(c => cardIds.includes(c.id)),
                });
                if (inner.length > 0) return inner;
            }
        }
        return [{ id: overId }];
    }, []);

    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
        if (active.data.current?.type === "card") setDragItems(derivedItems);
    };

    const handleDragOver = ({ active, over }) => {
        if (active.data.current?.type !== "card" || !over) return;
        const from = findContainer(active.id);
        const to = findContainer(over.id);
        if (!from || !to || from === to) return;

        setDragItems(prev => {
            const source = prev || derivedItems;
            const fromItems = source[from].filter(id => id !== active.id);
            const toItems = [...source[to]];
            let index = toItems.length;
            if (!isColumnDndId(over.id)) {
                const overIndex = toItems.indexOf(over.id);
                const activeRect = active.rect.current.translated;
                const isBelow = activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
                index = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toItems.length;
            }
            toItems.splice(index, 0, active.id);
            return { ...source, [from]: fromItems, [to]: toItems };
        });
    };

    const resetDrag = () => {
        setActiveId(null);
        setDragItems(null);
    };

    const handleDragEnd = ({ active, over }) => {
        const type = active.data.current?.type;

        if (type === "column") {
            resetDrag();
            if (!over) return;
            const fromId = fromColumnDndId(active.id);
            const toId = isColumnDndId(over.id) ? fromColumnDndId(over.id) : findContainer(over.id, derivedItems);
            const oldIndex = columns.findIndex(c => c.id === fromId);
            const newIndex = columns.findIndex(c => c.id === toId);
            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
            const reordered = arrayMove(columns, oldIndex, newIndex);
            const position = positionBetween(reordered[newIndex - 1]?.position, reordered[newIndex + 1]?.position);
            onReorderColumn(fromId, position);
            return;
        }

        if (type !== "card") { resetDrag(); return; }

        const container = findContainer(active.id);
        if (!container) { resetDrag(); return; }

        let list = items[container];
        if (over && !isColumnDndId(over.id) && findContainer(over.id) === container) {
            const oldIndex = list.indexOf(active.id);
            const newIndex = list.indexOf(over.id);
            if (oldIndex !== newIndex) list = arrayMove(list, oldIndex, newIndex);
        }

        const todoId = fromCardId(active.id);
        const todo = todoById[todoId];
        const originalContainer = findContainer(active.id, derivedItems);
        const originalIndex = derivedItems[originalContainer]?.indexOf(active.id);
        const index = list.indexOf(active.id);

        if (!todo || (container === originalContainer && index === originalIndex)) {
            resetDrag();
            return;
        }

        const keyOf = (cardId) => {
            const t = todoById[fromCardId(cardId)];
            return t ? todoSortKey(t) : undefined;
        };
        const position = positionBetween(keyOf(list[index - 1]), keyOf(list[index + 1]));

        // Optimistic update in the parent happens synchronously, so clearing the
        // local drag state right after doesn't flash the old order.
        onMoveTodo(todoId, container, position);
        resetDrag();
    };

    const activeType = activeId ? (isColumnDndId(activeId) ? "column" : "card") : null;
    const activeTask = activeType === "card" ? todoById[fromCardId(activeId)] : null;

    const openTask = openTaskId ? (allTodos.find(t => t.id === openTaskId) || null) : null;
    const deletingColumn = deletingColumnId ? columns.find(c => c.id === deletingColumnId) : null;

    const moveFromModal = (todoId, columnId) => {
        const target = (derivedItems[columnId] || []).map(id => todoById[fromCardId(id)]).filter(Boolean);
        const top = target.length ? Math.min(...target.map(todoSortKey)) - 1024 : 0;
        onMoveTodo(todoId, columnId, top);
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={resetDrag}
            >
                <div className="board-scroller" id="board-scroller">
                    <div className="board-track">
                        <SortableContext items={columnDndIds} strategy={horizontalListSortingStrategy}>
                            {columns.map(column => {
                                const cardIds = items[column.id] || [];
                                return (
                                    <BoardColumn
                                        key={column.id}
                                        column={column}
                                        cardIds={cardIds}
                                        tasks={cardIds.map(id => todoById[fromCardId(id)]).filter(Boolean)}
                                        canDelete={columns.length > 1}
                                        onOpenTask={setOpenTaskId}
                                        onToggleComplete={onToggleComplete}
                                        onAddTask={onAddTask}
                                        onRenameColumn={onRenameColumn}
                                        onUpdateColumn={onUpdateColumn}
                                        onRequestDelete={setDeletingColumnId}
                                    />
                                );
                            })}
                        </SortableContext>

                        {sharedTodos.length > 0 && (
                            <SharedColumn tasks={sharedTodos} onOpenTask={setOpenTaskId} onToggleComplete={onToggleComplete} />
                        )}

                        <AddColumn onAdd={onAddColumn} />
                    </div>
                </div>

                <DragOverlay>
                    {activeTask ? <BoardCard task={activeTask} isOverlay /> : null}
                </DragOverlay>
            </DndContext>

            {openTask && (
                <TaskDetailModal
                    task={openTask}
                    columns={columns}
                    currentColumnId={resolveColumnId(openTask, columns)}
                    isOwner={owns(openTask)}
                    categories={categories}
                    handlers={taskHandlers}
                    onMove={moveFromModal}
                    onClose={() => setOpenTaskId(null)}
                />
            )}

            {deletingColumn && (
                <DeleteColumnDialog
                    column={deletingColumn}
                    taskCount={(derivedItems[deletingColumn.id] || []).length + allTodos.filter(t => owns(t) && !todoById[t.id] && resolveColumnId(t, columns) === deletingColumn.id).length}
                    otherColumns={columns.filter(c => c.id !== deletingColumn.id)}
                    onConfirm={onDeleteColumn}
                    onClose={() => setDeletingColumnId(null)}
                />
            )}
        </>
    );
};
