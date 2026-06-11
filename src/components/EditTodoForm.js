import React, {useState} from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const EditTodoForm = ({ editTodo, task }) => {
    const [value, setValue] = useState(task.task);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return;
        }

        setSubmitting(true);
        const saved = await editTodo(trimmedValue, task.id);
        setSubmitting(false);
        if (!saved) {
            setValue(trimmedValue);
        }
    }

    return (
        <form className="TodoForm todo-form-inline" onSubmit={handleSubmit}>
            <Input
                value={value}
                placeholder="Update Task"
                onChange={(e) => setValue(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={submitting}>
                {submitting ? "Updating..." : "Update Task"}
            </Button>
        </form>
    )
}
