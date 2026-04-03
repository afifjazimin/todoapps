import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrashCan, faCircleDot} from '@fortawesome/free-regular-svg-icons'

export const Todo = ({task, toggleComplete, deleteTodo, editTodo}) => {
    const createdTime = task.createdAt
        ? new Date(task.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : "";

    return (
        <div className='Todo'>
            <div className="todo-content">
                <div className="task-row">
                    <FontAwesomeIcon icon={faCircleDot} className="task-icon" />
                    <p onClick={() => toggleComplete(task.id)} className={`task ${task.completed ? 'completed' : ""}`}>{task.task}</p>
                </div>
                {createdTime && <span className="task-meta">{createdTime}</span>}
            </div>
            <div>
                <FontAwesomeIcon icon={faPenToSquare} onClick={() => editTodo(task.id)}/>
                <FontAwesomeIcon icon={faTrashCan} onClick={() => deleteTodo(task.id)} />

            </div>
        </div>
    )
}
