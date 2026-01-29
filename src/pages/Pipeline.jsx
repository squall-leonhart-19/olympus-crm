import { useState } from 'react'
import Header from '../components/layout/Header'
import DealModal from '../components/pipeline/DealModal'
import { DollarSign, Plus, TrendingUp, Phone, Target } from 'lucide-react'
import './Pipeline.css'

const INITIAL_DEALS = [
    { id: '1', title: 'FM Certification - Jennifer', value: 2997, stage: 'lead', clientName: 'Jennifer Wilson', clientEmail: 'jennifer@example.com', source: 'Facebook Ads', assignedTo: 'Marco' },
    { id: '2', title: 'Career Pathway - Michael', value: 997, stage: 'booked', clientName: 'Michael Brown', clientEmail: 'michael@example.com', source: 'Organic', assignedTo: 'Giulia' },
    { id: '3', title: 'FM Pro Bundle - Sarah', value: 4997, stage: 'taken', clientName: 'Sarah Davis', clientEmail: 'sarah@example.com', source: 'Referral', assignedTo: 'Marco' },
    { id: '4', title: 'FM Certification - David', value: 2997, stage: 'proposal', clientName: 'David Lee', clientEmail: 'david@example.com', source: 'Facebook Ads', assignedTo: 'Alex' },
    { id: '5', title: 'Holistic Health - Emma', value: 1497, stage: 'closed_won', clientName: 'Emma Johnson', clientEmail: 'emma@example.com', source: 'YouTube', assignedTo: 'Giulia' },
    { id: '6', title: 'Nutrition Basics - Tom', value: 497, stage: 'closed_lost', clientName: 'Tom Wilson', clientEmail: 'tom@example.com', source: 'Cold Outreach', assignedTo: 'Alex', notes: 'Price objection - will follow up later' },
]

const STAGES = [
    { id: 'lead', label: 'Lead', color: 'var(--text-muted)' },
    { id: 'booked', label: 'Call Booked', color: 'var(--info)' },
    { id: 'taken', label: 'Call Taken', color: 'var(--warning)' },
    { id: 'proposal', label: 'Proposal', color: 'var(--gold-primary)' },
    { id: 'closed_won', label: 'Closed Won', color: 'var(--success)' },
    { id: 'closed_lost', label: 'Lost', color: 'var(--danger)' },
]

export default function Pipeline() {
    const [deals, setDeals] = useState(INITIAL_DEALS)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDeal, setEditingDeal] = useState(null)
    const [draggedDeal, setDraggedDeal] = useState(null)

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

    const handleDrop = (e, newStage) => {
        e.preventDefault()
        if (draggedDeal && draggedDeal.stage !== newStage) {
            setDeals(prev => prev.map(d =>
                d.id === draggedDeal.id
                    ? { ...d, stage: newStage }
                    : d
            ))
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

    const handleSaveDeal = (dealData) => {
        if (editingDeal) {
            setDeals(prev => prev.map(d => d.id === editingDeal.id ? { ...d, ...dealData } : d))
        } else {
            const newDeal = { ...dealData, id: Date.now().toString() }
            setDeals(prev => [...prev, newDeal])
        }
        setIsModalOpen(false)
        setEditingDeal(null)
    }

    const handleDeleteDeal = (dealId) => {
        setDeals(prev => prev.filter(d => d.id !== dealId))
        setIsModalOpen(false)
        setEditingDeal(null)
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

                <div className="pipeline-board">
                    {STAGES.map(stage => (
                        <div
                            key={stage.id}
                            className={`pipeline-column ${stage.id === 'closed_lost' ? 'lost-column' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            <div className="stage-header">
                                <div className="stage-indicator" style={{ background: stage.color }} />
                                <span className="stage-title">{stage.label}</span>
                                <span className="stage-count">{getDealsByStage(stage.id).length}</span>
                            </div>
                            <div className="stage-value">
                                <DollarSign size={14} />
                                ${getStageValue(stage.id).toLocaleString()}
                            </div>
                            <div className="stage-deals">
                                {getDealsByStage(stage.id).map(deal => (
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
                                            <span className="deal-source">{deal.source}</span>
                                            {deal.assignedTo && (
                                                <span className="deal-assignee">{deal.assignedTo}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
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
