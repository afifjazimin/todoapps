import React, {useState} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faSquarePlus } from '@fortawesome/free-regular-svg-icons'
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export const TodoForm = ({addTodo}) => {
    const [value, setValue] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return;
        }

        addTodo(trimmedValue);

        setValue("");
    }


    return (
        <Card className="TodoForm todo-form-shell border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur">
            <CardHeader className="todo-form-header">
                <div className="todo-form-kicker">
                    <FontAwesomeIcon icon={faSquarePlus} className="todo-form-kicker-icon" />
                    Quick capture
                </div>
                <CardTitle className="todo-form-title">Add a new task</CardTitle>
                <CardDescription>
                    Keep it short and clear so your next step is obvious.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="todo-form-grid" onSubmit={handleSubmit}>
                    <Input
                        value={value}
                        placeholder="Add a New Task . . ."
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <Button type="submit">Add Task</Button>
                </form>
            </CardContent>
        </Card>
    )
}
