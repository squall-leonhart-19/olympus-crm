import { useState } from 'react'
import Header from '../components/layout/Header'
import TaskModal from '../components/tasks/TaskModal'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import './Calendar.css'

// Demo tasks with dates
const INITIAL_TASKS = [
    { id: '1', title: 'Review Q4 sales report', status: 'todo', priority: 'high', assignee: 'Marco', dueDate: '2026-02-01' },
    { id: '2', title: 'Call with Jennifer', status: 'todo', priority: 'urgent', assignee: 'Giulia', dueDate: '2026-01-30' },
    { id: '3', title: 'Prepare onboarding docs', status: 'in_progress', priority: 'medium', assignee: 'Marco', dueDate: '2026-02-03' },
    { id: '4', title: 'Follow up with leads', status: 'in_progress', priority: 'high', assignee: 'Alex', dueDate: '2026-01-31' },
    { id: '5', title: 'Update pricing page', status: 'review', priority: 'medium', assignee: 'Giulia', dueDate: '2026-02-05' },
    { id: '6', title: 'Client onboarding: Sarah', status: 'done', priority: 'high', assignee: 'Marco', dueDate: '2026-01-28' },
    { id: '7', title: 'Team sync meeting', status: 'todo', priority: 'medium', assignee: 'Zeus', dueDate: '2026-01-29' },
    { id: '8', title: 'Send proposals', status: 'todo', priority: 'high', assignee: 'Giulia', dueDate: '2026-01-29' },
    { id: '9', title: 'Review client contracts', status: 'todo', priority: 'medium', assignee: 'Marco', dueDate: '2026-02-04' },
    { id: '10', title: 'Webinar prep', status: 'todo', priority: 'high', assignee: 'Alex', dueDate: '2026-02-06' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_COLORS = {
    low: 'var(--text-muted)',
    medium: 'var(--info)',
    high: 'var(--warning)',
    urgent: 'var(--danger)'
}

export default function CalendarPage() {
    const [tasks, setTasks] = useState(INITIAL_TASKS)
    const [currentDate, setCurrentDate] = useState(new Date('2026-01-29'))
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

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date('2026-01-29'))
    }

    const getDayTasks = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return tasks.filter(t => t.dueDate === dateStr)
    }

    const isToday = (day) => {
        const today = new Date('2026-01-29')
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

    const handleSaveTask = (taskData) => {
        if (editingTask) {
            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t))
        } else {
            const newTask = {
                ...taskData,
                id: Date.now().toString(),
                status: 'todo',
                dueDate: selectedDate
            }
            setTasks(prev => [...prev, newTask])
        }
        setIsModalOpen(false)
        setEditingTask(null)
        setSelectedDate(null)
    }

    const handleDeleteTask = (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        setIsModalOpen(false)
        setEditingTask(null)
    }

    // Generate calendar grid
    const calendarDays = []

    // Empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push({ day: null, key: `empty-${i}` })
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({ day, key: day })
    }

    return (
        <>
            <Header title="Calendar" />
            <div className="page-content calendar-page">
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
                    {/* Weekday headers */}
                    {WEEKDAYS.map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map(({ day, key }) => {
                        if (day === null) {
                            return <div key={key} className="calendar-day empty" />
                        }

                        const dayTasks = getDayTasks(day)
                        const today = isToday(day)

                        return (
                            <div
                                key={key}
                                className={`calendar-day ${today ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
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
                                            <div
                                                className="task-dot"
                                                style={{ background: PRIORITY_COLORS[task.priority] }}
                                            />
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
                    <div className="upcoming-list">
                        {tasks
                            .filter(t => {
                                const taskDate = new Date(t.dueDate)
                                const today = new Date('2026-01-29')
                                const weekFromNow = new Date('2026-02-05')
                                return taskDate >= today && taskDate <= weekFromNow && t.status !== 'done'
                            })
                            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                            .map(task => (
                                <div
                                    key={task.id}
                                    className="upcoming-task"
                                    onClick={() => { setEditingTask(task); setIsModalOpen(true) }}
                                >
                                    <div className="upcoming-date">
                                        {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="upcoming-content">
                                        <div
                                            className="task-priority-dot"
                                            style={{ background: PRIORITY_COLORS[task.priority] }}
                                        />
                                        <span>{task.title}</span>
                                    </div>
                                    <div className="upcoming-assignee">{task.assignee}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <TaskModal
                    task={editingTask}
                    onSave={handleSaveTask}
                    onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : null}
                    onClose={() => { setIsModalOpen(false); setEditingTask(null); setSelectedDate(null) }}
                />
            )}
        </>
    )
}
