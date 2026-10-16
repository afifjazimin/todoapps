import React, { useCallback, useEffect, useState } from "react";
import {
    CheckSquare,
    Calendar as LucideCalendar,
    LogOut,
    ListTodo,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Menu,
    X,
    Bot
} from "lucide-react";
import { TodoForm } from "./TodoForm";
import { Todo } from "./Todo.js";
import { EditTodoForm } from "./EditTodoForm.js";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.js";
import { BoardView } from "./board/BoardView";
import { ViewToggle } from "./board/ViewToggle";
import { TelegramConnectModal } from "./TelegramConnectModal";
import {
    COLUMN_COLORS,
    completionAfterMove,
    firstDoneColumn,
    firstOpenColumn,
    mapSupabaseColumn,
    positionAtTop,
    resolveColumnId,
} from "./board/boardUtils";

const TODO_SELECT_BASE = "id,title,is_completed,created_at,category,due_date,user_id,owner_email";
const TODO_SELECT_BOARD = `${TODO_SELECT_BASE},column_id,position`;
const COLUMN_SELECT = "id,name,color,position,is_done";
const VIEW_MODE_KEY = "toodu:viewMode";

const byPosition = (a, b) => a.position - b.position;

const mapSupabaseTodo = (todo, subTasks = [], shares = []) => ({
    id: todo.id,
    task: todo.title,
    completed: todo.is_completed,
    isEditing: false,
    createdAt: todo.created_at,
    category: todo.category || extractLegacyCategory(todo.title),
    dueDate: todo.due_date || null,
    userId: todo.user_id,
    ownerEmail: todo.owner_email,
    columnId: todo.column_id ?? null,
    position: typeof todo.position === "number" ? todo.position : null,
    subTasks: subTasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.is_completed,
    })),
    shares: shares.map(s => ({
        id: s.id,
        email: s.shared_with_email,
    })),
});

// Backwards compatibility: extract category from old hashtag-in-title format
const extractLegacyCategory = (title = "") => {
    const match = title.match(/#(work|personal|shopping|fitness)/i);
    return match ? match[1].toLowerCase() : "personal";
};

export const TodoWrapper = () => {
    const { user, authReady } = useAuth();
    const [todos, setTodos] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loadingTodos, setLoadingTodos] = useState(false);
    const [actionError, setActionError] = useState("");

    const [activeTab, setActiveTab] = useState("home"); // "home" or "calendar"
    const [activeCategory, setActiveCategory] = useState("all"); // "all", "work", "personal", "shopping", "fitness"
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

    // Board view state
    const [columns, setColumns] = useState([]);
    const [boardEnabled, setBoardEnabled] = useState(null); // null = loading, false = migration missing
    const [boardError, setBoardError] = useState("");
    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "board";
        } catch {
            return "board";
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(VIEW_MODE_KEY, viewMode);
        } catch {
            // ignore storage errors (private mode etc.)
        }
    }, [viewMode]);

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

        // Board columns (creates defaults + backfills on first run).
        // If the board migration hasn't been run yet, fall back to list-only mode.
        const { data: columnsData, error: columnsError } = await supabase.rpc("ensure_board_columns");
        const boardOk = !columnsError;
        if (columnsError) {
            setBoardEnabled(false);
            setBoardError(columnsError.message);
            setColumns([]);
        } else {
            setBoardEnabled(true);
            setBoardError("");
            setColumns((columnsData ?? []).map(mapSupabaseColumn).sort(byPosition));
        }

        // Fetch todos with new columns
        const { data: todosData, error: todosError } = await supabase
            .from("todos")
            .select(boardOk ? TODO_SELECT_BOARD : TODO_SELECT_BASE)
            .order("created_at", { ascending: false });

        if (todosError) {
            setLoadingTodos(false);
            setActionError(todosError.message);
            return;
        }

        // Fetch all sub_tasks for this user
        const todoIds = (todosData ?? []).map(t => t.id);
        let subTasksMap = {};
        let sharesMap = {};

        if (todoIds.length > 0) {
            const { data: subTasksData, error: subTasksError } = await supabase
                .from("sub_tasks")
                .select("id,todo_id,title,is_completed")
                .in("todo_id", todoIds)
                .order("created_at", { ascending: true });

            if (!subTasksError && subTasksData) {
                subTasksData.forEach(st => {
                    if (!subTasksMap[st.todo_id]) subTasksMap[st.todo_id] = [];
                    subTasksMap[st.todo_id].push(st);
                });
            }

            // Fetch all shares for these todos
            const { data: sharesData, error: sharesError } = await supabase
                .from("todo_shares")
                .select("id,todo_id,shared_with_email")
                .in("todo_id", todoIds);

            if (!sharesError && sharesData) {
                sharesData.forEach(s => {
                    if (!sharesMap[s.todo_id]) sharesMap[s.todo_id] = [];
                    sharesMap[s.todo_id].push(s);
                });
            }
        }

        setTodos((todosData ?? []).map(todo => mapSupabaseTodo(todo, subTasksMap[todo.id] || [], sharesMap[todo.id] || [])));
        setLoadingTodos(false);
    }, [user]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const ownTodosInColumn = (columnId, list = todos) =>
        list.filter(t => t.userId === user?.id && resolveColumnId(t, columns) === columnId);

    const addTodo = async ({ task, dueDate, category, subTasks, columnId }) => {
        if (!user || !supabase) return false;

        setActionError("");

        // Insert the main todo
        const insertData = {
            title: task,
            user_id: user.id,
            category: category || "personal",
            owner_email: user.email,
        };
        if (dueDate) {
            insertData.due_date = dueDate;
        }

        // Board placement: requested column, otherwise the first non-Done column (at the top)
        if (boardEnabled && columns.length > 0) {
            const target = columns.find(c => c.id === columnId) || firstOpenColumn(columns);
            insertData.column_id = target.id;
            insertData.position = positionAtTop(ownTodosInColumn(target.id));
            if (target.isDone) insertData.is_completed = true;
        }

        const { data, error } = await supabase
            .from("todos")
            .insert([insertData])
            .select(boardEnabled ? TODO_SELECT_BOARD : TODO_SELECT_BASE)
            .single();

        if (error) {
            setActionError(error.message);
            return false;
        }

        // Insert sub-tasks if any
        let insertedSubTasks = [];
        if (subTasks && subTasks.length > 0) {
            const subTaskRows = subTasks.map(st => ({
                todo_id: data.id,
                title: st,
                user_id: user.id,
            }));

            const { data: stData, error: stError } = await supabase
                .from("sub_tasks")
                .insert(subTaskRows)
                .select("id,todo_id,title,is_completed");

            if (stError) {
                // Main todo was created but sub-tasks failed — still show it
                console.error("Sub-task insert error:", stError.message);
            } else {
                insertedSubTasks = stData || [];
            }
        }

        setTodos(currentTodos => [mapSupabaseTodo(data, insertedSubTasks, []), ...currentTodos]);
        return true;
    };

    const toggleComplete = async id => {
        const currentTodo = todos.find(todo => todo.id === id);
        if (!currentTodo || !supabase) return;

        setActionError("");

        const nextCompleted = !currentTodo.completed;
        const updateData = { is_completed: nextCompleted };

        // On the owner's board, ticking moves the card into the Done column and
        // unticking moves it back to the first open column.
        if (boardEnabled && columns.length > 0 && currentTodo.userId === user?.id) {
            const currentColumnId = resolveColumnId(currentTodo, columns);
            const currentColumn = columns.find(c => c.id === currentColumnId);
            let target = null;
            if (nextCompleted && !currentColumn?.isDone) target = firstDoneColumn(columns);
            if (!nextCompleted && currentColumn?.isDone) target = columns.find(c => !c.isDone) || null;

            if (target && target.id !== currentColumnId) {
                updateData.column_id = target.id;
                updateData.position = positionAtTop(ownTodosInColumn(target.id));
            }
        }

        const { error } = await supabase
            .from("todos")
            .update(updateData)
            .eq("id", id);

        if (error) {
            setActionError(error.message);
            return;
        }

        setTodos(prev => prev.map(todo => todo.id === id ? {
            ...todo,
            completed: nextCompleted,
            ...(updateData.column_id ? { columnId: updateData.column_id, position: updateData.position } : {}),
        } : todo));
    };

    // ── Board handlers ─────────────────────────────────────────────

    const moveTodo = async (todoId, columnId, position) => {
        if (!supabase) return;
        const todo = todos.find(t => t.id === todoId);
        const toColumn = columns.find(c => c.id === columnId);
        if (!todo || !toColumn) return;

        const fromColumn = columns.find(c => c.id === resolveColumnId(todo, columns));
        const completed = completionAfterMove(todo, fromColumn, toColumn);

        setActionError("");
        // Optimistic (synchronous) so the board doesn't flash the old order
        setTodos(prev => prev.map(t => t.id === todoId ? { ...t, columnId, position, completed } : t));

        const { error } = await supabase
            .from("todos")
            .update({ column_id: columnId, position, is_completed: completed })
            .eq("id", todoId);

        if (error) {
            setActionError(error.message);
            setTodos(prev => prev.map(t => t.id === todoId ? todo : t));
        }
    };

    const addTaskToColumn = (columnId, title) => addTodo({
        task: title,
        category: activeCategory !== "all" ? activeCategory : "personal",
        subTasks: [],
        columnId,
    });

    const addColumn = async (name) => {
        if (!supabase || !user) return false;
        setActionError("");

        const position = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1000 : 1000;
        const color = COLUMN_COLORS[columns.length % COLUMN_COLORS.length];

        const { data, error } = await supabase
            .from("board_columns")
            .insert([{ user_id: user.id, name, color, position }])
            .select(COLUMN_SELECT)
            .single();

        if (error) {
            setActionError(error.message);
            return false;
        }

        setColumns(prev => [...prev, mapSupabaseColumn(data)].sort(byPosition));
        return true;
    };

    // patch uses app field names: { name, color, isDone, position }
    const updateColumn = async (columnId, patch) => {
        if (!supabase) return false;
        const column = columns.find(c => c.id === columnId);
        if (!column) return false;

        setActionError("");

        const dbPatch = {};
        if ("name" in patch) dbPatch.name = patch.name;
        if ("color" in patch) dbPatch.color = patch.color;
        if ("position" in patch) dbPatch.position = patch.position;
        if ("isDone" in patch) dbPatch.is_done = patch.isDone;

        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, ...patch } : c).sort(byPosition));

        const { error } = await supabase.from("board_columns").update(dbPatch).eq("id", columnId);
        if (error) {
            setActionError(error.message);
            setColumns(prev => prev.map(c => c.id === columnId ? column : c).sort(byPosition));
            return false;
        }

        // Marking / unmarking a Done column syncs completion of the tasks inside it
        if ("isDone" in patch && patch.isDone !== column.isDone) {
            const ids = ownTodosInColumn(columnId)
                .filter(t => t.completed !== patch.isDone)
                .map(t => t.id);

            if (ids.length > 0) {
                const { error: syncError } = await supabase
                    .from("todos")
                    .update({ is_completed: patch.isDone })
                    .in("id", ids);

                if (syncError) {
                    setActionError(syncError.message);
                } else {
                    setTodos(prev => prev.map(t => ids.includes(t.id) ? { ...t, completed: patch.isDone } : t));
                }
            }
        }
        return true;
    };

    const renameColumn = (columnId, name) => updateColumn(columnId, { name });
    const reorderColumn = (columnId, position) => updateColumn(columnId, { position });

    const deleteColumn = async (columnId, targetColumnId) => {
        if (!supabase) return false;
        const column = columns.find(c => c.id === columnId);
        if (!column || columns.length <= 1) return false;

        setActionError("");

        const affected = ownTodosInColumn(columnId);
        const target = columns.find(c => c.id === targetColumnId) || columns.find(c => c.id !== columnId);

        // Move tasks out first so nothing is orphaned
        if (affected.length > 0 && target) {
            const movePatch = { column_id: target.id };
            if (target.isDone) movePatch.is_completed = true;
            else if (column.isDone) movePatch.is_completed = false;

            const { error: moveError } = await supabase
                .from("todos")
                .update(movePatch)
                .in("id", affected.map(t => t.id));

            if (moveError) {
                setActionError(moveError.message);
                return false;
            }

            const affectedIds = new Set(affected.map(t => t.id));
            setTodos(prev => prev.map(t => affectedIds.has(t.id) ? {
                ...t,
                columnId: target.id,
                completed: "is_completed" in movePatch ? movePatch.is_completed : t.completed,
            } : t));
        }

        const { error } = await supabase.from("board_columns").delete().eq("id", columnId);
        if (error) {
            setActionError(error.message);
            return false;
        }

        setColumns(prev => prev.filter(c => c.id !== columnId));
        return true;
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
        setTodos(todos.map(todo => todo.id === id ? { ...todo, isEditing: !todo.isEditing } : todo));
    };

    const editTask = async ({ task, dueDate, category }, id) => {
        if (!supabase) return false;

        setActionError("");

        const updateData = { title: task };
        if (category) updateData.category = category;
        if (dueDate !== undefined) updateData.due_date = dueDate || null;

        const { error } = await supabase
            .from("todos")
            .update(updateData)
            .eq("id", id);

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(todos.map(todo => todo.id === id ? {
            ...todo,
            task,
            category: category || todo.category,
            dueDate: dueDate !== undefined ? (dueDate || null) : todo.dueDate,
            isEditing: false,
        } : todo));
        return true;
    };

    const toggleSubTask = async (todoId, subTaskId) => {
        if (!supabase) return;

        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;

        const subTask = todo.subTasks.find(st => st.id === subTaskId);
        if (!subTask) return;

        setActionError("");

        const { error } = await supabase
            .from("sub_tasks")
            .update({ is_completed: !subTask.completed })
            .eq("id", subTaskId);

        if (error) {
            setActionError(error.message);
            return;
        }

        setTodos(todos.map(t => {
            if (t.id !== todoId) return t;
            return {
                ...t,
                subTasks: t.subTasks.map(st =>
                    st.id === subTaskId ? { ...st, completed: !st.completed } : st
                ),
            };
        }));
    };

    const deleteSubTask = async (todoId, subTaskId) => {
        if (!supabase) return;

        setActionError("");

        const { error } = await supabase
            .from("sub_tasks")
            .delete()
            .eq("id", subTaskId);

        if (error) {
            setActionError(error.message);
            return;
        }

        setTodos(todos.map(t => {
            if (t.id !== todoId) return t;
            return {
                ...t,
                subTasks: t.subTasks.filter(st => st.id !== subTaskId),
            };
        }));
    };

    const editSubTask = async (todoId, subTaskId, newTitle) => {
        if (!supabase) return false;

        setActionError("");

        const { error } = await supabase
            .from("sub_tasks")
            .update({ title: newTitle })
            .eq("id", subTaskId);

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(todos.map(t => {
            if (t.id !== todoId) return t;
            return {
                ...t,
                subTasks: t.subTasks.map(st =>
                    st.id === subTaskId ? { ...st, title: newTitle } : st
                ),
            };
        }));
        return true;
    };

    const shareTodo = async (todoId, email) => {
        if (!supabase) return false;

        setActionError("");

        const { data, error } = await supabase
            .from("todo_shares")
            .insert([{ todo_id: todoId, shared_with_email: email, user_id: user.id }])
            .select("id,todo_id,shared_with_email")
            .single();

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(todos.map(t => {
            if (t.id !== todoId) return t;
            return {
                ...t,
                shares: [...(t.shares || []), { id: data.id, email: data.shared_with_email }],
            };
        }));
        return true;
    };

    const unshareTodo = async (todoId, shareId) => {
        if (!supabase) return false;

        setActionError("");

        const { error } = await supabase
            .from("todo_shares")
            .delete()
            .eq("id", shareId);

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(todos.map(t => {
            if (t.id !== todoId) return t;
            return {
                ...t,
                shares: (t.shares || []).filter(s => s.id !== shareId),
            };
        }));
        return true;
    };

    const addSubTask = async (todoId, title) => {
        if (!supabase || !user) return false;

        setActionError("");

        const { data, error } = await supabase
            .from("sub_tasks")
            .insert([{ todo_id: todoId, title, user_id: user.id }])
            .select("id,todo_id,title,is_completed")
            .single();

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(todos.map(t => {
            if (t.id !== todoId) return t;
            return {
                ...t,
                subTasks: [...t.subTasks, {
                    id: data.id,
                    title: data.title,
                    completed: data.is_completed,
                }],
            };
        }));
        return true;
    };

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    // Category Counts — now uses the dedicated category field
    const getCategoryCount = (cat) => {
        if (cat === "all") return todos.length;
        return todos.filter(t => (t.category || "personal").toLowerCase() === cat.toLowerCase()).length;
    };

    const defaultCategories = ["personal", "work", "shopping", "fitness"];
    const categoriesList = Array.from(new Set([
        ...defaultCategories,
        ...todos.map(t => (t.category || "personal").toLowerCase())
    ])).filter(cat => cat !== "styling");

    // Progress percentage calculation
    const completedCount = todos.filter(t => t.completed).length;
    const progressPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

    // Filtered tasks display list
    const filteredTodos = todos.filter(todo => {
        if (activeTab === "home") {
            if (activeCategory === "all") return true;
            return (todo.category || "personal").toLowerCase() === activeCategory.toLowerCase();
        } else {
            // Calendar Mode: filter by due_date first, then created_at fallback
            const dateToCheck = todo.dueDate
                ? new Date(todo.dueDate + "T00:00:00")
                : (todo.createdAt ? new Date(todo.createdAt) : null);
            if (!dateToCheck) return false;
            return dateToCheck.toDateString() === selectedCalendarDate.toDateString();
        }
    });

    // Calendar generation helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDayIndex = firstDay.getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Previous month padding
        const prevMonthTotalDays = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            days.push({
                day: prevMonthTotalDays - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthTotalDays - i)
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        // Next month padding
        const totalCells = 42;
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    };

    const getTasksForDate = (date) => {
        const dStr = date.toDateString();
        return todos.filter(t => {
            const dateToCheck = t.dueDate
                ? new Date(t.dueDate + "T00:00:00")
                : (t.createdAt ? new Date(t.createdAt) : null);
            if (!dateToCheck) return false;
            return dateToCheck.toDateString() === dStr;
        });
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    if (!authReady) {
        return (
            <div className="modern-auth-container">
                <div className="dot-grid-bg"></div>
                <section className="modern-auth-card" style={{ maxWidth: '500px' }}>
                    <div className="modern-auth-logo">
                        <div className="modern-auth-logo-dots">
                            <span className="modern-auth-logo-dot blue"></span>
                            <span className="modern-auth-logo-dot"></span>
                            <span className="modern-auth-logo-dot"></span>
                            <span className="modern-auth-logo-dot"></span>
                        </div>
                        <span className="modern-auth-brand-name">TodoApps</span>
                    </div>
                    <div className="modern-auth-header">
                        <span className="modern-auth-kicker">Supabase Config Required</span>
                        <h1>Connection Setup</h1>
                        <p>Create a <code>.env</code> file in your root folder and add your project keys:</p>
                    </div>
                    <div className="modern-auth-form" style={{ textAlign: 'left', background: '#f8fafc', padding: '20px', borderRadius: '12px', gap: '10px' }}>
                        <code style={{ fontSize: '12px' }}>REACT_APP_SUPABASE_URL=...</code>
                        <code style={{ fontSize: '12px' }}>REACT_APP_SUPABASE_KEY=...</code>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Run SQL setup commands located in <code>docs/SUPABASE_AUTH_SETUP.md</code> in Supabase editor.</p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <div className="dot-grid-bg"></div>

            {/* Left Sidebar Panel */}
            <aside className={`db-sidebar ${isSidebarOpen ? "active" : ""}`}>
                <div className="db-sidebar-logo">
                    <div className="logo-dots small">
                        <span className="logo-dot blue"></span>
                        <span className="logo-dot"></span>
                        <span className="logo-dot"></span>
                        <span className="logo-dot"></span>
                    </div>
                    <span className="db-sidebar-brand">Toodu</span>
                    <button className="db-sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Group */}
                <div className="db-sidebar-section">
                    <span className="db-sidebar-section-title">Navigation</span>
                    <button
                        className={`sidebar-item ${activeTab === "home" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("home");
                            setIsSidebarOpen(false);
                        }}
                    >
                        <ListTodo size={16} />
                        <span>Home</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === "calendar" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("calendar");
                            setIsSidebarOpen(false);
                        }}
                    >
                        <LucideCalendar size={16} />
                        <span>Calendar View</span>
                    </button>
                    <button
                        className="sidebar-item"
                        onClick={() => {
                            setIsTelegramModalOpen(true);
                            setIsSidebarOpen(false);
                        }}
                        style={{ color: "#2563eb" }}
                    >
                        <Bot size={16} />
                        <span>Telegram Bot</span>
                        <span className="cat-count" style={{ background: "#eff6ff", color: "#2563eb", fontSize: "10px", padding: "1px 6px" }}>NEW</span>
                    </button>
                </div>

                {/* Categories Group (only active in Home Tab) */}
                <div className="db-sidebar-section">
                    <span className="db-sidebar-section-title">Categories</span>
                    <button
                        className={`sidebar-item ${activeTab === "home" && activeCategory === "all" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("home");
                            setActiveCategory("all");
                            setIsSidebarOpen(false);
                        }}
                    >
                        <LayoutDashboard size={14} />
                        <span>All Focus Items</span>
                        <span className="cat-count">{getCategoryCount("all")}</span>
                    </button>
                    {categoriesList.map(cat => {
                        const colorMap = {
                            personal: "bg-orange",
                            work: "bg-blue",
                            shopping: "bg-purple",
                            fitness: "bg-green"
                        };
                        const dotClass = colorMap[cat] || "bg-gray";
                        const customDotStyle = !colorMap[cat] ? { background: '#94a3b8' } : undefined;
                        return (
                            <button
                                key={cat}
                                className={`sidebar-item ${activeTab === "home" && activeCategory === cat ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab("home");
                                    setActiveCategory(cat);
                                    setIsSidebarOpen(false);
                                }}
                            >
                                <span className={`cat-dot ${dotClass}`} style={customDotStyle}></span>
                                <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                                <span className="cat-count">{getCategoryCount(cat)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Sidebar Bottom (Progress Bar & Logout) */}
                <div className="db-sidebar-bottom">
                    <div className="sidebar-progress-container">
                        <div className="sidebar-progress-text">
                            <span>Workspace Progress</span>
                            <span className="sidebar-progress-percentage">{progressPercentage}%</span>
                        </div>
                        <div className="sidebar-progress-bar">
                            <div
                                className="sidebar-progress-fill"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <LogOut size={14} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {isSidebarOpen && (
                <div className="db-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Main Content Dashboard Panel */}
            <main className="db-content-area">

                {/* Dashboard Header Bar */}
                <header className="db-content-header">
                    <button className="db-sidebar-toggle" onClick={() => setIsSidebarOpen(true)} aria-label="Open sidebar">
                        <Menu size={18} />
                    </button>
                    <div className="db-welcome-banner">
                        <CheckSquare size={16} className="db-welcome-icon" />
                        <span className="db-welcome-text">
                            Welcome back, <span className="db-welcome-user">{user?.email}</span>
                        </span>
                    </div>
                    <span className="db-date-display">{formattedDate}</span>
                </header>

                {/* View Content Panels */}
                {activeTab === "home" ? (
                    <div className="db-tasks-view">
                        <div className="db-tasks-header-row">
                            <h2 className="db-view-heading">
                                {activeCategory === "all" ? "Today's Focus" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Focus`}
                            </h2>
                            <ViewToggle value={boardEnabled === false ? "list" : viewMode} onChange={setViewMode} />
                        </div>

                        {boardEnabled === false && (
                            <div className="board-migration-banner">
                                <strong>Board View Setup Required:</strong>
                                <span>
                                    Please run the SQL migration in Supabase SQL Editor from <code>docs/SUPABASE_BOARD_MIGRATION.sql</code> to enable custom board columns.
                                </span>
                                {boardError && <small style={{ color: '#b45309', opacity: 0.85 }}>{boardError}</small>}
                            </div>
                        )}

                        <TodoForm categories={categoriesList} addTodo={addTodo} />

                        {actionError && <div className="modern-auth-alert error" style={{ marginBottom: '16px' }}>{actionError}</div>}
                        {loadingTodos && todos.length === 0 && <p className="todo-empty">Loading your tasks...</p>}

                        {viewMode === "board" && boardEnabled ? (
                            <BoardView
                                columns={columns}
                                todos={filteredTodos}
                                allTodos={todos}
                                userId={user?.id}
                                categories={categoriesList}
                                taskHandlers={{
                                    editTask,
                                    toggleComplete,
                                    deleteTodo,
                                    editTodo,
                                    toggleSubTask,
                                    deleteSubTask,
                                    editSubTask,
                                    shareTodo,
                                    unshareTodo,
                                    addSubTask,
                                }}
                                onToggleComplete={toggleComplete}
                                onMoveTodo={moveTodo}
                                onAddTask={addTaskToColumn}
                                onAddColumn={addColumn}
                                onRenameColumn={renameColumn}
                                onUpdateColumn={updateColumn}
                                onDeleteColumn={deleteColumn}
                                onReorderColumn={reorderColumn}
                            />
                        ) : (
                            <>
                                {!loadingTodos && filteredTodos.length === 0 && (
                                    <p className="todo-empty">No tasks categorized under this group yet.</p>
                                )}

                                {filteredTodos.map((todo) => (
                                    todo.isEditing ? (
                                        <EditTodoForm key={todo.id} categories={categoriesList} editTodo={editTask} task={todo} />
                                    ) : (
                                        <Todo
                                            task={todo}
                                            key={todo.id}
                                            toggleComplete={toggleComplete}
                                            deleteTodo={deleteTodo}
                                            editTodo={editTodo}
                                            toggleSubTask={toggleSubTask}
                                            deleteSubTask={deleteSubTask}
                                            editSubTask={editSubTask}
                                            shareTodo={shareTodo}
                                            unshareTodo={unshareTodo}
                                            addSubTask={addSubTask}
                                        />
                                    )
                                ))}
                            </>
                        )}
                    </div>
                ) : (
                    // Calendar View — Split Layout
                    <div className="db-calendar-view">
                        <h2 className="db-view-heading">Schedule Calendar</h2>

                        <div className="db-cal-split">
                            {/* Left: Calendar Grid */}
                            <div className="db-calendar-container db-cal-left">
                                <div className="db-calendar-header">
                                    <span className="db-calendar-title">
                                        {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                                    </span>
                                    <div className="db-calendar-nav">
                                        <button className="db-calendar-nav-btn" onClick={handlePrevMonth}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button className="db-calendar-nav-btn" onClick={handleNextMonth}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="db-calendar-weekdays">
                                    <span>Sun</span><span>Mon</span><span>Tue</span>
                                    <span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                                </div>

                                <div className="db-calendar-grid">
                                    {getDaysInMonth(currentMonth).map((day, idx) => {
                                        const dateTasks = getTasksForDate(day.date);
                                        const isSelected = day.date.toDateString() === selectedCalendarDate.toDateString();
                                        const isToday = day.date.toDateString() === new Date().toDateString();

                                        return (
                                            <div
                                                key={idx}
                                                className={`db-calendar-day-cell ${!day.isCurrentMonth ? "other-month" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                                                onClick={() => setSelectedCalendarDate(day.date)}
                                            >
                                                <span className="db-cal-day-num">{day.day}</span>
                                                {dateTasks.length > 0 && (
                                                    <span className="db-cal-task-badge">{dateTasks.length}</span>
                                                )}
                                                {dateTasks.length > 0 && (
                                                    <div className="db-calendar-dot-container">
                                                        {dateTasks.slice(0, 3).map((task, i) => {
                                                            const cat = task.category || "personal";
                                                            return <span key={i} className={`db-calendar-dot bg-${cat}`}></span>;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="db-cal-legend">
                                    <span className="db-cal-legend-item"><span className="db-cal-legend-dot" style={{ background: '#f97316' }}></span>Personal</span>
                                    <span className="db-cal-legend-item"><span className="db-cal-legend-dot" style={{ background: '#3b82f6' }}></span>Work</span>
                                    <span className="db-cal-legend-item"><span className="db-cal-legend-dot" style={{ background: '#8b5cf6' }}></span>Shopping</span>
                                    <span className="db-cal-legend-item"><span className="db-cal-legend-dot" style={{ background: '#10b981' }}></span>Fitness</span>
                                </div>
                            </div>

                            {/* Right: Task Panel */}
                            <div className="db-cal-task-panel">
                                <div className="db-cal-task-panel-header">
                                    <div className="db-cal-task-panel-date">
                                        <span className="db-cal-task-panel-daynum">
                                            {selectedCalendarDate.getDate()}
                                        </span>
                                        <div className="db-cal-task-panel-dayinfo">
                                            <span className="db-cal-task-panel-dayname">
                                                {selectedCalendarDate.toLocaleDateString("en-US", { weekday: "long" })}
                                            </span>
                                            <span className="db-cal-task-panel-monthyear">
                                                {selectedCalendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="db-cal-task-count-chip">
                                        {filteredTodos.length} task{filteredTodos.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <div className="db-cal-task-list">
                                    {actionError && <div className="modern-auth-alert error" style={{ marginBottom: '12px' }}>{actionError}</div>}
                                    {filteredTodos.length === 0 ? (
                                        <div className="db-cal-empty-state">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <p>No tasks on this day</p>
                                            <span>Tasks with this due date will appear here</span>
                                        </div>
                                    ) : (
                                        filteredTodos.map((todo) => (
                                            todo.isEditing ? (
                                                <EditTodoForm key={todo.id} categories={categoriesList} editTodo={editTask} task={todo} />
                                            ) : (
                                                <Todo
                                                    task={todo}
                                                    key={todo.id}
                                                    toggleComplete={toggleComplete}
                                                    deleteTodo={deleteTodo}
                                                    editTodo={editTodo}
                                                    toggleSubTask={toggleSubTask}
                                                    deleteSubTask={deleteSubTask}
                                                    editSubTask={editSubTask}
                                                    shareTodo={shareTodo}
                                                    unshareTodo={unshareTodo}
                                                    addSubTask={addSubTask}
                                                />
                                            )
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <TelegramConnectModal
                isOpen={isTelegramModalOpen}
                onClose={() => setIsTelegramModalOpen(false)}
            />
        </div>
    );
};
