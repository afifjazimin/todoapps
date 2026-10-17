import React from "react";
import { LayoutList, SquareKanban } from "lucide-react";
import "../../styles/Board.css";

const OPTIONS = [
    { value: "list", label: "List", Icon: LayoutList },
    { value: "board", label: "Board", Icon: SquareKanban },
];

export const ViewToggle = ({ value, onChange }) => (
    <div className="view-toggle" role="radiogroup" aria-label="Task view">
        {OPTIONS.map(({ value: v, label, Icon }) => (
            <button
                key={v}
                type="button"
                id={`view-toggle-${v}`}
                role="radio"
                aria-checked={value === v}
                className={`view-toggle-btn${value === v ? " view-toggle-btn--active" : ""}`}
                onClick={() => onChange(v)}
            >
                <Icon size={15} />
                <span>{label}</span>
            </button>
        ))}
        <span className="view-toggle-thumb" data-active={value} aria-hidden="true" />
    </div>
);
