import React, {useState} from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const EditTodoForm = ({ editTodo, task }) => {
    const [value, setValue] = useState(task.task);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return;
        }

        editTodo(trimmedValue, task.id);
    }

    return (
        <form className="TodoForm todo-form-inline" onSubmit={handleSubmit}>
            <Input
                value={value}
                placeholder="Update Task"
                onChange={(e) => setValue(e.target.value)}
            />
            <Button type="submit" variant="secondary">Update Task</Button>
        </form>
    )
}
