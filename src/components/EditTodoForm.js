import React, {useState} from "react";

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
        <form className="db-form-card db-edit-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={value}
                className="db-form-input"
                placeholder="Update Task"
                onChange={(e) => setValue(e.target.value)}
                required
            />
            <button type="submit" className="db-form-btn-submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Task"}
            </button>
        </form>
    )
}
