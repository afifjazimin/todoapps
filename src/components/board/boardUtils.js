// Shared helpers for the board view.

export const SHARED_COLUMN_ID = "__shared__";
export const CARD_PREFIX = "card:";
export const COLUMN_PREFIX = "col:";

export const COLUMN_COLORS = [
    "#94a3b8", // slate
    "#0066ff", // brand blue
    "#8b5cf6", // violet
    "#f97316", // orange
    "#10b981", // emerald
    "#ef4444", // red
    "#eab308", // amber
    "#14b8a6", // teal
    "#ec4899", // pink
];

const POSITION_GAP = 1024;

export const toCardId = (todoId) => `${CARD_PREFIX}${todoId}`;
export const fromCardId = (cardId) => String(cardId).slice(CARD_PREFIX.length);
export const toColumnDndId = (columnId) => `${COLUMN_PREFIX}${columnId}`;
export const fromColumnDndId = (dndId) => String(dndId).slice(COLUMN_PREFIX.length);
export const isColumnDndId = (id) => String(id).startsWith(COLUMN_PREFIX);

// Ascending sort key. Todos without a stored position (pre-migration or shared)
// fall back to "newest first" via negative created_at epoch seconds.
export const todoSortKey = (todo) => {
    if (typeof todo.position === "number") return todo.position;
    const created = todo.createdAt ? new Date(todo.createdAt).getTime() / 1000 : 0;
    return -created;
};

export const sortTodos = (list) => [...list].sort((a, b) => todoSortKey(a) - todoSortKey(b));

// Position for an item placed between two neighbours (either may be missing).
export const positionBetween = (before, after) => {
    if (before != null && after != null) return (before + after) / 2;
    if (before != null) return before + POSITION_GAP;
    if (after != null) return after - POSITION_GAP;
    return 0;
};

export const positionAtTop = (todosInColumn) => {
    if (!todosInColumn.length) return 0;
    return Math.min(...todosInColumn.map(todoSortKey)) - POSITION_GAP;
};

export const positionAtEnd = (items, getKey = (x) => x.position) => {
    if (!items.length) return POSITION_GAP;
    return Math.max(...items.map(getKey)) + POSITION_GAP;
};

// Resolve which column a todo belongs to. Unknown / missing column → first column.
export const resolveColumnId = (todo, columns) => {
    if (!columns.length) return null;
    if (todo.columnId && columns.some(c => c.id === todo.columnId)) return todo.columnId;
    return columns[0].id;
};

export const firstOpenColumn = (columns) => columns.find(c => !c.isDone) || columns[0] || null;
export const firstDoneColumn = (columns) => columns.find(c => c.isDone) || null;

// Completion rule when a task moves between columns.
export const completionAfterMove = (todo, fromColumn, toColumn) => {
    if (toColumn?.isDone) return true;
    if (fromColumn?.isDone) return false;
    return todo.completed;
};

export const mapSupabaseColumn = (col) => ({
    id: col.id,
    name: col.name,
    color: col.color || COLUMN_COLORS[0],
    position: col.position,
    isDone: !!col.is_done,
});
