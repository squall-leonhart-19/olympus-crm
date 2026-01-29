import { useState } from 'react'
import Header from '../components/layout/Header'
import {
    TrendingUp, TrendingDown, Phone, Users, DollarSign,
    Target, Calendar, ChevronLeft, ChevronRight, BarChart3,
    ArrowUpRight, ArrowDownRight, Flame, Award
} from 'lucide-react'
import './Reports.css'

// Demo KPI data - in production this would come from Supabase
const WEEKLY_DATA = {
    currentWeek: {
        week: 'Jan 27 - Feb 2',
        leads: 47,
        sets: 32,
        shows: 24,
        closes: 8,
        cashCollected: 18450,
        avgDealSize: 2306,
    },
    lastWeek: {
        week: 'Jan 20 - Jan 26',
        leads: 42,
        sets: 28,
        shows: 21,
        closes: 6,
        cashCollected: 14200,
        avgDealSize: 2367,
    }
}

const DAILY_SCORECARD = [
    { date: '2026-01-27', day: 'Mon', leads: 8, sets: 5, shows: 4, closes: 1, cash: 2997 },
    { date: '2026-01-28', day: 'Tue', leads: 7, sets: 6, shows: 5, closes: 2, cash: 4494 },
    { date: '2026-01-29', day: 'Wed', leads: 9, sets: 7, shows: 4, closes: 2, cash: 3994 },
    { date: '2026-01-30', day: 'Thu', leads: 6, sets: 4, shows: 3, closes: 1, cash: 2997 },
    { date: '2026-01-31', day: 'Fri', leads: 10, sets: 6, shows: 5, closes: 1, cash: 1497 },
    { date: '2026-02-01', day: 'Sat', leads: 4, sets: 2, shows: 2, closes: 1, cash: 2471 },
    { date: '2026-02-02', day: 'Sun', leads: 3, sets: 2, shows: 1, closes: 0, cash: 0 },
]

const REP_PERFORMANCE = [
    {
        name: 'Marco',
        role: 'Sales Lead',
        sets: 14, shows: 12, closes: 4, cash: 9500,
        showRate: 86, closeRate: 33, streak: 7
    },
    {
        name: 'Giulia',
        role: 'Closer',
        sets: 10, shows: 8, closes: 3, cash: 5950,
        showRate: 80, closeRate: 38, streak: 12
    },
    {
        name: 'Alex',
        role: 'SDR',
        sets: 8, shows: 4, closes: 1, cash: 3000,
        showRate: 50, closeRate: 25, streak: 3
    },
]

const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

const MetricCard = ({ icon: Icon, label, value, previousValue, format = 'number', size = 'normal' }) => {
    const change = calculateChange(value, previousValue)
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
                {previousValue !== undefined && (
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
    const { currentWeek, lastWeek } = WEEKLY_DATA

    // Calculate conversion rates
    const setRate = Math.round((currentWeek.sets / currentWeek.leads) * 100)
    const showRate = Math.round((currentWeek.shows / currentWeek.sets) * 100)
    const closeRate = Math.round((currentWeek.closes / currentWeek.shows) * 100)

    const lastSetRate = Math.round((lastWeek.sets / lastWeek.leads) * 100)
    const lastShowRate = Math.round((lastWeek.shows / lastWeek.sets) * 100)
    const lastCloseRate = Math.round((lastWeek.closes / lastWeek.shows) * 100)

    return (
        <>
            <Header title="KPI Dashboard" />
            <div className="page-content reports-page">

                {/* Week Selector */}
                <div className="week-selector">
                    <button className="btn btn-ghost"><ChevronLeft size={20} /></button>
                    <div className="current-week">
                        <Calendar size={18} />
                        <span>{currentWeek.week}</span>
                    </div>
                    <button className="btn btn-ghost"><ChevronRight size={20} /></button>
                </div>

                {/* Main KPIs */}
                <section className="kpi-section">
                    <h2>📊 Weekly Scorecard</h2>
                    <div className="kpi-grid main-kpis">
                        <MetricCard
                            icon={Users}
                            label="Leads"
                            value={currentWeek.leads}
                            previousValue={lastWeek.leads}
                            size="large"
                        />
                        <MetricCard
                            icon={Phone}
                            label="Sets (Calls Booked)"
                            value={currentWeek.sets}
                            previousValue={lastWeek.sets}
                            size="large"
                        />
                        <MetricCard
                            icon={Target}
                            label="Shows (Calls Taken)"
                            value={currentWeek.shows}
                            previousValue={lastWeek.shows}
                            size="large"
                        />
                        <MetricCard
                            icon={Award}
                            label="Closes"
                            value={currentWeek.closes}
                            previousValue={lastWeek.closes}
                            size="large"
                        />
                        <MetricCard
                            icon={DollarSign}
                            label="Cash Collected"
                            value={currentWeek.cashCollected}
                            previousValue={lastWeek.cashCollected}
                            format="currency"
                            size="large"
                        />
                        <MetricCard
                            icon={BarChart3}
                            label="Avg Deal Size"
                            value={currentWeek.avgDealSize}
                            previousValue={lastWeek.avgDealSize}
                            format="currency"
                            size="large"
                        />
                    </div>
                </section>

                {/* Conversion Ratios */}
                <section className="kpi-section">
                    <h2>🎯 Conversion Funnel</h2>
                    <div className="funnel-container">
                        <div className="funnel-visual">
                            <div className="funnel-stage" style={{ width: '100%' }}>
                                <span className="funnel-label">Leads</span>
                                <span className="funnel-value">{currentWeek.leads}</span>
                            </div>
                            <div className="funnel-arrow">↓ {setRate}%</div>
                            <div className="funnel-stage" style={{ width: '85%' }}>
                                <span className="funnel-label">Sets</span>
                                <span className="funnel-value">{currentWeek.sets}</span>
                            </div>
                            <div className="funnel-arrow">↓ {showRate}%</div>
                            <div className="funnel-stage" style={{ width: '70%' }}>
                                <span className="funnel-label">Shows</span>
                                <span className="funnel-value">{currentWeek.shows}</span>
                            </div>
                            <div className="funnel-arrow">↓ {closeRate}%</div>
                            <div className="funnel-stage closed" style={{ width: '50%' }}>
                                <span className="funnel-label">Closes</span>
                                <span className="funnel-value">{currentWeek.closes}</span>
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
                                {DAILY_SCORECARD.map((day, idx) => {
                                    const dayShowRate = day.sets > 0 ? Math.round((day.shows / day.sets) * 100) : 0
                                    const dayCloseRate = day.shows > 0 ? Math.round((day.closes / day.shows) * 100) : 0
                                    return (
                                        <tr key={idx} className={day.date === '2026-01-29' ? 'today' : ''}>
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
                                    <td><strong>{DAILY_SCORECARD.reduce((s, d) => s + d.leads, 0)}</strong></td>
                                    <td><strong>{DAILY_SCORECARD.reduce((s, d) => s + d.sets, 0)}</strong></td>
                                    <td><strong>{DAILY_SCORECARD.reduce((s, d) => s + d.shows, 0)}</strong></td>
                                    <td><strong>{DAILY_SCORECARD.reduce((s, d) => s + d.closes, 0)}</strong></td>
                                    <td><strong>${DAILY_SCORECARD.reduce((s, d) => s + d.cash, 0).toLocaleString()}</strong></td>
                                    <td><strong>{showRate}%</strong></td>
                                    <td><strong>{closeRate}%</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                {/* Rep Performance */}
                <section className="kpi-section">
                    <h2>🏆 Rep Leaderboard</h2>
                    <div className="rep-grid">
                        {REP_PERFORMANCE.sort((a, b) => b.cash - a.cash).map((rep, idx) => (
                            <div key={rep.name} className={`rep-card ${idx === 0 ? 'top-performer' : ''}`}>
                                {idx === 0 && <div className="top-badge">🥇 TOP CLOSER</div>}
                                <div className="rep-header">
                                    <div className="rep-avatar">{rep.name.charAt(0)}</div>
                                    <div>
                                        <div className="rep-name">{rep.name}</div>
                                        <div className="rep-role">{rep.role}</div>
                                    </div>
                                    {rep.streak >= 7 && (
                                        <div className="streak-badge">
                                            <Flame size={14} />
                                            {rep.streak}d
                                        </div>
                                    )}
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

                {/* Bottleneck Alerts */}
                <section className="kpi-section">
                    <h2>⚠️ Bottleneck Alerts</h2>
                    <div className="alerts-grid">
                        {showRate < 75 && (
                            <div className="alert-card warning">
                                <Target size={20} />
                                <div>
                                    <strong>Show Rate Below Target</strong>
                                    <p>Current: {showRate}% | Target: 75% — Focus on confirmation calls & reminders</p>
                                </div>
                            </div>
                        )}
                        {closeRate < 30 && (
                            <div className="alert-card warning">
                                <Award size={20} />
                                <div>
                                    <strong>Close Rate Needs Improvement</strong>
                                    <p>Current: {closeRate}% | Target: 30% — Review sales scripts & objection handling</p>
                                </div>
                            </div>
                        )}
                        {REP_PERFORMANCE.some(r => r.showRate < 60) && (
                            <div className="alert-card danger">
                                <Users size={20} />
                                <div>
                                    <strong>Alex has {REP_PERFORMANCE.find(r => r.name === 'Alex')?.showRate}% show rate</strong>
                                    <p>Way below team average — needs coaching on lead qualification</p>
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
                    </div>
                </section>

            </div>
        </>
    )
}
