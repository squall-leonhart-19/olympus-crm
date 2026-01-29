import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import DealModal from '../components/pipeline/DealModal'
import { DollarSign, Plus, TrendingUp, Target } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Pipeline.css'

const STAGES = [
    { id: 'lead', label: 'Lead', color: '#6b7280', emoji: '📥' },
    { id: 'booked', label: 'Call Booked', color: '#3b82f6', emoji: '📞' },
    { id: 'taken', label: 'Call Taken', color: '#f59e0b', emoji: '✅' },
    { id: 'proposal', label: 'Proposal', color: 'var(--gold-primary)', emoji: '📄' },
    { id: 'closed_won', label: 'Closed Won', color: '#22c55e', emoji: '🎉' },
    { id: 'closed_lost', label: 'Lost', color: '#ef4444', emoji: '❌' },
]

export default function Pipeline() {
    const [deals, setDeals] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDeal, setEditingDeal] = useState(null)
    const [draggedDeal, setDraggedDeal] = useState(null)

    useEffect(() => {
        loadDeals()
    }, [])

    const loadDeals = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        try {
            const { data } = await supabase
                .from('deals')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                setDeals(data.map(d => ({
                    id: d.id,
                    title: d.title,
                    value: parseFloat(d.value) || 0,
                    stage: d.stage || 'lead',
                    clientName: d.client_name,
                    clientEmail: d.client_email,
                    source: d.source,
                    assignedTo: d.assigned_to,
                    notes: d.notes
                })))
            }
        } catch (e) {
            console.error('Error loading deals:', e)
        }
        setLoading(false)
    }

    const getDealsByStage = (stage) => deals.filter(d => d.stage === stage)
    const getStageValue = (stage) => getDealsByStage(stage).reduce((sum, d) => sum + d.value, 0)

    const totalPipeline = deals
        .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
        .reduce((sum, d) => sum + d.value, 0)

    const totalWon = deals
        .filter(d => d.stage === 'closed_won')
        .reduce((sum, d) => sum + d.value, 0)

    const handleDragStart = (e, deal) => {
        setDraggedDeal(deal)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e, newStage) => {
        e.preventDefault()
        if (draggedDeal && draggedDeal.stage !== newStage) {
            // Update locally first
            setDeals(prev => prev.map(d =>
                d.id === draggedDeal.id ? { ...d, stage: newStage } : d
            ))

            // Update in Supabase
            if (isSupabaseConfigured) {
                await supabase
                    .from('deals')
                    .update({ stage: newStage })
                    .eq('id', draggedDeal.id)
            }
        }
        setDraggedDeal(null)
    }

    const handleAddDeal = () => {
        setEditingDeal(null)
        setIsModalOpen(true)
    }

    const handleEditDeal = (deal) => {
        setEditingDeal(deal)
        setIsModalOpen(true)
    }

    const handleSaveDeal = async (dealData) => {
        if (editingDeal) {
            // Update existing
            setDeals(prev => prev.map(d => d.id === editingDeal.id ? { ...d, ...dealData } : d))

            if (isSupabaseConfigured) {
                await supabase
                    .from('deals')
                    .update({
                        title: dealData.title,
                        value: dealData.value,
                        stage: dealData.stage,
                        client_name: dealData.clientName,
                        client_email: dealData.clientEmail,
                        source: dealData.source,
                        assigned_to: dealData.assignedTo,
                        notes: dealData.notes
                    })
                    .eq('id', editingDeal.id)
            }
        } else {
            // Create new
            const newDeal = { ...dealData, id: Date.now().toString() }

            if (isSupabaseConfigured) {
                const { data } = await supabase
                    .from('deals')
                    .insert({
                        title: dealData.title,
                        value: dealData.value,
                        stage: dealData.stage || 'lead',
                        client_name: dealData.clientName,
                        client_email: dealData.clientEmail,
                        source: dealData.source,
                        assigned_to: dealData.assignedTo,
                        notes: dealData.notes
                    })
                    .select()
                    .single()

                if (data) {
                    newDeal.id = data.id
                }
            }

            setDeals(prev => [newDeal, ...prev])
        }
        setIsModalOpen(false)
        setEditingDeal(null)
    }

    const handleDeleteDeal = async (dealId) => {
        setDeals(prev => prev.filter(d => d.id !== dealId))

        if (isSupabaseConfigured) {
            await supabase.from('deals').delete().eq('id', dealId)
        }

        setIsModalOpen(false)
        setEditingDeal(null)
    }

    if (loading) {
        return (
            <>
                <Header title="Pipeline" />
                <div className="page-content">
                    <div className="loading-state">Loading deals...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Pipeline" />
            <div className="page-content">
                <div className="pipeline-toolbar">
                    <button className="btn btn-primary" onClick={handleAddDeal}>
                        <Plus size={18} />
                        New Deal
                    </button>
                    <div className="pipeline-summary">
                        <div className="summary-stat">
                            <Target size={16} />
                            <span>Pipeline: <strong>${totalPipeline.toLocaleString()}</strong></span>
                        </div>
                        <div className="summary-stat won">
                            <TrendingUp size={16} />
                            <span>Won: <strong>${totalWon.toLocaleString()}</strong></span>
                        </div>
                    </div>
                </div>

                {deals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <h3>No deals yet</h3>
                        <p>Add your first deal to start tracking your sales pipeline</p>
                        <button className="btn btn-primary" onClick={handleAddDeal}>
                            <Plus size={18} />
                            Add First Deal
                        </button>
                    </div>
                ) : (
                    <div className="pipeline-board">
                        {STAGES.map(stage => (
                            <div
                                key={stage.id}
                                className={`pipeline-column ${stage.id === 'closed_lost' ? 'lost-column' : ''}`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                <div className="stage-header">
                                    <span className="stage-emoji">{stage.emoji}</span>
                                    <span className="stage-title">{stage.label}</span>
                                    <span className="stage-count">{getDealsByStage(stage.id).length}</span>
                                </div>
                                <div className="stage-value">
                                    <DollarSign size={14} />
                                    ${getStageValue(stage.id).toLocaleString()}
                                </div>
                                <div className="stage-deals">
                                    {getDealsByStage(stage.id).length === 0 ? (
                                        <div className="stage-empty">Drop deals here</div>
                                    ) : (
                                        getDealsByStage(stage.id).map(deal => (
                                            <div
                                                key={deal.id}
                                                className="deal-card"
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, deal)}
                                                onClick={() => handleEditDeal(deal)}
                                            >
                                                <div className="deal-title">{deal.title}</div>
                                                <div className="deal-value">${deal.value.toLocaleString()}</div>
                                                <div className="deal-meta">
                                                    {deal.source && <span className="deal-source">{deal.source}</span>}
                                                    {deal.assignedTo && (
                                                        <span className="deal-assignee">{deal.assignedTo}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <DealModal
                    deal={editingDeal}
                    onSave={handleSaveDeal}
                    onDelete={editingDeal ? () => handleDeleteDeal(editingDeal.id) : null}
                    onClose={() => { setIsModalOpen(false); setEditingDeal(null) }}
                />
            )}
        </>
    )
}
