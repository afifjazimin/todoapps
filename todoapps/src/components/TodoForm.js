import React, {useState} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faSquarePlus } from '@fortawesome/free-regular-svg-icons'

export const TodoForm = ({addTodo}) => {
    const [value, setValue] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault();
        addTodo(value);

        setValue("");
    }

    return (
        <form className="TodoForm" onSubmit={handleSubmit}>
            <FontAwesomeIcon icon={faSquarePlus} /><input type="text" className="todo-input" value={value} placeholder="Add a New Task . . ." onChange={(e) => setValue(e.target.value)}/>
            <button type="submit" className="todo-btn">Add Task</button>
        </form>
    )
}