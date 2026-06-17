import React, { useState } from "react";
import { Plus, Calendar, ChevronDown, ChevronUp, X, ListPlus } from "lucide-react";

export const TodoForm = ({ addTodo }) => {
    const [taskName, setTaskName] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [category, setCategory] = useState("personal");
    const [subTasks, setSubTasks] = useState([]);
    const [subTaskInput, setSubTaskInput] = useState("");
    const [showSubTasks, setShowSubTasks] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleAddSubTask = () => {
        const trimmed = subTaskInput.trim();
        if (!trimmed) return;
        setSubTasks(prev => [...prev, { title: trimmed, tempId: Date.now() }]);
        setSubTaskInput("");
    };

    const handleSubTaskKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddSubTask();
        }
    };

    const removeSubTask = (tempId) => {
        setSubTasks(prev => prev.filter(st => st.tempId !== tempId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedTask = taskName.trim();

        if (!trimmedTask) return;

        setSubmitting(true);
        const saved = await addTodo({
            task: trimmedTask,
            dueDate: dueDate || null,
            category,
            subTasks: subTasks.map(st => st.title),
        });
        setSubmitting(false);

        if (saved) {
            setTaskName("");
            setDueDate("");
            setCategory("personal");
            setSubTasks([]);
            setSubTaskInput("");
            setShowSubTasks(false);
        }
    };

    return (
        <div className="db-form-card db-form-card--enhanced">
            <form onSubmit={handleSubmit}>
                {/* Row 1: Task name + Submit */}
                <div className="db-form-row">
                    <input
                        type="text"
                        value={taskName}
                        className="db-form-input"
                        placeholder="What needs to be done?"
                        onChange={(e) => setTaskName(e.target.value)}
                        required
                    />
                    <button type="submit" className="db-form-btn-submit" disabled={submitting}>
                        <Plus size={16} />
                        {submitting ? "Adding..." : "Add Task"}
                    </button>
                </div>

                {/* Row 2: Due Date + Category tags */}
                <div className="db-form-meta-row">
                    {/* Due Date Picker */}
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

                    {/* Divider */}
                    <span className="db-form-meta-divider"></span>

                    {/* Category selector */}
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

                {/* Row 3: Sub-tasks toggle + list */}
                <div className="db-form-subtask-section">
                    <button
                        type="button"
                        className={`db-form-subtask-toggle ${showSubTasks ? "active" : ""}`}
                        onClick={() => setShowSubTasks(!showSubTasks)}
                    >
                        <ListPlus size={14} />
                        <span>Sub-tasks {subTasks.length > 0 && `(${subTasks.length})`}</span>
                        {showSubTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showSubTasks && (
                        <div className="db-form-subtask-body">
                            {/* Sub-task input */}
                            <div className="db-form-subtask-add">
                                <input
                                    type="text"
                                    value={subTaskInput}
                                    className="db-form-subtask-input"
                                    placeholder="Add a sub-task..."
                                    onChange={(e) => setSubTaskInput(e.target.value)}
                                    onKeyDown={handleSubTaskKeyDown}
                                />
                                <button
                                    type="button"
                                    className="db-form-subtask-add-btn"
                                    onClick={handleAddSubTask}
                                    disabled={!subTaskInput.trim()}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Sub-task list */}
                            {subTasks.length > 0 && (
                                <div className="db-form-subtask-list">
                                    {subTasks.map((st) => (
                                        <div key={st.tempId} className="db-form-subtask-item">
                                            <span className="db-form-subtask-bullet"></span>
                                            <span className="db-form-subtask-text">{st.title}</span>
                                            <button
                                                type="button"
                                                className="db-form-subtask-remove"
                                                onClick={() => removeSubTask(st.tempId)}
                                                aria-label="Remove sub-task"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};
