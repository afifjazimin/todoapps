import React, {useEffect, useState} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faAlarmClock } from '@fortawesome/free-regular-svg-icons'
import { TodoForm } from "./TodoForm";
import { v4 as uuidv4 } from "uuid";
import { Todo } from "./Todo.js";
import { EditTodoForm } from "./EditTodoForm.js";
uuidv4(); // Example usage of uuidv4 to generate a unique ID

export const TodoWrapper = ({ }) => {
    const [todos, setTodos] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short"
    }).toUpperCase();

    const addTodo = todo => {
        setTodos([...todos, {
            id : uuidv4(),
            task: todo,
            isCompleted: false,
            isEditing: false,
            createdAt: new Date().toISOString()
        }])
        console.log(todos);
    };

const toggleComplete = id => {
    setTodos(todos.map(todo => todo.id === id ? {...todo, completed: !todo.completed} : todo))
}

const deleteTodo = id => {
    setTodos(todos.filter(todo => todo.id !== id))
}

const editTodo = id => {
    setTodos(todos.map(todo => todo.id === id ? {...todo, isEditing: !todo.isEditing} : todo))
}

const editTask = (task, id) => {
    setTodos(todos.map(todo => todo.id === id ? {...todo, task, isEditing: !todo.isEditing} : todo))
}
    return (
        <div className="TodoWrapper">
            <span className="current-date">{formattedDate}</span>
            <p><FontAwesomeIcon icon={faAlarmClock} className="icon"/>Don't be lazy, plan your task</p>
            <h1>Today's Focus</h1>
            <TodoForm addTodo={addTodo} />
            {todos.map((todo, index) => (
                todo.isEditing ? (
                    <EditTodoForm editTodo={editTask} task={todo} />
                ) : (
                    <Todo task={todo} key={index} toggleComplete={toggleComplete}
                    deleteTodo={deleteTodo}
                    editTodo={editTodo}/>
                )
                
            ))}
            
        </div>
    )
}
