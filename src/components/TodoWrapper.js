import React, { useCallback, useEffect, useState } from "react";
import {
    CheckSquare,
    Calendar as LucideCalendar,
    LogOut,
    ListTodo,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard
} from "lucide-react";
import { TodoForm } from "./TodoForm";
import { Todo } from "./Todo.js";
import { EditTodoForm } from "./EditTodoForm.js";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../supabaseClient.js";

const mapSupabaseTodo = todo => ({
    id: todo.id,
    task: todo.title,
    completed: todo.is_completed,
    isEditing: false,
    createdAt: todo.created_at
});

export const TodoWrapper = () => {
    const { user, authReady } = useAuth();
    const [todos, setTodos] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loadingTodos, setLoadingTodos] = useState(false);
    const [actionError, setActionError] = useState("");

    // Active Nav States
    const [activeTab, setActiveTab] = useState("home"); // "home" or "calendar"
    const [activeCategory, setActiveCategory] = useState("all"); // "all", "work", "personal", "shopping", "fitness"
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

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

        const { data, error } = await supabase
            .from("todos")
            .select("id,title,is_completed,created_at")
            .order("created_at", { ascending: false });

        setLoadingTodos(false);

        if (error) {
            setActionError(error.message);
            return;
        }

        setTodos((data ?? []).map(mapSupabaseTodo));
    }, [user]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const addTodo = async todo => {
        if (!user || !supabase) return false;

        setActionError("");

        const { data, error } = await supabase
            .from("todos")
            .insert([{ title: todo, user_id: user.id }])
            .select("id,title,is_completed,created_at")
            .single();

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(currentTodos => [mapSupabaseTodo(data), ...currentTodos]);
        return true;
    };

    const toggleComplete = async id => {
        const currentTodo = todos.find(todo => todo.id === id);
        if (!currentTodo || !supabase) return;

        setActionError("");

        const { error } = await supabase
            .from("todos")
            .update({ is_completed: !currentTodo.completed })
            .eq("id", id);

        if (error) {
            setActionError(error.message);
            return;
        }

        setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
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

    const editTask = async (task, id) => {
        if (!supabase) return false;

        setActionError("");

        const { error } = await supabase
            .from("todos")
            .update({ title: task })
            .eq("id", id);

        if (error) {
            setActionError(error.message);
            return false;
        }

        setTodos(todos.map(todo => todo.id === id ? { ...todo, task, isEditing: !todo.isEditing } : todo));
        return true;
    };

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    // Category Counts calculation helper
    const getCategoryCount = (cat) => {
        if (cat === "all") return todos.length;
        return todos.filter(t => {
            const taskLower = (t.task || "").toLowerCase();
            const hasTag = taskLower.includes("#work") || taskLower.includes("#personal") || taskLower.includes("#shopping") || taskLower.includes("#fitness");
            if (cat === "personal") {
                return taskLower.includes("#personal") || !hasTag;
            }
            return taskLower.includes(`#${cat}`);
        }).length;
    };

    // Progress percentage calculation
    const completedCount = todos.filter(t => t.completed).length;
    const progressPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

    // Filtered tasks display list
    const filteredTodos = todos.filter(todo => {
        if (activeTab === "home") {
            if (activeCategory === "all") return true;
            const taskLower = (todo.task || "").toLowerCase();
            if (activeCategory === "personal") {
                const hasTag = taskLower.includes("#work") || taskLower.includes("#personal") || taskLower.includes("#shopping") || taskLower.includes("#fitness");
                return taskLower.includes("#personal") || !hasTag;
            }
            return taskLower.includes(`#${activeCategory}`);
        } else {
            // Calendar Mode: filter tasks created on the selected date
            if (!todo.createdAt) return false;
            return new Date(todo.createdAt).toDateString() === selectedCalendarDate.toDateString();
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
            if (!t.createdAt) return false;
            return new Date(t.createdAt).toDateString() === dStr;
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
            <aside className="db-sidebar">
                <div className="db-sidebar-logo">
                    <div className="logo-dots small">
                        <span className="logo-dot blue"></span>
                        <span className="logo-dot"></span>
                        <span className="logo-dot"></span>
                        <span className="logo-dot"></span>
                    </div>
                    <span className="db-sidebar-brand">TodoApps</span>
                </div>

                {/* Navigation Group */}
                <div className="db-sidebar-section">
                    <span className="db-sidebar-section-title">Navigation</span>
                    <button
                        className={`sidebar-item ${activeTab === "home" ? "active" : ""}`}
                        onClick={() => setActiveTab("home")}
                    >
                        <ListTodo size={16} />
                        <span>Home</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === "calendar" ? "active" : ""}`}
                        onClick={() => setActiveTab("calendar")}
                    >
                        <LucideCalendar size={16} />
                        <span>Calendar View</span>
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
                        }}
                    >
                        <LayoutDashboard size={14} />
                        <span>All Focus Items</span>
                        <span className="cat-count">{getCategoryCount("all")}</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === "home" && activeCategory === "personal" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("home");
                            setActiveCategory("personal");
                        }}
                    >
                        <span className="cat-dot bg-orange"></span>
                        <span>Personal</span>
                        <span className="cat-count">{getCategoryCount("personal")}</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === "home" && activeCategory === "work" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("home");
                            setActiveCategory("work");
                        }}
                    >
                        <span className="cat-dot bg-blue"></span>
                        <span>Work</span>
                        <span className="cat-count">{getCategoryCount("work")}</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === "home" && activeCategory === "shopping" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("home");
                            setActiveCategory("shopping");
                        }}
                    >
                        <span className="cat-dot bg-purple"></span>
                        <span>Shopping</span>
                        <span className="cat-count">{getCategoryCount("shopping")}</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === "home" && activeCategory === "fitness" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("home");
                            setActiveCategory("fitness");
                        }}
                    >
                        <span className="cat-dot bg-green"></span>
                        <span>Fitness</span>
                        <span className="cat-count">{getCategoryCount("fitness")}</span>
                    </button>
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

            {/* Main Content Dashboard Panel */}
            <main className="db-content-area">

                {/* Dashboard Header Bar */}
                <header className="db-content-header">
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
                        <h2 className="db-view-heading">
                            {activeCategory === "all" ? "Today's Focus" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Focus`}
                        </h2>

                        <TodoForm addTodo={addTodo} />

                        {actionError && <div className="modern-auth-alert error" style={{ marginBottom: '16px' }}>{actionError}</div>}
                        {loadingTodos && <p className="todo-empty">Loading your tasks...</p>}
                        {!loadingTodos && filteredTodos.length === 0 && (
                            <p className="todo-empty">No tasks categorized under this group yet.</p>
                        )}

                        {filteredTodos.map((todo) => (
                            todo.isEditing ? (
                                <EditTodoForm key={todo.id} editTodo={editTask} task={todo} />
                            ) : (
                                <Todo
                                    task={todo}
                                    key={todo.id}
                                    toggleComplete={toggleComplete}
                                    deleteTodo={deleteTodo}
                                    editTodo={editTodo}
                                />
                            )
                        ))}
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
                                                            const match = (task.task || "").match(/#(work|personal|shopping|fitness)/i);
                                                            const cat = match ? match[1].toLowerCase() : "personal";
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
                                            <span>Tasks created on this date will appear here</span>
                                        </div>
                                    ) : (
                                        filteredTodos.map((todo) => (
                                            todo.isEditing ? (
                                                <EditTodoForm key={todo.id} editTodo={editTask} task={todo} />
                                            ) : (
                                                <Todo
                                                    task={todo}
                                                    key={todo.id}
                                                    toggleComplete={toggleComplete}
                                                    deleteTodo={deleteTodo}
                                                    editTodo={editTodo}
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
        </div>
    );
};
