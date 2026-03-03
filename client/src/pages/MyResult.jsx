import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Award, Clock, ChevronLeft, BookOpen } from 'lucide-react';

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export default function MyResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const attemptId = searchParams.get('attemptId');

    const [result, setResult] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!attemptId) { navigate('/my-attempts'); return; }
        Promise.all([
            api.get(`/attempts/${attemptId}/result`),
            api.get(`/attempts/${attemptId}/result?detailed=true`),
        ])
            .then(([r1, r2]) => {
                setResult(r1.data.result);
                setResponses(r2.data.detailedResponses || []);
            })
            .catch(err => {
                toast.error(err.response?.data?.message || 'Failed to load result');
                navigate('/my-attempts');
            })
            .finally(() => setLoading(false));
    }, [attemptId]);

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
    if (!result) return null;

    const exam = result.exam;
    const pct = result.percentage ?? 0;
    const passed = result.passed;
    const pendingGrading = ['submitted', 'auto_submitted'].includes(result.status);

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Back button */}
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20, gap: 6 }}
                onClick={() => navigate('/my-attempts')}>
                <ChevronLeft size={14} /> Back to My Attempts
            </button>

            {/* Result Card */}
            <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
                {/* Header gradient */}
                <div style={{
                    background: passed ? 'linear-gradient(135deg, #064e3b, #10b981)' : 'linear-gradient(135deg, #450a0a, #ef4444)',
                    padding: '32px 32px 24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
                        {passed ? 'Congratulations! You Passed!' : 'Better Luck Next Time'}
                    </h1>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>{exam?.title}</div>
                </div>

                <div style={{ padding: '24px 32px' }}>
                    {pendingGrading && (
                        <div className="alert alert-info" style={{ marginBottom: 20 }}>
                            ⏳ Some of your answers are pending manual grading by your faculty. Your score may change after grading.
                        </div>
                    )}

                    {/* Score grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
                        {[
                            { label: 'Score', val: `${result.obtainedMarks ?? 0} / ${exam?.totalMarks}`, color: 'var(--accent-primary)', icon: '🎯' },
                            { label: 'Percentage', val: `${pct.toFixed(1)}%`, color: passed ? 'var(--accent-success)' : 'var(--accent-danger)', icon: '📊' },
                            { label: 'Correct', val: result.correctAnswers ?? 0, color: 'var(--accent-success)', icon: '✓' },
                            { label: 'Wrong', val: result.wrongAnswers ?? 0, color: 'var(--accent-danger)', icon: '✗' },
                            { label: 'Unanswered', val: result.unanswered ?? 0, color: 'var(--text-muted)', icon: '○' },
                            { label: 'Passing Marks', val: exam?.passingMarks, color: 'var(--text-secondary)', icon: '🏁' },
                        ].map(({ label, val, color, icon }) => (
                            <div key={label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                        <span>Score Progress</span><span>{result.obtainedMarks}/{exam?.totalMarks}</span>
                    </div>
                    <div className="progress-bar-wrap" style={{ height: 10, borderRadius: 5 }}>
                        <div className="progress-bar" style={{ width: `${pct}%`, background: passed ? 'var(--accent-success)' : 'var(--accent-danger)', borderRadius: 5 }} />
                    </div>

                    <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                        {result.submittedAt && <>Submitted: {formatDate(result.submittedAt)}</>}
                        {result.negativeMarks > 0 && <span style={{ marginLeft: 16, color: 'var(--accent-danger)' }}>Negative marks: -{result.negativeMarks}</span>}
                    </div>
                </div>
            </div>

            {/* Per-question breakdown (if showResults enabled) */}
            {responses.length > 0 && (
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Answer Review</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {responses.map((r, idx) => {
                            const q = r.question;
                            const isOpen = ['descriptive', 'coding'].includes(q?.questionType);
                            return (
                                <div key={r._id} style={{
                                    background: 'var(--bg-card)', border: `1px solid ${r.isCorrect ? 'rgba(16,185,129,0.3)' : r.marksAwarded > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.2)'}`,
                                    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Q{idx + 1}. {q?.questionText}</div>
                                        <div style={{ flexShrink: 0, marginLeft: 12, fontWeight: 700, color: r.isCorrect ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                            {r.marksAwarded ?? 0}/{q?.marks}
                                        </div>
                                    </div>

                                    {/* Show selected options for MCQ types */}
                                    {!isOpen && q?.options && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {q.options.map((opt, oi) => {
                                                const wasSelected = r.selectedOptions?.some(id => id.toString() === opt._id.toString());
                                                return (
                                                    <div key={opt._id} style={{
                                                        padding: '7px 12px', borderRadius: 7, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                                                        background: wasSelected ? (r.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'var(--bg-secondary)',
                                                        border: `1px solid ${wasSelected ? (r.isCorrect ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)') : 'var(--border-color)'}`,
                                                    }}>
                                                        {wasSelected ? (r.isCorrect ? '✓' : '✗') : '○'} {opt.text}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Show text answer for open-ended */}
                                    {isOpen && (
                                        <div style={{ background: q.questionType === 'coding' ? '#0d1117' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: q.questionType === 'coding' ? 'monospace' : 'inherit', whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto', color: q.questionType === 'coding' ? '#c9d1d9' : 'var(--text-primary)' }}>
                                            {r.textAnswer || <em style={{ color: 'var(--text-muted)' }}>No answer submitted</em>}
                                        </div>
                                    )}

                                    {/* Feedback from grading */}
                                    {r.feedback && (
                                        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 7, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            💬 Faculty feedback: {r.feedback}
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {q?.explanation && (
                                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            💡 {q.explanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => navigate('/exams')}>Browse More Exams</button>
                <button className="btn btn-secondary" onClick={() => navigate('/my-attempts')}>Back to My Attempts</button>
            </div>
        </div>
    );
}
