import React, { useState } from "react";
import { Calendar, X } from "lucide-react";

// Clean legacy hashtag from title for editing
const cleanLegacyTitle = (title = "") => {
    return title.replace(/\s*#(work|personal|shopping|fitness)/i, "").trim();
};

export const EditTodoForm = ({ editTodo, task }) => {
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
        <div className="db-form-card db-edit-form-enhanced">
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
                    <div className="db-form-date-group">
                        <Calendar size={14} className="db-form-date-icon" />
                        <input
                            type="date"
                            value={dueDate}
                            className="db-form-date-input"
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        {dueDate && (
                            <button
                                type="button"
                                className="db-form-date-clear"
                                onClick={() => setDueDate("")}
                                aria-label="Clear due date"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <span className="db-form-meta-divider"></span>

                    {/* Category */}
                    <div className="db-tag-select-container">
                        <span className="db-tag-select-label">Category:</span>
                        <div className="db-tag-options">
                            <button
                                type="button"
                                className={`db-tag-btn tag-personal ${category === "personal" ? "active" : ""}`}
                                onClick={() => setCategory("personal")}
                            >
                                Personal
                            </button>
                            <button
                                type="button"
                                className={`db-tag-btn tag-work ${category === "work" ? "active" : ""}`}
                                onClick={() => setCategory("work")}
                            >
                                Work
                            </button>
                            <button
                                type="button"
                                className={`db-tag-btn tag-shopping ${category === "shopping" ? "active" : ""}`}
                                onClick={() => setCategory("shopping")}
                            >
                                Shopping
                            </button>
                            <button
                                type="button"
                                className={`db-tag-btn tag-fitness ${category === "fitness" ? "active" : ""}`}
                                onClick={() => setCategory("fitness")}
                            >
                                Fitness
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
