import { useState, useEffect, useCallback } from 'react'
import {
    Plus,
    Trash2,
    Search,
    StickyNote,
    Clock,
    Pin,
    PinOff,
    Check
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Notes.css'

export default function Notes() {
    const [notes, setNotes] = useState([])
    const [selectedNote, setSelectedNote] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)

    useEffect(() => {
        loadNotes()
    }, [])

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
                        updated_at: new Date().toISOString()
                    })
                if (error && error.code === '42P01') {
                    // Table doesn't exist, fallback to localStorage
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
    }, [notes])

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

        // Fallback to localStorage
        const stored = localStorage.getItem('olympus_notes')
        if (stored) {
            const parsed = JSON.parse(stored)
            setNotes(parsed)
            if (parsed.length > 0) setSelectedNote(parsed[0])
        }
    }

    const [isCreating, setIsCreating] = useState(false)

    const createNote = async () => {
        if (isCreating) return // Prevent double-click
        setIsCreating(true)

        const newNote = {
            id: `note_${Date.now()}`,
            title: 'New Note',
            content: '',
            pinned: false,
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

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

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

    return (
        <div className="notes-container">
            {/* Sidebar - Notes List */}
            <div className="notes-sidebar">
                <div className="notes-sidebar-header">
                    <div className="notes-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="new-note-btn" onClick={createNote}>
                        <Plus size={18} />
                    </button>
                </div>

                <div className="notes-list">
                    {filteredNotes.length === 0 ? (
                        <div className="no-notes">
                            <StickyNote size={32} />
                            <p>No notes yet</p>
                            <button onClick={createNote}>Create your first note</button>
                        </div>
                    ) : (
                        filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''} ${note.pinned ? 'pinned' : ''}`}
                                onClick={() => setSelectedNote(note)}
                            >
                                <div className="note-item-header">
                                    <span className="note-title">{note.title || 'Untitled'}</span>
                                    {note.pinned && <Pin size={12} className="pin-icon" />}
                                </div>
                                <div className="note-preview">{getPreview(note.content)}</div>
                                <div className="note-date">
                                    <Clock size={10} />
                                    {formatDate(note.updated_at)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="notes-count">
                    {notes.length} {notes.length === 1 ? 'note' : 'notes'}
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
                                <Clock size={12} />
                                <span>Last edited {formatDate(selectedNote.updated_at)}</span>
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
