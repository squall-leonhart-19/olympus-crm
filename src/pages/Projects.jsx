import { useState, useEffect } from 'react'
import { Plus, FolderOpen, Settings, ChevronRight, MoreVertical, Trash2, Edit2, Check, X } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Projects.css'

const DEFAULT_COLORS = ['#d4af37', '#8b5cf6', '#06b6d4', '#f43f5e', '#22c55e', '#f59e0b', '#3b82f6']
const DEFAULT_ICONS = ['📁', '🎓', '💻', '📊', '🚀', '💡', '🎯', '📱', '🏢', '💰']

export default function Projects() {
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showNewProject, setShowNewProject] = useState(false)
    const [showNewDepartment, setShowNewDepartment] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [newProject, setNewProject] = useState({ name: '', description: '', color: '#d4af37', icon: '📁' })
    const [newDepartment, setNewDepartment] = useState({ name: '', color: '' })

    useEffect(() => {
        loadProjects()
    }, [])

    useEffect(() => {
        if (selectedProject) {
            loadDepartments(selectedProject.id)
        }
    }, [selectedProject])

    const loadProjects = async () => {
        if (!isSupabaseConfigured) {
            setProjects([
                { id: '1', name: 'AccrediPro', description: 'Main education platform', color: '#d4af37', icon: '🎓' },
                { id: '2', name: 'Software', description: 'Internal tools', color: '#8b5cf6', icon: '💻' },
            ])
            setLoading(false)
            return
        }

        try {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: true })
            if (data) setProjects(data)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const loadDepartments = async (projectId) => {
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
                .eq('project_id', projectId)
                .order('sort_order', { ascending: true })
            if (data) setDepartments(data)
        } catch (e) { console.error(e) }
    }

    const createProject = async () => {
        if (!newProject.name.trim()) return

        if (isSupabaseConfigured) {
            const { data } = await supabase
                .from('projects')
                .insert(newProject)
                .select()
                .single()
            if (data) setProjects(prev => [...prev, data])
        } else {
            setProjects(prev => [...prev, { ...newProject, id: Date.now().toString() }])
        }

        setNewProject({ name: '', description: '', color: '#d4af37', icon: '📁' })
        setShowNewProject(false)
    }

    const createDepartment = async () => {
        if (!newDepartment.name.trim() || !selectedProject) return

        const departmentData = {
            ...newDepartment,
            project_id: selectedProject.id,
            sort_order: departments.length
        }

        if (isSupabaseConfigured) {
            const { data } = await supabase
                .from('project_sections')
                .insert(departmentData)
                .select()
                .single()
            if (data) setDepartments(prev => [...prev, data])
        } else {
            setDepartments(prev => [...prev, { ...departmentData, id: Date.now().toString() }])
        }

        setNewDepartment({ name: '', color: '' })
        setShowNewDepartment(false)
    }

    const deleteProject = async (projectId) => {
        if (!confirm('Delete this project and all its sections?')) return

        if (isSupabaseConfigured) {
            await supabase.from('projects').delete().eq('id', projectId)
        }

        setProjects(prev => prev.filter(p => p.id !== projectId))
        if (selectedProject?.id === projectId) {
            setSelectedProject(null)
            setDepartments([])
        }
    }

    const deleteDepartment = async (deptId) => {
        if (!confirm('Delete this department?')) return

        if (isSupabaseConfigured) {
            await supabase.from('project_sections').delete().eq('id', deptId)
        }

        setDepartments(prev => prev.filter(d => d.id !== deptId))
    }

    if (loading) {
        return (
            <div className="projects-loading">
                <div className="loading-spinner" />
                <span>Loading projects...</span>
            </div>
        )
    }

    return (
        <div className="projects-container">
            {/* Projects Sidebar */}
            <div className="projects-sidebar">
                <div className="sidebar-header">
                    <h2><FolderOpen size={20} /> Projects</h2>
                    <button className="add-project-btn" onClick={() => setShowNewProject(true)}>
                        <Plus size={18} />
                    </button>
                </div>

                <div className="projects-list">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                            onClick={() => setSelectedProject(project)}
                        >
                            <span className="project-icon" style={{ background: project.color }}>
                                {project.icon}
                            </span>
                            <div className="project-info">
                                <span className="project-name">{project.name}</span>
                                {project.description && (
                                    <span className="project-desc">{project.description}</span>
                                )}
                            </div>
                            <ChevronRight size={16} className="project-arrow" />
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="empty-projects">
                            <p>No projects yet</p>
                            <button onClick={() => setShowNewProject(true)}>Create first project</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Details */}
            <div className="project-details">
                {selectedProject ? (
                    <>
                        <div className="project-header">
                            <div className="project-title-row">
                                <span className="project-icon-large" style={{ background: selectedProject.color }}>
                                    {selectedProject.icon}
                                </span>
                                <div>
                                    <h1>{selectedProject.name}</h1>
                                    {selectedProject.description && <p>{selectedProject.description}</p>}
                                </div>
                            </div>
                            <div className="project-actions">
                                <button className="icon-btn" onClick={() => deleteProject(selectedProject.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="sections-area">
                            <div className="sections-header">
                                <h3>Departments</h3>
                                <button className="add-section-btn" onClick={() => setShowNewDepartment(true)}>
                                    <Plus size={16} /> Add Department
                                </button>
                            </div>

                            <div className="sections-grid">
                                {departments.map(dept => (
                                    <div key={dept.id} className="section-card">
                                        <div
                                            className="section-color-bar"
                                            style={{ background: dept.color || selectedProject.color }}
                                        />
                                        <div className="section-content">
                                            <span className="section-name">{dept.name}</span>
                                            <button
                                                className="section-delete"
                                                onClick={() => deleteDepartment(dept.id)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {departments.length === 0 && (
                                    <div className="empty-sections">
                                        <p>No departments yet. Add departments like "Customer Care", "Meta Ads", etc.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-project-selected">
                        <FolderOpen size={48} />
                        <h2>Select a Project</h2>
                        <p>Choose a project from the sidebar to view its departments and tasks</p>
                    </div>
                )}
            </div>

            {/* New Project Modal */}
            {showNewProject && (
                <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
                    <div className="project-modal" onClick={e => e.stopPropagation()}>
                        <h2>New Project</h2>

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={newProject.name}
                                onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Project name..."
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                value={newProject.description}
                                onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Optional description..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Icon</label>
                            <div className="icon-picker">
                                {DEFAULT_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={`icon-option ${newProject.icon === icon ? 'active' : ''}`}
                                        onClick={() => setNewProject(prev => ({ ...prev, icon }))}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Color</label>
                            <div className="color-picker">
                                {DEFAULT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-option ${newProject.color === color ? 'active' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => setNewProject(prev => ({ ...prev, color }))}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowNewProject(false)}>Cancel</button>
                            <button className="save-btn" onClick={createProject}>Create Project</button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Department Modal */}
            {showNewDepartment && (
                <div className="modal-overlay" onClick={() => setShowNewDepartment(false)}>
                    <div className="project-modal small" onClick={e => e.stopPropagation()}>
                        <h2>New Department</h2>

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={newDepartment.name}
                                onChange={e => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Customer Care, Meta Ads, Creatives..."
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Color (optional)</label>
                            <div className="color-picker">
                                {DEFAULT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-option ${newDepartment.color === color ? 'active' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => setNewDepartment(prev => ({ ...prev, color }))}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowNewDepartment(false)}>Cancel</button>
                            <button className="save-btn" onClick={createDepartment}>Add Department</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
