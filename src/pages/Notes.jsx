import { useState, useEffect, useCallback } from 'react'
import {
    Plus,
    Trash2,
    Search,
    StickyNote,
    Clock,
    Pin,
    PinOff,
    Check,
    Users,
    User,
    Phone,
    FileText,
    BookOpen,
    FolderOpen,
    Folder
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Notes.css'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: StickyNote, color: '#6b7280' },
    { id: 'script', label: 'Scripts', icon: Phone, color: '#22c55e' },
    { id: 'template', label: 'Templates', icon: FileText, color: '#3b82f6' },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen, color: '#f59e0b' },
]

export default function Notes() {
    const [notes, setNotes] = useState([])
    const [selectedNote, setSelectedNote] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [activeCategory, setActiveCategory] = useState('all')
    const [departments, setDepartments] = useState([])
    const [selectedDepartment, setSelectedDepartment] = useState('')
    const [currentUser, setCurrentUser] = useState('User')
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState('')

    useEffect(() => {
        loadNotes()
        loadDepartments()
        loadCurrentUser()
        loadProjects()
    }, [])

    const loadCurrentUser = async () => {
        if (!isSupabaseConfigured) return
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.name) {
                setCurrentUser(user.user_metadata.name)
            } else if (user?.email) {
                setCurrentUser(user.email.split('@')[0])
            }
        } catch (e) { }
    }

    const loadDepartments = async () => {
        if (!isSupabaseConfigured) {
            setDepartments([
                { id: '1', name: 'Customer Care', color: '#22c55e' },
                { id: '2', name: 'Meta Ads', color: '#3b82f6' },
                { id: '3', name: 'Creatives', color: '#f59e0b' },
                { id: '4', name: 'Sales', color: '#8b5cf6' },
            ])
            return
        }
        try {
            const { data } = await supabase
                .from('project_sections')
                .select('*')
                .order('name', { ascending: true })
            if (data) setDepartments(data)
        } catch (e) { }
    }

    const loadProjects = async () => {
        if (!isSupabaseConfigured) {
            setProjects([
                { id: 'accredipro', name: 'AccrediPro', icon: '🎓', color: '#d4af37' },
                { id: 'metrix', name: 'Metrix', icon: '📊', color: '#3b82f6' },
                { id: 'olympus', name: 'Olympus', icon: '🏛️', color: '#8b5cf6' },
            ])
            return
        }
        try {
            const { data } = await supabase
                .from('projects')
                .select('id, name, icon, color')
                .order('created_at', { ascending: true })
            if (data) setProjects(data)
        } catch (e) { }
    }

    // Auto-save debounced
    const saveNote = useCallback(async (note) => {
        if (!note) return
        setSaving(true)

        try {
            if (isSupabaseConfigured) {
                const { error } = await supabase
                    .from('notes')
                    .upsert({
                        id: note.id,
                        title: note.title,
                        content: note.content,
                        pinned: note.pinned,
                        category: note.category || 'general',
                        shared: note.shared || false,
                        department_id: note.department_id || null,
                        author: note.author || currentUser,
                        updated_at: new Date().toISOString()
                    })
                if (error && error.code === '42P01') {
                    saveToLocalStorage(notes)
                }
            } else {
                saveToLocalStorage(notes)
            }
            setLastSaved(new Date())
        } catch (e) {
            saveToLocalStorage(notes)
        }

        setSaving(false)
    }, [notes, currentUser])

    const saveToLocalStorage = (notesData) => {
        localStorage.setItem('olympus_notes', JSON.stringify(notesData))
    }

    const loadNotes = async () => {
        try {
            if (isSupabaseConfigured) {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*')
                    .order('pinned', { ascending: false })
                    .order('updated_at', { ascending: false })

                if (data && !error) {
                    setNotes(data)
                    if (data.length > 0) setSelectedNote(data[0])
                    return
                }
            }
        } catch (e) { }

        // Fallback to localStorage with sample data
        const stored = localStorage.getItem('olympus_notes')
        if (stored) {
            const parsed = JSON.parse(stored)
            setNotes(parsed)
            if (parsed.length > 0) setSelectedNote(parsed[0])
        } else {
            // Sample team notes
            const sampleNotes = [
                {
                    id: 'sample_1',
                    title: '📞 Inbound Call Opening Script',
                    content: `# Inbound Call Opening Script

**Step 1: Warm Greeting**
"Hey [Name], thanks for calling! This is [Your Name] from AccrediPro. How can I help you today?"

**Step 2: Active Listening**
- Let them explain their situation fully
- Take notes on key pain points
- Don't interrupt

**Step 3: Qualify**
- "What got you interested in certification?"
- "What's your timeline for getting certified?"
- "Have you looked at other programs?"

**Step 4: Transition**
"That's great! Let me explain how we can help..."`,
                    pinned: true,
                    category: 'script',
                    shared: true,
                    department_id: '1',
                    author: 'Sarah',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'sample_2',
                    title: '📧 Refund Response Template',
                    content: `# Refund Response Template

**Subject:** Re: Your Refund Request - [Ticket #]

Hi [Name],

Thank you for reaching out. I completely understand how you feel.

Before we process your refund, I want to make sure we've done everything we can to help you succeed. Our records show you've completed [X]% of the program.

Would you be open to a quick 10-minute call with one of our success coaches? Many students who felt the same way found breakthroughs after this call.

If you'd prefer to proceed with the refund, I'll process it immediately - no questions asked.

Let me know what works best for you!

Best,
[Your Name]`,
                    pinned: false,
                    category: 'template',
                    shared: true,
                    department_id: '1',
                    author: 'Marco',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'sample_3',
                    title: '📚 Dispute Resolution Process',
                    content: `# Dispute Resolution Process

## When a Dispute Comes In

1. **Check Evidence Builder** - Generate all available evidence immediately
2. **Review User Activity** - Look for course progress, login history
3. **Prepare Response** - Use the legal PDF template
4. **Submit within 24h** - Time is critical

## Key Evidence to Include
- Login timestamps
- Course progress percentage
- Video watch time
- Download history
- Support ticket history

## Escalation
If dispute amount > $500, escalate to Marco immediately.`,
                    pinned: false,
                    category: 'knowledge',
                    shared: true,
                    department_id: '1',
                    author: 'Team',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'sample_4',
                    title: '🎯 Top Performing Audiences Q1',
                    content: `# Top Performing Audiences - Q1 2026

## Winners
1. **Healthcare Workers Broad** - CPL $4.20, ROAS 3.2x
2. **Certification Authority** - CPL $5.10, ROAS 2.8x
3. **Income Stories** - CPL $5.80, ROAS 2.5x

## Underperformers
- Wellness Interest - Turn off after $100 spend
- Age 55+ Segment - Low engagement

## Scaling Plan
- Increase Healthcare Workers budget by 20%
- Test new angles for Certification Authority`,
                    pinned: true,
                    category: 'knowledge',
                    shared: true,
                    department_id: '2',
                    author: 'Marco',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]
            setNotes(sampleNotes)
            setSelectedNote(sampleNotes[0])
            saveToLocalStorage(sampleNotes)
        }
    }

    const [isCreating, setIsCreating] = useState(false)

    const createNote = async () => {
        if (isCreating) return
        setIsCreating(true)

        const newNote = {
            id: `note_${Date.now()}`,
            title: 'New Note',
            content: '',
            pinned: false,
            category: activeCategory === 'all' ? 'general' : activeCategory,
            shared: true,
            department_id: selectedDepartment || null,
            project_id: selectedProject || null,
            author: currentUser,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const updated = [newNote, ...notes]
        setNotes(updated)
        setSelectedNote(newNote)
        saveToLocalStorage(updated)

        if (isSupabaseConfigured) {
            try {
                await supabase.from('notes').insert(newNote)
            } catch (e) { }
        }

        setIsCreating(false)
    }

    const deleteNote = async (noteId) => {
        const updated = notes.filter(n => n.id !== noteId)
        setNotes(updated)
        saveToLocalStorage(updated)

        if (selectedNote?.id === noteId) {
            setSelectedNote(updated[0] || null)
        }

        if (isSupabaseConfigured) {
            try {
                await supabase.from('notes').delete().eq('id', noteId)
            } catch (e) { }
        }
    }

    const updateNote = (field, value) => {
        if (!selectedNote) return

        const updated = {
            ...selectedNote,
            [field]: value,
            updated_at: new Date().toISOString()
        }

        setSelectedNote(updated)
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))

        // Debounced save - save after 1 second of no typing
        clearTimeout(window.noteSaveTimeout)
        window.noteSaveTimeout = setTimeout(() => {
            saveNote(updated)
            saveToLocalStorage(notes.map(n => n.id === updated.id ? updated : n))
        }, 1000)
    }

    const togglePin = () => {
        if (!selectedNote) return
        updateNote('pinned', !selectedNote.pinned)
    }

    const toggleShared = () => {
        if (!selectedNote) return
        updateNote('shared', !selectedNote.shared)
    }

    // Filter notes by category, department, project, and search
    const filteredNotes = notes.filter(n => {
        // Category filter
        if (activeCategory !== 'all' && n.category !== activeCategory) return false

        // Department filter
        if (selectedDepartment && n.department_id !== selectedDepartment) return false

        // Project filter
        if (selectedProject && n.project_id !== selectedProject) return false

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return n.title.toLowerCase().includes(query) ||
                n.content.toLowerCase().includes(query)
        }
        return true
    })

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date

        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

        return date.toLocaleDateString()
    }

    const getPreview = (content) => {
        if (!content) return 'No additional text'
        const stripped = content.replace(/[#*_\n]/g, ' ').trim()
        return stripped.length > 60 ? stripped.slice(0, 60) + '...' : stripped || 'No additional text'
    }

    const getCategoryInfo = (categoryId) => {
        return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
    }

    const getDepartmentName = (deptId) => {
        const dept = departments.find(d => d.id === deptId)
        return dept?.name || ''
    }

    return (
        <div className="notes-container">
            {/* Sidebar - Notes List */}
            <div className="notes-sidebar">
                <div className="notes-sidebar-header">
                    <h2><StickyNote size={20} /> Team Notes</h2>
                    <button className="new-note-btn" onClick={createNote}>
                        <Plus size={18} />
                    </button>
                </div>

                {/* Project Folders */}
                {projects.length > 0 && (
                    <div className="project-folders">
                        <button
                            className={`project-folder ${selectedProject === '' ? 'active' : ''}`}
                            onClick={() => setSelectedProject('')}
                        >
                            <Folder size={14} />
                            <span>All Projects</span>
                        </button>
                        {projects.map(p => (
                            <button
                                key={p.id}
                                className={`project-folder ${selectedProject === p.id ? 'active' : ''}`}
                                onClick={() => setSelectedProject(p.id)}
                                style={{ '--folder-color': p.color }}
                            >
                                <span className="folder-icon">{p.icon}</span>
                                <span>{p.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Category Tabs */}
                <div className="category-tabs">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{ '--cat-color': cat.color }}
                        >
                            <cat.icon size={14} />
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Department Filter */}
                <div className="department-filter">
                    <FolderOpen size={14} />
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div className="notes-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="notes-list">
                    {filteredNotes.length === 0 ? (
                        <div className="no-notes">
                            <StickyNote size={32} />
                            <p>No notes found</p>
                            <button onClick={createNote}>Create a note</button>
                        </div>
                    ) : (
                        filteredNotes.map(note => {
                            const catInfo = getCategoryInfo(note.category)
                            return (
                                <div
                                    key={note.id}
                                    className={`note-item ${selectedNote?.id === note.id ? 'active' : ''} ${note.pinned ? 'pinned' : ''}`}
                                    onClick={() => setSelectedNote(note)}
                                >
                                    <div className="note-item-header">
                                        <span className="note-title">{note.title || 'Untitled'}</span>
                                        <div className="note-badges">
                                            {note.pinned && <Pin size={12} className="pin-icon" />}
                                            {note.shared && <Users size={12} className="shared-icon" />}
                                        </div>
                                    </div>
                                    <div className="note-preview">{getPreview(note.content)}</div>
                                    <div className="note-meta-row">
                                        <span className="note-category-badge" style={{ background: catInfo.color }}>
                                            {catInfo.label}
                                        </span>
                                        {note.author && (
                                            <span className="note-author">
                                                <User size={10} /> {note.author}
                                            </span>
                                        )}
                                        <span className="note-date">
                                            <Clock size={10} />
                                            {formatDate(note.updated_at)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="notes-count">
                    {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </div>
            </div>

            {/* Main Content - Note Editor */}
            <div className="notes-editor">
                {selectedNote ? (
                    <>
                        <div className="editor-toolbar">
                            <div className="toolbar-left">
                                <button
                                    className={`toolbar-btn ${selectedNote.pinned ? 'active' : ''}`}
                                    onClick={togglePin}
                                    title={selectedNote.pinned ? 'Unpin note' : 'Pin note'}
                                >
                                    {selectedNote.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                </button>
                                <button
                                    className={`toolbar-btn ${selectedNote.shared ? 'active' : ''}`}
                                    onClick={toggleShared}
                                    title={selectedNote.shared ? 'Make private' : 'Share with team'}
                                >
                                    {selectedNote.shared ? <Users size={16} /> : <User size={16} />}
                                </button>

                                {/* Category Selector */}
                                <select
                                    className="category-select"
                                    value={selectedNote.category || 'general'}
                                    onChange={(e) => updateNote('category', e.target.value)}
                                >
                                    <option value="general">📋 General</option>
                                    <option value="script">📞 Script</option>
                                    <option value="template">📝 Template</option>
                                    <option value="knowledge">📚 Knowledge</option>
                                </select>

                                {/* Department Selector */}
                                <select
                                    className="department-select"
                                    value={selectedNote.department_id || ''}
                                    onChange={(e) => updateNote('department_id', e.target.value)}
                                >
                                    <option value="">No Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="toolbar-right">
                                {saving && <span className="save-status saving">Saving...</span>}
                                {!saving && lastSaved && (
                                    <span className="save-status saved">
                                        <Check size={12} /> Saved
                                    </span>
                                )}
                                <button
                                    className="toolbar-btn danger"
                                    onClick={() => deleteNote(selectedNote.id)}
                                    title="Delete note"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="editor-content">
                            <input
                                type="text"
                                className="note-title-input"
                                placeholder="Note title..."
                                value={selectedNote.title}
                                onChange={(e) => updateNote('title', e.target.value)}
                            />
                            <div className="note-meta">
                                <span className="meta-item">
                                    <User size={12} />
                                    {selectedNote.author || currentUser}
                                </span>
                                <span className="meta-item">
                                    <Clock size={12} />
                                    Last edited {formatDate(selectedNote.updated_at)}
                                </span>
                                {selectedNote.department_id && (
                                    <span className="meta-item">
                                        <FolderOpen size={12} />
                                        {getDepartmentName(selectedNote.department_id)}
                                    </span>
                                )}
                            </div>
                            <textarea
                                className="note-content-input"
                                placeholder="Start writing your note..."
                                value={selectedNote.content}
                                onChange={(e) => updateNote('content', e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="no-note-selected">
                        <StickyNote size={48} />
                        <h3>Select a note</h3>
                        <p>Choose a note from the sidebar or create a new one</p>
                        <button className="btn btn-primary" onClick={createNote}>
                            <Plus size={18} />
                            Create Note
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
