import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, X } from "lucide-react";

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

const IconMiniCircle = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
    </svg>
);

const IconMiniCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
);


// ── Category config ────────────────────────────────────────────────
const CAT_CONFIG = {
    work:     { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  label: "Work" },
    personal: { color: "#f97316", bg: "rgba(249,115,22,0.1)",  label: "Personal" },
    shopping: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  label: "Shopping" },
    fitness:  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Fitness" },
};

// Clean legacy hashtag from displayed title
const cleanLegacyTitle = (title = "") => {
    return title.replace(/\s*#(work|personal|shopping|fitness)/i, "").trim();
};

// Due date status helper
const getDueDateStatus = (dueDateStr) => {
    if (!dueDateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr + "T00:00:00");

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "overdue", label: "Overdue", className: "todo-due-badge--overdue" };
    if (diffDays === 0) return { status: "today", label: "Today", className: "todo-due-badge--today" };
    if (diffDays === 1) return { status: "tomorrow", label: "Tomorrow", className: "todo-due-badge--upcoming" };
    return { status: "future", label: null, className: "todo-due-badge--future" };
};

const formatDueDate = (dueDateStr) => {
    if (!dueDateStr) return "";
    const date = new Date(dueDateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ── Component ──────────────────────────────────────────────────────
export const Todo = ({ task, toggleComplete, deleteTodo, editTodo, toggleSubTask, deleteSubTask }) => {
    const [showSubTasks, setShowSubTasks] = useState(false);

    const cleanTitle = cleanLegacyTitle(task.task);
    const category = task.category || "personal";
    const cat = CAT_CONFIG[category] || { color: "#64748b", bg: "rgba(148, 163, 184, 0.12)", label: category };
    const dueStatus = getDueDateStatus(task.dueDate);
    const formattedDue = formatDueDate(task.dueDate);

    const subTasks = task.subTasks || [];
    const completedSubTasks = subTasks.filter(st => st.completed).length;
    const hasSubTasks = subTasks.length > 0;

    const createdTime = task.createdAt
        ? new Date(task.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : null;

    return (
        <div className={`todo-card${task.completed ? " todo-card--done" : ""}`}>
            <div className="todo-card-main">
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
                        {category && (
                            <span
                                className="todo-cat-chip"
                                style={{
                                    color: cat.color,
                                    backgroundColor: cat.bg,
                                    textTransform: "capitalize",
                                    border: !CAT_CONFIG[category] ? "1px solid rgba(148, 163, 184, 0.2)" : undefined
                                }}
                            >
                                {cat.label}
                            </span>
                        )}
                        {task.dueDate && (
                            <span className={`todo-due-badge ${dueStatus?.className || ""}`}>
                                <Calendar size={11} />
                                <span>{dueStatus?.label || formattedDue}</span>
                                {dueStatus?.status === "future" && <span>{formattedDue}</span>}
                            </span>
                        )}
                        {hasSubTasks && (
                            <button
                                className="todo-subtask-toggle"
                                onClick={() => setShowSubTasks(!showSubTasks)}
                                aria-label={showSubTasks ? "Hide sub-tasks" : "Show sub-tasks"}
                            >
                                <span className="todo-subtask-progress">
                                    {completedSubTasks}/{subTasks.length}
                                </span>
                                {showSubTasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
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

            {/* Sub-tasks expandable section */}
            {hasSubTasks && showSubTasks && (
                <div className="todo-subtask-section">
                    {subTasks.map((st) => (
                        <div
                            key={st.id}
                            className={`todo-subtask-row ${st.completed ? "todo-subtask-row--done" : ""}`}
                        >
                            <button
                                className={`todo-subtask-check ${st.completed ? "todo-subtask-check--done" : ""}`}
                                onClick={() => toggleSubTask(task.id, st.id)}
                                aria-label={st.completed ? "Mark sub-task incomplete" : "Mark sub-task complete"}
                            >
                                {st.completed ? <IconMiniCheck /> : <IconMiniCircle />}
                            </button>
                            <span className={`todo-subtask-title ${st.completed ? "todo-subtask-title--done" : ""}`}>
                                {st.title}
                            </span>
                            <button
                                className="todo-subtask-delete"
                                onClick={() => deleteSubTask(task.id, st.id)}
                                aria-label="Delete sub-task"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
