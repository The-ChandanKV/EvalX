import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { BookOpen, ClipboardList, CheckCircle, Clock, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentExams, setRecentExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const examsRes = await api.get('/exams');
                const exams = examsRes.data.exams || [];
                setRecentExams(exams.slice(0, 5));

                if (user?.role === 'student') {
                    try {
                        const attRes = await api.get('/attempts/my-attempts');
                        const attempts = attRes.data.attempts || [];
                        const passed = attempts.filter(a => a.passed);
                        setStats({ exams: exams.length, attempts: attempts.length, passed: passed.length });
                    } catch { setStats({ exams: exams.length, attempts: 0, passed: 0 }); }
                } else {
                    setStats({ exams: exams.length });
                }
            } catch { setStats({ exams: 0 }); }
            finally { setLoading(false); }
        })();
    }, [user?.role]);

    const getRoleBadge = (role) => {
        if (role === 'admin') return { color: 'amber', label: 'Administrator' };
        if (role === 'faculty') return { color: 'purple', label: 'Faculty Member' };
        return { color: 'blue', label: 'Student' };
    };

    const badge = getRoleBadge(user?.role);

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Welcome Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 32px',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', right: -30, top: -30,
                    width: 160, height: 160,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    width: 56, height: 56,
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 24px rgba(99,102,241,0.4)',
                    flexShrink: 0
                }}>
                    <Award size={26} color="#fff" />
                </div>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        <span className={`badge badge-${badge.color}`}>{badge.label}</span>
                        {user?.department && <span style={{ marginLeft: 8 }}>· {user.department}</span>}
                    </p>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-card indigo">
                        <div className="stat-icon indigo"><BookOpen size={22} /></div>
                        <div className="stat-info">
                            <div className="stat-value">{stats?.exams ?? 0}</div>
                            <div className="stat-label">
                                {user?.role === 'student' ? 'Available Exams' : 'Total Exams'}
                            </div>
                        </div>
                    </div>

                    {user?.role === 'student' && (
                        <>
                            <div className="stat-card purple">
                                <div className="stat-icon purple"><ClipboardList size={22} /></div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats?.attempts ?? 0}</div>
                                    <div className="stat-label">Exams Attempted</div>
                                </div>
                            </div>
                            <div className="stat-card green">
                                <div className="stat-icon green"><CheckCircle size={22} /></div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats?.passed ?? 0}</div>
                                    <div className="stat-label">Passed</div>
                                </div>
                            </div>
                        </>
                    )}

                    {user?.role !== 'student' && (
                        <div className="stat-card green">
                            <div className="stat-icon green"><TrendingUp size={22} /></div>
                            <div className="stat-info">
                                <div className="stat-value">{recentExams.filter(e => e.status === 'published' || e.status === 'active').length}</div>
                                <div className="stat-label">Published Exams</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Exams */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Recent Exams</div>
                        <div className="card-subtitle">Latest exams on the platform</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/exams')}>
                        View All
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
                    </div>
                ) : recentExams.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><AlertCircle size={28} /></div>
                        <div className="empty-state-title">No exams yet</div>
                        <div className="empty-state-text">
                            {user?.role === 'student' ? 'Check back soon for upcoming exams.' : 'Create your first exam to get started.'}
                        </div>
                        {user?.role !== 'student' && (
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/exams')}>Create Exam</button>
                        )}
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Duration</th>
                                    <th>Marks</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentExams.map(exam => (
                                    <tr key={exam._id}>
                                        <td style={{ fontWeight: 600 }}>{exam.title}</td>
                                        <td style={{ color: 'var(--accent-primary)' }}>{exam.subject}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Clock size={13} />{exam.duration} min
                                            </span>
                                        </td>
                                        <td>{exam.totalMarks}</td>
                                        <td><span className={`badge badge-${exam.status}`}>{exam.status}</span></td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/exams')}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
