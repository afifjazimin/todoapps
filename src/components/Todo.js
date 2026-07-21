import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, X, Check, Pencil, Share2, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

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
export const Todo = ({ task, toggleComplete, deleteTodo, editTodo, toggleSubTask, deleteSubTask, editSubTask, shareTodo, unshareTodo, addSubTask }) => {
    const { user } = useAuth();
    const [showSubTasks, setShowSubTasks] = useState(false);
    const [editingSubTaskId, setEditingSubTaskId] = useState(null);
    const [editingSubTaskTitle, setEditingSubTaskTitle] = useState("");
    const [showShareSection, setShowShareSection] = useState(false);
    const [shareEmailInput, setShareEmailInput] = useState("");
    const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
    const [sharing, setSharing] = useState(false);

    const cleanTitle = cleanLegacyTitle(task.task);
    const category = task.category || "personal";
    const cat = CAT_CONFIG[category] || { color: "#64748b", bg: "rgba(148, 163, 184, 0.12)", label: category };
    const dueStatus = getDueDateStatus(task.dueDate);
    const formattedDue = formatDueDate(task.dueDate);

    const subTasks = task.subTasks || [];
    const completedSubTasks = subTasks.filter(st => st.completed).length;

    const createdTime = task.createdAt
        ? new Date(task.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : null;

    const isOwner = user && (task.userId === user.id || task.ownerEmail === user.email);

    const handleEditSubTaskClick = (subTask) => {
        setEditingSubTaskId(subTask.id);
        setEditingSubTaskTitle(subTask.title);
    };

    const handleSubTaskSave = async (subTaskId) => {
        const trimmed = editingSubTaskTitle.trim();
        if (!trimmed) return;

        const success = await editSubTask(task.id, subTaskId, trimmed);
        if (success) {
            setEditingSubTaskId(null);
            setEditingSubTaskTitle("");
        }
    };

    const handleSubTaskCancel = () => {
        setEditingSubTaskId(null);
        setEditingSubTaskTitle("");
    };

    const handleSubTaskEditKeyDown = (e, subTaskId) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubTaskSave(subTaskId);
        } else if (e.key === "Escape") {
            handleSubTaskCancel();
        }
    };

    const handleShareSubmit = async (e) => {
        e.preventDefault();
        const email = shareEmailInput.trim().toLowerCase();
        if (!email) return;

        if (!/\S+@\S+\.\S+/.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        setSharing(true);
        const success = await shareTodo(task.id, email);
        setSharing(false);
        if (success) {
            setShareEmailInput("");
        }
    };

    const handleUnshare = async (shareId) => {
        await unshareTodo(task.id, shareId);
    };

    const handleNewSubTaskSave = async () => {
        const trimmed = newSubTaskTitle.trim();
        if (!trimmed) return;

        const success = await addSubTask(task.id, trimmed);
        if (success) {
            setNewSubTaskTitle("");
        }
    };

    const handleNewSubTaskKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleNewSubTaskSave();
        }
    };

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
                        {!isOwner && task.ownerEmail && (
                            <span className="todo-shared-badge" title={`Shared by ${task.ownerEmail}`}>
                                Shared by {task.ownerEmail}
                            </span>
                        )}
                        <button
                            className="todo-subtask-toggle"
                            onClick={() => setShowSubTasks(!showSubTasks)}
                            aria-label={showSubTasks ? "Hide sub-tasks" : "Show sub-tasks"}
                        >
                            {subTasks.length > 0 ? (
                                <span className="todo-subtask-progress">
                                    {completedSubTasks}/{subTasks.length}
                                </span>
                            ) : (
                                <span className="todo-subtask-add-text">+ Add Sub-task</span>
                            )}
                            {showSubTasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="todo-action-group">
                    {isOwner && (
                        <button
                            className={`todo-icon-btn todo-icon-btn--share ${showShareSection ? "active" : ""}`}
                            onClick={() => setShowShareSection(!showShareSection)}
                            aria-label="Share task"
                        >
                            <Share2 size={14} />
                        </button>
                    )}
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

            {/* Share management section */}
            {isOwner && showShareSection && (
                <div className="todo-share-section">
                    <span className="todo-share-title">Share Task</span>
                    <form onSubmit={handleShareSubmit} className="todo-share-form">
                        <input
                            type="email"
                            className="todo-share-input"
                            placeholder="Enter user email..."
                            value={shareEmailInput}
                            onChange={(e) => setShareEmailInput(e.target.value)}
                            required
                        />
                        <button type="submit" className="todo-share-btn" disabled={sharing}>
                            {sharing ? "Adding..." : "Add"}
                        </button>
                    </form>

                    {task.shares && task.shares.length > 0 && (
                        <div className="todo-shares-list">
                            <span className="todo-shares-subtitle">Access list:</span>
                            <div className="todo-shares-chips">
                                {task.shares.map((s) => (
                                    <div key={s.id} className="todo-share-item">
                                        <span className="todo-share-email">{s.email}</span>
                                        <button
                                            type="button"
                                            className="todo-share-remove"
                                            onClick={() => handleUnshare(s.id)}
                                            aria-label="Revoke access"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sub-tasks expandable section */}
            {showSubTasks && (
                <div className="todo-subtask-section">
                    {subTasks.map((st) => {
                        const isEditingThis = editingSubTaskId === st.id;
                        return (
                            <div
                                key={st.id}
                                className={`todo-subtask-row ${st.completed ? "todo-subtask-row--done" : ""} ${isEditingThis ? "todo-subtask-row--editing" : ""}`}
                            >
                                {isEditingThis ? (
                                    <>
                                        <input
                                            type="text"
                                            className="todo-subtask-edit-input"
                                            value={editingSubTaskTitle}
                                            onChange={(e) => setEditingSubTaskTitle(e.target.value)}
                                            onKeyDown={(e) => handleSubTaskEditKeyDown(e, st.id)}
                                            autoFocus
                                        />
                                        <div className="todo-subtask-edit-actions">
                                            <button
                                                className="todo-subtask-action-btn todo-subtask-action-btn--save"
                                                onClick={() => handleSubTaskSave(st.id)}
                                                aria-label="Save sub-task"
                                                disabled={!editingSubTaskTitle.trim()}
                                            >
                                                <Check size={12} />
                                            </button>
                                            <button
                                                className="todo-subtask-action-btn todo-subtask-action-btn--cancel"
                                                onClick={handleSubTaskCancel}
                                                aria-label="Cancel editing"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
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
                                        <div className="todo-subtask-action-group">
                                            <button
                                                className="todo-subtask-edit"
                                                onClick={() => handleEditSubTaskClick(st)}
                                                aria-label="Edit sub-task"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                className="todo-subtask-delete"
                                                onClick={() => deleteSubTask(task.id, st.id)}
                                                aria-label="Delete sub-task"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Add a new sub-task inline at the bottom */}
                    <div className="todo-subtask-row todo-subtask-add-row">
                        <input
                            type="text"
                            className="todo-subtask-add-input"
                            placeholder="Add a sub-task..."
                            value={newSubTaskTitle}
                            onChange={(e) => setNewSubTaskTitle(e.target.value)}
                            onKeyDown={handleNewSubTaskKeyDown}
                        />
                        <button
                            className="todo-subtask-add-btn"
                            onClick={handleNewSubTaskSave}
                            disabled={!newSubTaskTitle.trim()}
                            aria-label="Add sub-task"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
