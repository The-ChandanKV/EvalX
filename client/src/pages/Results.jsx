import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Award, CheckCircle, XCircle, BarChart2, Clock } from 'lucide-react';

function ResultCard({ attempt }) {
    const pct = attempt.percentage ?? 0;
    const isPassed = attempt.passed;

    return (
        <div className="result-card">
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {attempt.exam?.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {attempt.exam?.subject}
                </div>
            </div>

            <div className="result-score">{pct.toFixed(1)}%</div>

            <div className={`result-grade ${isPassed ? '' : ''}`} style={{ color: isPassed ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {isPassed ? '🎉 Passed!' : '😔 Failed'}
            </div>

            <span className={`badge ${isPassed ? 'badge-passed' : 'badge-failed'}`} style={{ fontSize: 13, padding: '5px 16px' }}>
                {isPassed ? '✓ PASS' : '✗ FAIL'}
            </span>

            <div className="result-stats">
                <div className="result-stat">
                    <div className="result-stat-value" style={{ color: 'var(--accent-primary)' }}>
                        {attempt.obtainedMarks ?? 0}
                    </div>
                    <div className="result-stat-label">Score</div>
                </div>
                <div className="result-stat">
                    <div className="result-stat-value" style={{ color: 'var(--accent-success)' }}>
                        {attempt.correctAnswers ?? 0}
                    </div>
                    <div className="result-stat-label">Correct</div>
                </div>
                <div className="result-stat">
                    <div className="result-stat-value" style={{ color: 'var(--accent-danger)' }}>
                        {attempt.wrongAnswers ?? 0}
                    </div>
                    <div className="result-stat-label">Wrong</div>
                </div>
            </div>

            <div style={{ margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Score Progress</span><span>{attempt.obtainedMarks}/{attempt.exam?.totalMarks}</span>
                </div>
                <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${pct}%`, background: isPassed ? 'var(--accent-success)' : 'var(--accent-danger)' }} />
                </div>
            </div>
        </div>
    );
}

export default function Results() {
    const [searchParams] = useSearchParams();
    const attemptId = searchParams.get('attemptId');

    const examIdParam = searchParams.get('examId');

    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(examIdParam || '');
    const [results, setResults] = useState([]);
    const [singleResult, setSingleResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/exams').then(r => setExams(r.data.exams || [])).catch(() => { });
    }, []);

    // Auto-load if examId passed in URL
    useEffect(() => {
        if (examIdParam) loadExamResults(examIdParam);
    }, [examIdParam]);

    useEffect(() => {
        if (!attemptId) return;
        setLoading(true);
        api.get(`/attempts/${attemptId}/result`)
            .then(r => setSingleResult(r.data.result || r.data))
            .catch(() => toast.error('Failed to load result'))
            .finally(() => setLoading(false));
    }, [attemptId]);

    const loadExamResults = async (examId) => {
        if (!examId) return setResults([]);
        setLoading(true);
        try {
            const r = await api.get(`/attempts/exam/${examId}/results`);
            setResults(r.data.results || []);
        } catch { toast.error('Failed to load results'); }
        finally { setLoading(false); }
    };

    const handleExamChange = (e) => {
        setSelectedExam(e.target.value);
        loadExamResults(e.target.value);
    };

    if (attemptId && loading) return <div className="loading-overlay"><div className="spinner" /></div>;
    if (attemptId && singleResult) {
        return (
            <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
                <div className="page-header">
                    <h1 className="page-title">Result</h1>
                </div>
                <ResultCard attempt={singleResult.attempt || singleResult} />
            </div>
        );
    }

    const passedCount = results.filter(r => r.passed).length;
    const avgPct = results.length ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1) : 0;

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Exam Results</h1>
                    <p className="page-subtitle">View and analyze student performance</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Exam</label>
                    <select className="form-select" value={selectedExam} onChange={handleExamChange} id="result-exam-select">
                        <option value="">-- Choose an exam --</option>
                        {exams.map(e => <option key={e._id} value={e._id}>{e.title} ({e.subject})</option>)}
                    </select>
                </div>
            </div>

            {selectedExam && results.length > 0 && (
                <>
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card indigo">
                            <div className="stat-icon indigo"><BarChart2 size={22} /></div>
                            <div className="stat-info"><div className="stat-value">{results.length}</div><div className="stat-label">Total Attempts</div></div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-icon green"><CheckCircle size={22} /></div>
                            <div className="stat-info"><div className="stat-value">{passedCount}</div><div className="stat-label">Passed</div></div>
                        </div>
                        <div className="stat-card amber">
                            <div className="stat-icon amber"><Award size={22} /></div>
                            <div className="stat-info"><div className="stat-value">{avgPct}%</div><div className="stat-label">Average Score</div></div>
                        </div>
                        <div className="stat-card blue">
                            <div className="stat-icon blue"><XCircle size={22} /></div>
                            <div className="stat-info"><div className="stat-value">{results.length - passedCount}</div><div className="stat-label">Failed</div></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Student Results</div>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th><th>Student</th><th>Score</th><th>Percentage</th>
                                        <th>Correct</th><th>Wrong</th><th>Status</th><th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr key={r._id}>
                                            <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{r.student?.name || 'Student'}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.student?.email}</div>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>{r.obtainedMarks ?? 0}/{r.exam?.totalMarks}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div className="progress-bar-wrap" style={{ width: 70 }}>
                                                        <div className="progress-bar" style={{ width: `${r.percentage || 0}%`, background: r.passed ? 'var(--accent-success)' : 'var(--accent-danger)' }} />
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{(r.percentage || 0).toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{r.correctAnswers ?? 0}</td>
                                            <td style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>{r.wrongAnswers ?? 0}</td>
                                            <td><span className={`badge ${r.passed ? 'badge-passed' : 'badge-failed'}`}>{r.passed ? 'Pass' : 'Fail'}</span></td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {r.timeTaken ? `${Math.round(r.timeTaken / 60)}m` : '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {selectedExam && !loading && results.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon"><BarChart2 size={28} /></div>
                    <div className="empty-state-title">No results yet</div>
                    <div className="empty-state-text">No students have attempted this exam yet.</div>
                </div>
            )}
        </div>
    );
}
