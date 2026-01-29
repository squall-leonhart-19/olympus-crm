import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import TaskModal from '../components/tasks/TaskModal'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Calendar.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_COLORS = {
    low: 'var(--text-muted)',
    medium: 'var(--info)',
    high: 'var(--warning)',
    urgent: 'var(--danger)'
}

export default function CalendarPage() {
    const [tasks, setTasks] = useState([])
    const [teamMembers, setTeamMembers] = useState([])
    const [loading, setLoading] = useState(true)

    // Use ACTUAL current date
    const today = new Date()
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [selectedDate, setSelectedDate] = useState(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    useEffect(() => {
        loadTasks()
        loadTeamMembers()
    }, [])

    const loadTasks = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('tasks')
            .select('*')
            .order('due_date', { ascending: true })

        if (data) {
            const mappedTasks = data.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                assignee: t.assignee_name,
                dueDate: t.due_date
            }))
            setTasks(mappedTasks)
        }
        setLoading(false)
    }

    const loadTeamMembers = async () => {
        if (!isSupabaseConfigured) return
        const { data } = await supabase.from('team_members').select('name')
        if (data) setTeamMembers(data.map(m => m.name))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    }

    const getDayTasks = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return tasks.filter(t => t.dueDate === dateStr)
    }

    const isToday = (day) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
    }

    const handleDayClick = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        setSelectedDate(dateStr)
        setEditingTask(null)
        setIsModalOpen(true)
    }

    const handleTaskClick = (e, task) => {
        e.stopPropagation()
        setEditingTask(task)
        setIsModalOpen(true)
    }

    const handleSaveTask = async (taskData) => {
        if (editingTask) {
            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t))

            if (isSupabaseConfigured) {
                await supabase
                    .from('tasks')
                    .update({
                        title: taskData.title,
                        description: taskData.description,
                        priority: taskData.priority,
                        assignee_name: taskData.assignee,
                        due_date: taskData.dueDate || editingTask.dueDate
                    })
                    .eq('id', editingTask.id)
            }
        } else {
            const newTask = {
                ...taskData,
                id: Date.now().toString(),
                status: 'todo',
                dueDate: selectedDate
            }

            if (isSupabaseConfigured) {
                const { data } = await supabase
                    .from('tasks')
                    .insert({
                        title: taskData.title,
                        description: taskData.description,
                        status: 'todo',
                        priority: taskData.priority,
                        assignee_name: taskData.assignee,
                        due_date: selectedDate
                    })
                    .select()
                    .single()

                if (data) newTask.id = data.id
            }

            setTasks(prev => [...prev, newTask])
        }
        setIsModalOpen(false)
        setEditingTask(null)
        setSelectedDate(null)
    }

    const handleDeleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId))

        if (isSupabaseConfigured) {
            await supabase.from('tasks').delete().eq('id', taskId)
        }

        setIsModalOpen(false)
        setEditingTask(null)
    }

    // Generate calendar grid
    const calendarDays = []
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push({ day: null, key: `empty-${i}` })
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({ day, key: day })
    }

    // Get today's tasks
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const todayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'done')

    // Get upcoming tasks (next 7 days)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    const upcomingTasks = tasks
        .filter(t => {
            if (!t.dueDate || t.status === 'done') return false
            const taskDate = new Date(t.dueDate)
            return taskDate >= today && taskDate <= weekFromNow
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    if (loading) {
        return (
            <>
                <Header title="Calendar" />
                <div className="page-content">
                    <div className="loading-state">Loading calendar...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Calendar" />
            <div className="page-content calendar-page">
                {/* Today Banner */}
                <div className="today-banner">
                    <div className="today-date">
                        <Clock size={20} />
                        <span className="today-label">Today:</span>
                        <span className="today-full">
                            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    {todayTasks.length > 0 && (
                        <div className="today-count">
                            <span className="count-badge">{todayTasks.length}</span>
                            task{todayTasks.length > 1 ? 's' : ''} due today
                        </div>
                    )}
                </div>

                <div className="calendar-header">
                    <div className="calendar-nav">
                        <button className="btn btn-ghost" onClick={prevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="month-title">{monthName}</h2>
                        <button className="btn btn-ghost" onClick={nextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="calendar-actions">
                        <button className="btn btn-secondary" onClick={goToToday}>Today</button>
                    </div>
                </div>

                <div className="calendar-grid">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                    ))}

                    {calendarDays.map(({ day, key }) => {
                        if (day === null) {
                            return <div key={key} className="calendar-day empty" />
                        }

                        const dayTasks = getDayTasks(day)
                        const isTodayCell = isToday(day)

                        return (
                            <div
                                key={key}
                                className={`calendar-day ${isTodayCell ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                <div className="day-number">{day}</div>
                                <div className="day-tasks">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <div
                                            key={task.id}
                                            className={`calendar-task ${task.status === 'done' ? 'completed' : ''}`}
                                            onClick={(e) => handleTaskClick(e, task)}
                                        >
                                            <div className="task-dot" style={{ background: PRIORITY_COLORS[task.priority] }} />
                                            <span className="task-text">{task.title}</span>
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="more-tasks">+{dayTasks.length - 3} more</div>
                                    )}
                                </div>
                                <button
                                    className="add-task-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDayClick(day) }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Upcoming Tasks Sidebar */}
                <div className="upcoming-section">
                    <h3>📅 Upcoming This Week</h3>
                    {upcomingTasks.length === 0 ? (
                        <div className="no-upcoming">No tasks scheduled for this week</div>
                    ) : (
                        <div className="upcoming-list">
                            {upcomingTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`upcoming-task ${task.dueDate === todayStr ? 'due-today' : ''}`}
                                    onClick={() => { setEditingTask(task); setIsModalOpen(true) }}
                                >
                                    <div className="upcoming-date">
                                        {task.dueDate === todayStr ? 'Today' : new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="upcoming-content">
                                        <div className="task-priority-dot" style={{ background: PRIORITY_COLORS[task.priority] }} />
                                        <span>{task.title}</span>
                                    </div>
                                    {task.assignee && <div className="upcoming-assignee">{task.assignee}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <TaskModal
                    task={editingTask}
                    teamMembers={teamMembers}
                    onSave={handleSaveTask}
                    onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : null}
                    onClose={() => { setIsModalOpen(false); setEditingTask(null); setSelectedDate(null) }}
                />
            )}
        </>
    )
}
