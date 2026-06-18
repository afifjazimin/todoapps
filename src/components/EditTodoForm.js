import React, { useState } from "react";
import { DatePicker } from "./ui/DatePicker";
import { CategorySelector } from "./ui/CategorySelector";

// Clean legacy hashtag from title for editing
const cleanLegacyTitle = (title = "") => {
    return title.replace(/\s*#(work|personal|shopping|fitness)/i, "").trim();
};

export const EditTodoForm = ({ categories = ["personal", "work", "shopping", "fitness"], editTodo, task }) => {
    const [value, setValue] = useState(cleanLegacyTitle(task.task));
    const [dueDate, setDueDate] = useState(task.dueDate || "");
    const [category, setCategory] = useState(task.category || "personal");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return;
        }

        setSubmitting(true);
        const saved = await editTodo({
            task: trimmedValue,
            dueDate: dueDate || null,
            category,
        }, task.id);
        setSubmitting(false);

        if (!saved) {
            setValue(trimmedValue);
        }
    };

    return (
        <div className="db-edit-form-enhanced">
            <form onSubmit={handleSubmit}>
                {/* Task name + Submit */}
                <div className="db-form-row">
                    <input
                        type="text"
                        value={value}
                        className="db-form-input"
                        placeholder="Update Task"
                        onChange={(e) => setValue(e.target.value)}
                        required
                        autoFocus
                    />
                    <button type="submit" className="db-form-btn-submit" disabled={submitting}>
                        {submitting ? "Updating..." : "Update"}
                    </button>
                </div>

                {/* Due Date + Category */}
                <div className="db-form-meta-row">
                    {/* Due Date */}
                    <DatePicker value={dueDate} onChange={setDueDate} />

                    <span className="db-form-meta-divider"></span>

                    {/* Category */}
                    <div className="db-tag-select-container">
                        <span className="db-tag-select-label">Category:</span>
                        <CategorySelector value={category} onChange={setCategory} categories={categories} />
                    </div>
                </div>
            </form>
        </div>
    );
};
