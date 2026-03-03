import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Clock, CheckCircle, XCircle, Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyAttempts() {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/attempts/my-attempts')
            .then(r => setAttempts(r.data.attempts || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    const passed = attempts.filter(a => a.passed).length;
    const avgScore = attempts.length
        ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length)
        : 0;

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Attempts</h1>
                    <p className="page-subtitle">Your exam history and results</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card indigo">
                    <div className="stat-icon indigo"><Award size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{attempts.length}</div><div className="stat-label">Total Attempts</div></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><CheckCircle size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{passed}</div><div className="stat-label">Passed</div></div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-icon amber"><XCircle size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{attempts.length - passed}</div><div className="stat-label">Failed</div></div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon blue"><Award size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{avgScore}%</div><div className="stat-label">Avg Score</div></div>
                </div>
            </div>

            {attempts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Clock size={28} /></div>
                    <div className="empty-state-title">No attempts yet</div>
                    <div className="empty-state-text">You haven't taken any exams yet. Browse available exams to get started!</div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/exams')}>Browse Exams</button>
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Exam</th>
                                    <th>Score</th>
                                    <th>Percentage</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.map(att => (
                                    <tr key={att._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{att.exam?.title || 'Exam'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--accent-primary)' }}>{att.exam?.subject}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>{att.obtainedMarks ?? '--'}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}> / {att.exam?.totalMarks}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="progress-bar-wrap" style={{ width: 80 }}>
                                                        <div className="progress-bar" style={{ width: `${att.percentage || 0}%`, background: att.passed ? 'var(--accent-success)' : 'var(--accent-danger)' }} />
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: att.passed ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                                    {att.percentage?.toFixed(1) ?? 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${att.passed ? 'badge-passed' : 'badge-failed'}`}>
                                                {att.passed ? '✓ Passed' : '✗ Failed'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                            {att.submittedAt ? formatDate(att.submittedAt) : '--'}
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={() => navigate(`/my-result?attemptId=${att._id}`)}>
                                                <ChevronRight size={14} /> View Result
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
