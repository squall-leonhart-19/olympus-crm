import Header from '../components/layout/Header'
import { Trophy, Target, Clock, TrendingUp } from 'lucide-react'
import './Team.css'

const TEAM_MEMBERS = [
    {
        id: '1',
        name: 'Marco',
        role: 'Sales Lead',
        tasksCompleted: 14,
        onTimeRate: 92,
        streak: 7,
        overdue: 1
    },
    {
        id: '2',
        name: 'Giulia',
        role: 'Account Manager',
        tasksCompleted: 12,
        onTimeRate: 100,
        streak: 12,
        overdue: 0
    },
    {
        id: '3',
        name: 'Alex',
        role: 'Support',
        tasksCompleted: 8,
        onTimeRate: 88,
        streak: 3,
        overdue: 2
    },
]

export default function Team() {
    const sortedByTasks = [...TEAM_MEMBERS].sort((a, b) => b.tasksCompleted - a.tasksCompleted)

    return (
        <>
            <Header title="Team" />
            <div className="page-content">
                <div className="team-section">
                    <h3>
                        <Trophy size={20} className="section-icon" />
                        Leaderboard
                    </h3>
                    <div className="leaderboard">
                        {sortedByTasks.map((member, index) => (
                            <div key={member.id} className={`leaderboard-item ${index === 0 ? 'first' : ''}`}>
                                <div className="rank">#{index + 1}</div>
                                <div className="member-info">
                                    <div className="member-avatar">{member.name.charAt(0)}</div>
                                    <div>
                                        <div className="member-name">{member.name}</div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                </div>
                                <div className="member-stat">
                                    <span className="stat-num">{member.tasksCompleted}</span>
                                    <span className="stat-label">tasks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="team-section">
                    <h3>Performance Cards</h3>
                    <div className="performance-grid">
                        {TEAM_MEMBERS.map(member => (
                            <div key={member.id} className="performance-card">
                                <div className="perf-header">
                                    <div className="member-avatar large">{member.name.charAt(0)}</div>
                                    <div>
                                        <div className="member-name">{member.name}</div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                </div>
                                <div className="perf-stats">
                                    <div className="perf-stat">
                                        <Target size={16} />
                                        <div>
                                            <span className="perf-value">{member.tasksCompleted}</span>
                                            <span className="perf-label">Completed</span>
                                        </div>
                                    </div>
                                    <div className="perf-stat">
                                        <Clock size={16} />
                                        <div>
                                            <span className="perf-value">{member.onTimeRate}%</span>
                                            <span className="perf-label">On-Time</span>
                                        </div>
                                    </div>
                                    <div className="perf-stat">
                                        <TrendingUp size={16} />
                                        <div>
                                            <span className="perf-value">{member.streak}d</span>
                                            <span className="perf-label">Streak</span>
                                        </div>
                                    </div>
                                </div>
                                {member.overdue > 0 && (
                                    <div className="perf-warning">
                                        ⚠️ {member.overdue} overdue task{member.overdue > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
