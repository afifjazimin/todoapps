import React, {useCallback, useEffect, useState} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faAlarmClock } from '@fortawesome/free-regular-svg-icons'
import { TodoForm } from "./TodoForm";
import { Todo } from "./Todo.js";
import { EditTodoForm } from "./EditTodoForm.js";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.js";

const mapSupabaseTodo = todo => ({
    id: todo.id,
    task: todo.title,
    completed: todo.is_completed,
    isEditing: false,
    createdAt: todo.created_at
});

export const TodoWrapper = () => {
    const { user, authReady } = useAuth();
    const [todos, setTodos] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loadingTodos, setLoadingTodos] = useState(false);
    const [actionError, setActionError] = useState("");

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

    const fetchTodos = useCallback(async () => {
        if (!user || !supabase) return;

        setLoadingTodos(true);
        setActionError("");

        const { data, error } = await supabase
            .from("todos")
            .select("id,title,is_completed,created_at")
            .order("created_at", { ascending: false });

        setLoadingTodos(false);

        if (error) {
            setActionError(error.message);
            return;
        }

        setTodos((data ?? []).map(mapSupabaseTodo));
    }, [user]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const addTodo = async todo => {
        if (!user || !supabase) return false;

        setActionError("");

        const { data, error } = await supabase
            .from("todos")
            .insert([{ title: todo, user_id: user.id }])
            .select("id,title,is_completed,created_at")
            .single();

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(currentTodos => [mapSupabaseTodo(data), ...currentTodos]);
        return true;
    };

const toggleComplete = async id => {
    const currentTodo = todos.find(todo => todo.id === id);
    if (!currentTodo || !supabase) return;

    setActionError("");

    const { error } = await supabase
        .from("todos")
        .update({ is_completed: !currentTodo.completed })
        .eq("id", id);

    if (error) {
        setActionError(error.message);
        return;
    }

    setTodos(todos.map(todo => todo.id === id ? {...todo, completed: !todo.completed} : todo));
};

const deleteTodo = async id => {
    if (!supabase) return;

    setActionError("");

    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
        setActionError(error.message);
        return;
    }

    setTodos(todos.filter(todo => todo.id !== id));
};

const editTodo = id => {
    setTodos(todos.map(todo => todo.id === id ? {...todo, isEditing: !todo.isEditing} : todo));
};

const editTask = async (task, id) => {
    if (!supabase) return false;

    setActionError("");

    const { error } = await supabase
        .from("todos")
        .update({ title: task })
        .eq("id", id);

    if (error) {
        setActionError(error.message);
        return false;
    }

    setTodos(todos.map(todo => todo.id === id ? {...todo, task, isEditing: !todo.isEditing} : todo));
    return true;
};

const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

    if (!authReady) {
        return (
            <div className="TodoWrapper setup-panel">
                <div className="todo-heading-row">
                    <p><FontAwesomeIcon icon={faAlarmClock} className="icon"/>Supabase is almost ready</p>
                    <span className="current-date">{formattedDate}</span>
                </div>
                <h1>Add your credentials</h1>
                <div className="setup-card">
                    <p>Create a <code>.env</code> file from <code>.env.example</code>, then add your Supabase project URL and anon key.</p>
                    <code>REACT_APP_SUPABASE_URL=...</code>
                    <code>REACT_APP_SUPABASE_KEY=...</code>
                    <p>After that, run the SQL from <code>docs/SUPABASE_AUTH_SETUP.md</code> in the Supabase SQL Editor.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="TodoWrapper">
            <div className="todo-heading-row">
                <p className="todo-user-prompt">
                    <FontAwesomeIcon icon={faAlarmClock} className="icon"/>
                    Don't be lazy, <span>{user?.email}</span>, plan your task
                </p>
                <div className="todo-account-actions">
                    <span className="current-date">{formattedDate}</span>
                    <Button type="button" variant="secondary" onClick={handleLogout}>Logout</Button>
                </div>
            </div>
            <h1>Today's Focus</h1>
            <TodoForm addTodo={addTodo} />
            {actionError && <p className="todo-error">{actionError}</p>}
            {loadingTodos && <p className="todo-empty">Loading your tasks...</p>}
            {!loadingTodos && todos.length === 0 && (
                <p className="todo-empty">No tasks yet. Add your first focus item above.</p>
            )}
            {todos.map((todo) => (
                todo.isEditing ? (
                    <EditTodoForm key={todo.id} editTodo={editTask} task={todo} />
                ) : (
                    <Todo task={todo} key={todo.id} toggleComplete={toggleComplete}
                    deleteTodo={deleteTodo}
                    editTodo={editTodo}/>
                )
                
            ))}
            
        </div>
    )
}
