import React, {useState} from "react";
import { Plus } from "lucide-react";

export const TodoForm = ({addTodo}) => {
    const [value, setValue] = useState("");
    const [category, setCategory] = useState("personal");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return;
        }

        setSubmitting(true);
        // Append category tag to the todo title
        const fullTitle = `${trimmedValue} #${category}`;
        const saved = await addTodo(fullTitle);
        setSubmitting(false);
        if (saved) {
            setValue("");
        }
    }

    return (
        <div className="db-form-card">
            <form onSubmit={handleSubmit}>
                <div className="db-form-row">
                    <input
                        type="text"
                        value={value}
                        className="db-form-input"
                        placeholder="Add a new task focus item..."
                        onChange={(e) => setValue(e.target.value)}
                        required
                    />
                    <button type="submit" className="db-form-btn-submit" disabled={submitting}>
                        <Plus size={16} />
                        {submitting ? "Adding..." : "Add Task"}
                    </button>
                </div>
                
                <div className="db-tag-select-container">
                    <span className="db-tag-select-label">Categorize:</span>
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
            </form>
        </div>
    )
}
