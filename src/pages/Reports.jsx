import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import {
    TrendingUp, TrendingDown, Phone, Users, DollarSign,
    Target, Calendar, ChevronLeft, ChevronRight, BarChart3,
    ArrowUpRight, ArrowDownRight, Flame, Award, Plus
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './Reports.css'

const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

const MetricCard = ({ icon: Icon, label, value, previousValue, format = 'number', size = 'normal' }) => {
    const change = previousValue !== undefined ? calculateChange(value, previousValue) : 0
    const isUp = change >= 0

    const formattedValue = format === 'currency'
        ? `$${value.toLocaleString()}`
        : format === 'percent'
            ? `${value}%`
            : value.toLocaleString()

    return (
        <div className={`kpi-card ${size}`}>
            <div className="kpi-icon">
                <Icon size={size === 'large' ? 28 : 24} />
            </div>
            <div className="kpi-content">
                <div className="kpi-value">{formattedValue}</div>
                <div className="kpi-label">{label}</div>
                {previousValue !== undefined && previousValue > 0 && (
                    <div className={`kpi-change ${isUp ? 'up' : 'down'}`}>
                        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(change)}% vs last week
                    </div>
                )}
            </div>
        </div>
    )
}

const RatioCard = ({ label, value, benchmark, icon: Icon }) => {
    const isGood = value >= benchmark
    return (
        <div className="ratio-card">
            <div className="ratio-header">
                <Icon size={18} />
                <span>{label}</span>
            </div>
            <div className={`ratio-value ${isGood ? 'good' : 'warning'}`}>
                {value}%
            </div>
            <div className="ratio-benchmark">
                Target: {benchmark}%
            </div>
        </div>
    )
}

export default function Reports() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [weeklyData, setWeeklyData] = useState({
        leads: 0, sets: 0, shows: 0, closes: 0, cashCollected: 0, avgDealSize: 0
    })
    const [lastWeekData, setLastWeekData] = useState({
        leads: 0, sets: 0, shows: 0, closes: 0, cashCollected: 0, avgDealSize: 0
    })
    const [dailyData, setDailyData] = useState([])
    const [repPerformance, setRepPerformance] = useState([])

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

    useEffect(() => {
        loadKPIData()
    }, [])

    const loadKPIData = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        try {
            // Load KPI daily logs for this week
            const startStr = startOfWeek.toISOString().split('T')[0]
            const endStr = endOfWeek.toISOString().split('T')[0]

            const { data: kpiLogs } = await supabase
                .from('kpi_daily_logs')
                .select('*')
                .gte('log_date', startStr)
                .lte('log_date', endStr)
                .order('log_date', { ascending: true })

            if (kpiLogs && kpiLogs.length > 0) {
                const totals = kpiLogs.reduce((acc, log) => ({
                    leads: acc.leads + (log.leads || 0),
                    sets: acc.sets + (log.sets || 0),
                    shows: acc.shows + (log.shows || 0),
                    closes: acc.closes + (log.closes || 0),
                    cashCollected: acc.cashCollected + parseFloat(log.cash_collected || 0)
                }), { leads: 0, sets: 0, shows: 0, closes: 0, cashCollected: 0 })

                totals.avgDealSize = totals.closes > 0 ? Math.round(totals.cashCollected / totals.closes) : 0
                setWeeklyData(totals)

                setDailyData(kpiLogs.map(log => ({
                    date: log.log_date,
                    day: new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' }),
                    leads: log.leads || 0,
                    sets: log.sets || 0,
                    shows: log.shows || 0,
                    closes: log.closes || 0,
                    cash: parseFloat(log.cash_collected || 0)
                })))
            }

            // Load rep performance
            const { data: reps } = await supabase
                .from('rep_performance')
                .select('*')
                .gte('log_date', startStr)
                .lte('log_date', endStr)

            if (reps && reps.length > 0) {
                // Aggregate by rep
                const repMap = new Map()
                reps.forEach(r => {
                    const existing = repMap.get(r.rep_name) || { sets: 0, shows: 0, closes: 0, cash: 0 }
                    repMap.set(r.rep_name, {
                        name: r.rep_name,
                        sets: existing.sets + (r.sets || 0),
                        shows: existing.shows + (r.shows || 0),
                        closes: existing.closes + (r.closes || 0),
                        cash: existing.cash + parseFloat(r.cash_collected || 0)
                    })
                })

                const repArray = Array.from(repMap.values()).map(rep => ({
                    ...rep,
                    showRate: rep.sets > 0 ? Math.round((rep.shows / rep.sets) * 100) : 0,
                    closeRate: rep.shows > 0 ? Math.round((rep.closes / rep.shows) * 100) : 0
                }))
                setRepPerformance(repArray)
            }

        } catch (error) {
            console.error('Error loading KPI data:', error)
        }

        setLoading(false)
    }

    const setRate = weeklyData.leads > 0 ? Math.round((weeklyData.sets / weeklyData.leads) * 100) : 0
    const showRate = weeklyData.sets > 0 ? Math.round((weeklyData.shows / weeklyData.sets) * 100) : 0
    const closeRate = weeklyData.shows > 0 ? Math.round((weeklyData.closes / weeklyData.shows) * 100) : 0

    const isEmpty = weeklyData.leads === 0 && weeklyData.sets === 0 && dailyData.length === 0

    if (loading) {
        return (
            <>
                <Header title="KPI Dashboard" />
                <div className="page-content">
                    <div className="loading-state">Loading KPIs...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="KPI Dashboard" />
            <div className="page-content reports-page">
                {/* Week Selector */}
                <div className="week-selector">
                    <button className="btn btn-ghost"><ChevronLeft size={20} /></button>
                    <div className="current-week">
                        <Calendar size={18} />
                        <span>{weekLabel}</span>
                    </div>
                    <button className="btn btn-ghost"><ChevronRight size={20} /></button>
                </div>

                {isEmpty ? (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <h3>No KPI data yet</h3>
                        <p>Start logging your daily KPIs to see your performance metrics here.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
                            <Plus size={18} /> Log Today's KPIs
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Main KPIs */}
                        <section className="kpi-section">
                            <h2>📊 Weekly Scorecard</h2>
                            <div className="kpi-grid main-kpis">
                                <MetricCard
                                    icon={Users}
                                    label="Leads"
                                    value={weeklyData.leads}
                                    previousValue={lastWeekData.leads}
                                    size="large"
                                />
                                <MetricCard
                                    icon={Phone}
                                    label="Sets (Calls Booked)"
                                    value={weeklyData.sets}
                                    previousValue={lastWeekData.sets}
                                    size="large"
                                />
                                <MetricCard
                                    icon={Target}
                                    label="Shows (Calls Taken)"
                                    value={weeklyData.shows}
                                    previousValue={lastWeekData.shows}
                                    size="large"
                                />
                                <MetricCard
                                    icon={Award}
                                    label="Closes"
                                    value={weeklyData.closes}
                                    previousValue={lastWeekData.closes}
                                    size="large"
                                />
                                <MetricCard
                                    icon={DollarSign}
                                    label="Cash Collected"
                                    value={weeklyData.cashCollected}
                                    previousValue={lastWeekData.cashCollected}
                                    format="currency"
                                    size="large"
                                />
                                <MetricCard
                                    icon={BarChart3}
                                    label="Avg Deal Size"
                                    value={weeklyData.avgDealSize}
                                    previousValue={lastWeekData.avgDealSize}
                                    format="currency"
                                    size="large"
                                />
                            </div>
                        </section>

                        {/* Conversion Funnel */}
                        <section className="kpi-section">
                            <h2>🎯 Conversion Funnel</h2>
                            <div className="funnel-container">
                                <div className="funnel-visual">
                                    <div className="funnel-stage" style={{ width: '100%' }}>
                                        <span className="funnel-label">Leads</span>
                                        <span className="funnel-value">{weeklyData.leads}</span>
                                    </div>
                                    <div className="funnel-arrow">↓ {setRate}%</div>
                                    <div className="funnel-stage" style={{ width: '85%' }}>
                                        <span className="funnel-label">Sets</span>
                                        <span className="funnel-value">{weeklyData.sets}</span>
                                    </div>
                                    <div className="funnel-arrow">↓ {showRate}%</div>
                                    <div className="funnel-stage" style={{ width: '70%' }}>
                                        <span className="funnel-label">Shows</span>
                                        <span className="funnel-value">{weeklyData.shows}</span>
                                    </div>
                                    <div className="funnel-arrow">↓ {closeRate}%</div>
                                    <div className="funnel-stage closed" style={{ width: '50%' }}>
                                        <span className="funnel-label">Closes</span>
                                        <span className="funnel-value">{weeklyData.closes}</span>
                                    </div>
                                </div>
                                <div className="ratio-cards">
                                    <RatioCard icon={Phone} label="Set Rate" value={setRate} benchmark={60} />
                                    <RatioCard icon={Target} label="Show Rate" value={showRate} benchmark={75} />
                                    <RatioCard icon={Award} label="Close Rate" value={closeRate} benchmark={30} />
                                </div>
                            </div>
                        </section>

                        {/* Daily Breakdown */}
                        {dailyData.length > 0 && (
                            <section className="kpi-section">
                                <h2>📅 Daily Breakdown</h2>
                                <div className="daily-table-wrapper">
                                    <table className="daily-table">
                                        <thead>
                                            <tr>
                                                <th>Day</th>
                                                <th>Leads</th>
                                                <th>Sets</th>
                                                <th>Shows</th>
                                                <th>Closes</th>
                                                <th>Cash</th>
                                                <th>Show %</th>
                                                <th>Close %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dailyData.map((day, idx) => {
                                                const dayShowRate = day.sets > 0 ? Math.round((day.shows / day.sets) * 100) : 0
                                                const dayCloseRate = day.shows > 0 ? Math.round((day.closes / day.shows) * 100) : 0
                                                const isToday = day.date === today.toISOString().split('T')[0]
                                                return (
                                                    <tr key={idx} className={isToday ? 'today' : ''}>
                                                        <td>
                                                            <div className="day-cell">
                                                                <span className="day-name">{day.day}</span>
                                                                <span className="day-date">{day.date.slice(5)}</span>
                                                            </div>
                                                        </td>
                                                        <td>{day.leads}</td>
                                                        <td>{day.sets}</td>
                                                        <td>{day.shows}</td>
                                                        <td className="closes-cell">{day.closes}</td>
                                                        <td className="cash-cell">${day.cash.toLocaleString()}</td>
                                                        <td className={dayShowRate >= 75 ? 'good' : 'warning'}>{dayShowRate}%</td>
                                                        <td className={dayCloseRate >= 30 ? 'good' : 'warning'}>{dayCloseRate}%</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td><strong>TOTAL</strong></td>
                                                <td><strong>{dailyData.reduce((s, d) => s + d.leads, 0)}</strong></td>
                                                <td><strong>{dailyData.reduce((s, d) => s + d.sets, 0)}</strong></td>
                                                <td><strong>{dailyData.reduce((s, d) => s + d.shows, 0)}</strong></td>
                                                <td><strong>{dailyData.reduce((s, d) => s + d.closes, 0)}</strong></td>
                                                <td><strong>${dailyData.reduce((s, d) => s + d.cash, 0).toLocaleString()}</strong></td>
                                                <td><strong>{showRate}%</strong></td>
                                                <td><strong>{closeRate}%</strong></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* Rep Leaderboard */}
                        {repPerformance.length > 0 && (
                            <section className="kpi-section">
                                <h2>🏆 Rep Leaderboard</h2>
                                <div className="rep-grid">
                                    {repPerformance.sort((a, b) => b.cash - a.cash).map((rep, idx) => (
                                        <div key={rep.name} className={`rep-card ${idx === 0 ? 'top-performer' : ''}`}>
                                            {idx === 0 && <div className="top-badge">🥇 TOP CLOSER</div>}
                                            <div className="rep-header">
                                                <div className="rep-avatar">{rep.name.charAt(0)}</div>
                                                <div>
                                                    <div className="rep-name">{rep.name}</div>
                                                </div>
                                            </div>
                                            <div className="rep-stats">
                                                <div className="rep-stat">
                                                    <span className="stat-value">{rep.sets}</span>
                                                    <span className="stat-label">Sets</span>
                                                </div>
                                                <div className="rep-stat">
                                                    <span className="stat-value">{rep.shows}</span>
                                                    <span className="stat-label">Shows</span>
                                                </div>
                                                <div className="rep-stat">
                                                    <span className="stat-value">{rep.closes}</span>
                                                    <span className="stat-label">Closes</span>
                                                </div>
                                                <div className="rep-stat cash">
                                                    <span className="stat-value">${(rep.cash / 1000).toFixed(1)}K</span>
                                                    <span className="stat-label">Cash</span>
                                                </div>
                                            </div>
                                            <div className="rep-rates">
                                                <div className={`rate ${rep.showRate >= 75 ? 'good' : 'warning'}`}>
                                                    Show: {rep.showRate}%
                                                </div>
                                                <div className={`rate ${rep.closeRate >= 30 ? 'good' : 'warning'}`}>
                                                    Close: {rep.closeRate}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Bottleneck Alerts */}
                        <section className="kpi-section">
                            <h2>⚠️ Bottleneck Alerts</h2>
                            <div className="alerts-grid">
                                {showRate < 75 && weeklyData.sets > 0 && (
                                    <div className="alert-card warning">
                                        <Target size={20} />
                                        <div>
                                            <strong>Show Rate Below Target</strong>
                                            <p>Current: {showRate}% | Target: 75% — Focus on confirmation calls & reminders</p>
                                        </div>
                                    </div>
                                )}
                                {closeRate < 30 && weeklyData.shows > 0 && (
                                    <div className="alert-card warning">
                                        <Award size={20} />
                                        <div>
                                            <strong>Close Rate Needs Improvement</strong>
                                            <p>Current: {closeRate}% | Target: 30% — Review sales scripts & objection handling</p>
                                        </div>
                                    </div>
                                )}
                                {setRate >= 60 && showRate >= 75 && closeRate >= 30 && (
                                    <div className="alert-card success">
                                        <TrendingUp size={20} />
                                        <div>
                                            <strong>All Systems Go! 🚀</strong>
                                            <p>Funnel is healthy — consider scaling ad spend</p>
                                        </div>
                                    </div>
                                )}
                                {weeklyData.leads === 0 && (
                                    <div className="alert-card info">
                                        <Users size={20} />
                                        <div>
                                            <strong>Start tracking your KPIs!</strong>
                                            <p>Log your daily leads, sets, shows, and closes to see metrics here</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    )
}
