import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrashCan, faCircleDot} from '@fortawesome/free-regular-svg-icons'

export const Todo = ({task, toggleComplete, deleteTodo, editTodo}) => {
    const createdTime = task.createdAt
        ? new Date(task.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : "";

    // Parse category tag from the task title
    const extractCategory = (title) => {
        const match = (title || "").match(/#(work|personal|shopping|fitness)/i);
        if (match) {
            return {
                cleanTitle: title.replace(match[0], "").trim(),
                category: match[1].toLowerCase()
            };
        }
        return {
            cleanTitle: title,
            category: null
        };
    };

    const { cleanTitle, category } = extractCategory(task.task);

    return (
        <div className='Todo db-todo-item'>
            <div className="todo-content">
                <div className="task-row">
                    <FontAwesomeIcon icon={faCircleDot} className="task-icon" />
                    <p onClick={() => toggleComplete(task.id)} className={`task ${task.completed ? 'completed' : ""}`}>
                        {cleanTitle}
                        {category && (
                            <span className={`cat-badge-pill badge-${category}`}>
                                {category}
                            </span>
                        )}
                    </p>
                </div>
                {createdTime && <span className="task-meta">{createdTime}</span>}
            </div>
            <div className="todo-actions">
                <FontAwesomeIcon icon={faPenToSquare} className="todo-action-btn edit" onClick={() => editTodo(task.id)}/>
                <FontAwesomeIcon icon={faTrashCan} className="todo-action-btn delete" onClick={() => deleteTodo(task.id)} />
            </div>
        </div>
    )
}
