import React from "react";

// ── Inline SVG icons ──────────────────────────────────────────────
const IconCircle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
    </svg>
);

const IconCheckCircle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="9 12 11.5 14.5 15.5 10" />
    </svg>
);

const IconEdit = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const IconTrash = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

// ── Category config ────────────────────────────────────────────────
const CAT_CONFIG = {
    work:     { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  label: "Work" },
    personal: { color: "#f97316", bg: "rgba(249,115,22,0.1)",  label: "Personal" },
    shopping: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  label: "Shopping" },
    fitness:  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Fitness" },
};

const extractCategory = (title = "") => {
    const match = title.match(/#(work|personal|shopping|fitness)/i);
    if (match) {
        return {
            cleanTitle: title.replace(match[0], "").trim(),
            category: match[1].toLowerCase(),
        };
    }
    return { cleanTitle: title, category: null };
};

// ── Component ──────────────────────────────────────────────────────
export const Todo = ({ task, toggleComplete, deleteTodo, editTodo }) => {
    const { cleanTitle, category } = extractCategory(task.task);
    const cat = category ? CAT_CONFIG[category] : null;

    const createdTime = task.createdAt
        ? new Date(task.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : null;

    return (
        <div className={`todo-card${task.completed ? " todo-card--done" : ""}`}>
            {/* Left: checkbox toggle */}
            <button
                className={`todo-check-btn${task.completed ? " todo-check-btn--done" : ""}`}
                onClick={() => toggleComplete(task.id)}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                style={task.completed ? { color: "#10b981" } : {}}
            >
                {task.completed ? <IconCheckCircle /> : <IconCircle />}
            </button>

            {/* Middle: content */}
            <div className="todo-body">
                <span className={`todo-title${task.completed ? " todo-title--done" : ""}`}>
                    {cleanTitle}
                </span>
                <div className="todo-meta-row">
                    {createdTime && (
                        <span className="todo-time">{createdTime}</span>
                    )}
                    {cat && (
                        <span
                            className="todo-cat-chip"
                            style={{ color: cat.color, backgroundColor: cat.bg }}
                        >
                            {cat.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: actions */}
            <div className="todo-action-group">
                <button
                    className="todo-icon-btn todo-icon-btn--edit"
                    onClick={() => editTodo(task.id)}
                    aria-label="Edit task"
                >
                    <IconEdit />
                </button>
                <button
                    className="todo-icon-btn todo-icon-btn--delete"
                    onClick={() => deleteTodo(task.id)}
                    aria-label="Delete task"
                >
                    <IconTrash />
                </button>
            </div>
        </div>
    );
};
