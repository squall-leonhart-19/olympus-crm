import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Send, MessageSquare } from 'lucide-react'
import './TaskComments.css'

export default function TaskComments({ taskId, currentUser }) {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (taskId) {
            loadComments()
        }
    }, [taskId])

    const loadComments = async () => {
        if (!isSupabaseConfigured || !taskId) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('task_comments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true })

            if (data) {
                setComments(data)
            }
        } catch (e) {
            console.error('Error loading comments:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || submitting) return

        setSubmitting(true)

        const comment = {
            task_id: taskId,
            user_name: currentUser || 'Anonymous',
            content: newComment.trim(),
            created_at: new Date().toISOString()
        }

        // Optimistic update
        setComments(prev => [...prev, { ...comment, id: Date.now() }])
        setNewComment('')

        if (isSupabaseConfigured) {
            const { data, error } = await supabase
                .from('task_comments')
                .insert(comment)
                .select()
                .single()

            if (data) {
                // Replace optimistic with real
                setComments(prev => prev.map(c =>
                    c.id === Date.now() ? data : c
                ))
            }
        }

        setSubmitting(false)
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="task-comments">
            <div className="comments-header">
                <MessageSquare size={16} />
                <span>Comments ({comments.length})</span>
            </div>

            <div className="comments-list">
                {loading ? (
                    <div className="comments-loading">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="no-comments">No comments yet. Be the first!</div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="comment">
                            <div className="comment-avatar">
                                {comment.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="comment-body">
                                <div className="comment-header">
                                    <span className="comment-author">{comment.user_name}</span>
                                    <span className="comment-time">{formatTime(comment.created_at)}</span>
                                </div>
                                <div className="comment-content">{comment.content}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form className="comment-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="input comment-input"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                    type="submit"
                    className="btn btn-primary comment-submit"
                    disabled={!newComment.trim() || submitting}
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    )
}
