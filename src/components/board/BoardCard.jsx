import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Users, ListChecks } from "lucide-react";
import { CAT_CONFIG, cleanLegacyTitle, getDueDateStatus, formatDueDate } from "../Todo.js";
import { toCardId } from "./boardUtils";

const CheckIcon = ({ done }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        {done && <polyline points="8.5 12 11 14.5 15.5 10" />}
    </svg>
);

// Pure presentational card — used in columns, the drag overlay and the shared column.
export const BoardCard = React.forwardRef(function BoardCard(
    { task, onOpen, onToggleComplete, isOverlay = false, isPlaceholder = false, isShared = false, style, ...rest },
    ref
) {
    const title = cleanLegacyTitle(task.task);
    const category = task.category || "personal";
    const cat = CAT_CONFIG[category] || { color: "#64748b", bg: "rgba(148, 163, 184, 0.12)", label: category };
    const dueStatus = getDueDateStatus(task.dueDate);
    const formattedDue = formatDueDate(task.dueDate);
    const subTasks = task.subTasks || [];
    const doneSubTasks = subTasks.filter(st => st.completed).length;
    const shareCount = (task.shares || []).length;

    const classes = [
        "board-card",
        task.completed && "board-card--done",
        isOverlay && "board-card--overlay",
        isPlaceholder && "board-card--placeholder",
        isShared && "board-card--shared",
    ].filter(Boolean).join(" ");

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) {
            e.preventDefault();
            onOpen?.(task.id);
            return;
        }
        rest.onKeyDown?.(e);
    };

    return (
        <article
            ref={ref}
            className={classes}
            style={style}
            {...rest}
            id={`board-card-${task.id}`}
            tabIndex={0}
            aria-label={`Task: ${title}`}
            onClick={() => onOpen?.(task.id)}
            onKeyDown={handleKeyDown}
        >
            <div className="board-card-top">
                <button
                    type="button"
                    className={`board-card-check${task.completed ? " board-card-check--done" : ""}`}
                    onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                    <CheckIcon done={task.completed} />
                </button>
                <h3 className="board-card-title">{title}</h3>
            </div>

            <div className="board-card-meta">
                <span
                    className="todo-cat-chip"
                    style={{ color: cat.color, backgroundColor: cat.bg, textTransform: "capitalize" }}
                >
                    {cat.label}
                </span>

                {task.dueDate && (
                    <span className={`todo-due-badge ${dueStatus?.className || ""}`}>
                        <Calendar size={11} />
                        <span>{dueStatus?.label || formattedDue}</span>
                        {dueStatus?.status === "future" && <span>{formattedDue}</span>}
                    </span>
                )}
            </div>

            {(subTasks.length > 0 || shareCount > 0 || isShared) && (
                <div className="board-card-footer">
                    {subTasks.length > 0 && (
                        <span className="board-card-subtasks" title={`${doneSubTasks} of ${subTasks.length} sub-tasks done`}>
                            <ListChecks size={12} />
                            <span>{doneSubTasks}/{subTasks.length}</span>
                            <span className="board-card-subtasks-bar">
                                <span style={{ width: `${(doneSubTasks / subTasks.length) * 100}%` }} />
                            </span>
                        </span>
                    )}
                    {isShared && task.ownerEmail ? (
                        <span className="board-card-owner" title={`Shared by ${task.ownerEmail}`}>
                            <span className="board-card-avatar">{task.ownerEmail.charAt(0).toUpperCase()}</span>
                            <span className="board-card-owner-email">{task.ownerEmail}</span>
                        </span>
                    ) : shareCount > 0 && (
                        <span className="board-card-shares" title={`Shared with ${shareCount} ${shareCount === 1 ? "person" : "people"}`}>
                            <Users size={12} />
                            <span>{shareCount}</span>
                        </span>
                    )}
                </div>
            )}
        </article>
    );
});

// Draggable / sortable wrapper used for the owner's own tasks.
export const SortableBoardCard = ({ task, columnId, onOpen, onToggleComplete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: toCardId(task.id),
        data: { type: "card", columnId },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <BoardCard
            ref={setNodeRef}
            task={task}
            style={style}
            isPlaceholder={isDragging}
            onOpen={onOpen}
            onToggleComplete={onToggleComplete}
            {...attributes}
            {...listeners}
        />
    );
};
