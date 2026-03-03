import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Code2, FileText } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function TakeExam() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    // answers: { [questionId]: number (MCQ) | number[] (MSQ) | string (descriptive/coding) }
    const [answers, setAnswers] = useState({});
    const [current, setCurrent] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [started, setStarted] = useState(false);
    const [exam, setExam] = useState(null);
    const timerRef = useRef(null);
    const saveTimeoutRef = useRef({});

    // Load exam details first
    useEffect(() => {
        api.get(`/exams/${examId}`)
            .then(r => setExam(r.data.exam))  // Fix: top-level field
            .catch(() => toast.error('Exam not found'))
            .finally(() => setLoading(false));
    }, [examId]);

    const startExam = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/attempts/${examId}/start`);
            // Fix: backend spreads at top level
            const { attempt: att, questions: qs, remainingTimeSeconds } = res.data;
            setAttempt(att);
            setQuestions(qs);
            setTimeLeft(remainingTimeSeconds ?? (exam?.duration * 60));
            setStarted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start exam');
        } finally { setLoading(false); }
    };

    // Timer countdown
    useEffect(() => {
        if (!started || timeLeft === null) return;
        if (timeLeft <= 0) { handleSubmit(); return; }
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [started, timeLeft]);

    // Save answer — sends correct field based on question type
    const saveAnswer = useCallback(async (questionId, value, questionType) => {
        const isText = ['descriptive', 'coding'].includes(questionType);
        try {
            await api.post(`/attempts/${attempt._id}/answer`, {
                questionId,
                ...(isText
                    ? { textAnswer: value, selectedOptions: [] }
                    : { selectedOptions: Array.isArray(value) ? value : [value] }
                ),
            });
        } catch (err) {
            if (err.response?.status !== 400) toast.error('Answer save failed');
        }
    }, [attempt]);

    // MCQ: single option select
    const selectMCQ = (questionId, optionId) => {
        setAnswers(p => ({ ...p, [questionId]: optionId }));
        saveAnswer(questionId, optionId, 'mcq');
    };

    // MSQ: toggle multi-select
    const toggleMSQ = (questionId, optionId) => {
        setAnswers(p => {
            const current = Array.isArray(p[questionId]) ? p[questionId] : [];
            const next = current.includes(optionId)
                ? current.filter(id => id !== optionId)
                : [...current, optionId];
            saveAnswer(questionId, next, 'multi_select');
            return { ...p, [questionId]: next };
        });
    };

    const updateText = (questionId, text, questionType) => {
        setAnswers(p => ({ ...p, [questionId]: text }));
        clearTimeout(saveTimeoutRef.current[questionId]);
        saveTimeoutRef.current[questionId] = setTimeout(() => {
            saveAnswer(questionId, text, questionType);
        }, 800);
    };

    const handleSubmit = useCallback(async () => {
        if (submitting) return;
        clearTimeout(timerRef.current);
        setSubmitting(true);
        try {
            await api.post(`/attempts/${attempt._id}/submit`);
            toast.success('Exam submitted! Viewing your result...');
            setTimeout(() => navigate(`/my-result?attemptId=${attempt._id}`), 1200);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
            setSubmitting(false);
        }
    }, [attempt, navigate, submitting]);

    const confirmSubmit = () => {
        const answeredCount = Object.keys(answers).length;
        const unanswered = questions.length - answeredCount;
        const msg = unanswered > 0
            ? `You have ${unanswered} unanswered question(s). Submit anyway?`
            : 'Submit exam now?';
        if (confirm(msg)) handleSubmit();
    };

    const isAnswered = (q) => {
        const ans = answers[q._id];
        if (ans === undefined || ans === null) return false;
        if (Array.isArray(ans)) return ans.length > 0;
        if (typeof ans === 'string') return ans.trim().length > 0;
        return true;
    };

    const answeredCount = questions.filter(isAnswered).length;
    const timerClass = timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : '';

    if (loading) return <div className="loading-overlay" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

    // Pre-start screen
    if (!started) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: 40 }}>
                    <div style={{ width: 64, height: 64, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
                        <Clock size={30} color="#fff" />
                    </div>

                    <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{exam?.title}</h1>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 20 }}>{exam?.subject}</div>

                    {exam?.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>{exam.description}</p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                        {[
                            ['Duration', `${exam?.duration} min`],
                            ['Total Marks', exam?.totalMarks],
                            ['Passing Marks', exam?.passingMarks],
                            ['Max Attempts', exam?.maxAttempts],
                        ].map(([label, val]) => (
                            <div key={label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{val}</div>
                            </div>
                        ))}
                    </div>

                    <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 20 }}>
                        <AlertTriangle size={16} />
                        <span>Once started, the timer cannot be paused. Ensure a stable internet connection before proceeding.</span>
                    </div>

                    {exam?.negativeMarking?.enabled && (
                        <div className="alert alert-error" style={{ textAlign: 'left', marginBottom: 20 }}>
                            <AlertTriangle size={16} />
                            <span>Negative marking is enabled. {exam.negativeMarking.fraction * 100}% marks deducted for wrong answers.</span>
                        </div>
                    )}

                    <button className="btn btn-primary btn-full btn-lg" onClick={startExam} id="start-exam-btn">
                        🚀 Start Exam
                    </button>
                    <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => navigate('/exams')}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const q = questions[current];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
            {/* Top Bar */}
            <div style={{ maxWidth: 1100, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{exam?.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--accent-primary)' }}>{exam?.subject}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={16} color={timeLeft < 60 ? 'var(--accent-danger)' : timeLeft < 300 ? 'var(--accent-warning)' : 'var(--accent-primary)'} />
                        <span className={`timer-value ${timerClass}`} style={{ fontSize: 20 }}>{formatTime(timeLeft)}</span>
                    </div>
                    <button className="btn btn-danger" onClick={confirmSubmit} disabled={submitting} id="submit-exam-btn">
                        <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </div>

            <div className="exam-take-layout" style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Question Area */}
                <div className="exam-question-area">
                    {q && (
                        <div className="question-card" style={{ animation: 'slideUp 0.2s ease' }}>
                            <div className="question-number">
                                Question {current + 1} of {questions.length} · {q.marks} mark{q.marks !== 1 ? 's' : ''}
                                {q.questionType && (
                                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        · {q.questionType.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                            <div className="question-text">{q.questionText}</div>

                            {/* MCQ — single select */}
                            {q.questionType === 'mcq' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {q.options?.map((opt, i) => {
                                        const isSelected = answers[q._id] === opt._id;
                                        return (
                                            <button key={opt._id || i} className={`option-btn ${isSelected ? 'selected' : ''}`}
                                                onClick={() => selectMCQ(q._id, opt._id)}>
                                                <div className="option-index" style={{
                                                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                                                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                                    background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)'
                                                }}>
                                                    {OPTION_LABELS[i]}
                                                </div>
                                                {opt.text}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* True/False */}
                            {q.questionType === 'true_false' && (
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {q.options?.map((opt, i) => {
                                        const isSelected = answers[q._id] === opt._id;
                                        return (
                                            <button key={opt._id || i}
                                                onClick={() => selectMCQ(q._id, opt._id)}
                                                style={{
                                                    flex: 1, padding: '20px', borderRadius: 12, border: '2px solid',
                                                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                                    background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                                                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                                                    fontWeight: 700, fontSize: 16, cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}>
                                                {opt.text}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* MSQ — multi select */}
                            {q.questionType === 'multi_select' && (
                                <>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                                        Select all correct answers
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        {q.options?.map((opt, i) => {
                                            const selected = Array.isArray(answers[q._id]) && answers[q._id].includes(opt._id);
                                            return (
                                                <button key={opt._id || i} className={`option-btn ${selected ? 'selected' : ''}`}
                                                    onClick={() => toggleMSQ(q._id, opt._id)}>
                                                    <div style={{
                                                        width: 22, height: 22, borderRadius: 5, border: '2px solid', flexShrink: 0,
                                                        borderColor: selected ? 'var(--accent-primary)' : 'var(--border-color)',
                                                        background: selected ? 'var(--accent-primary)' : 'var(--bg-card)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 13, color: '#fff', fontWeight: 800,
                                                    }}>
                                                        {selected ? '✓' : ''}
                                                    </div>
                                                    {opt.text}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Descriptive */}
                            {q.questionType === 'descriptive' && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                                        <FileText size={14} /> Type your answer below
                                    </div>
                                    <textarea
                                        className="form-input"
                                        rows={8}
                                        style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
                                        placeholder="Write your answer here..."
                                        value={answers[q._id] || ''}
                                        onChange={e => updateText(q._id, e.target.value, 'descriptive')}
                                    />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                        {answers[q._id]?.length || 0} characters · auto-saved
                                    </div>
                                </div>
                            )}

                            {/* Coding */}
                            {q.questionType === 'coding' && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                                        <Code2 size={14} /> Write your solution code
                                    </div>
                                    {/* Test cases for coding */}
                                    {q.testCases?.length > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sample Test Cases</div>
                                            {q.testCases.map((tc, i) => (
                                                <div key={tc._id || i} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}>
                                                    <div style={{ color: '#8b949e', marginBottom: 4 }}>Input:</div>
                                                    <div style={{ color: '#79c0ff' }}>{tc.input || '(none)'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <textarea
                                        className="form-input"
                                        rows={12}
                                        style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, background: '#0d1117', color: '#c9d1d9', border: '1px solid rgba(255,255,255,0.1)' }}
                                        placeholder={`// Write your ${q.codeLanguage || 'code'} solution here...`}
                                        value={answers[q._id] || ''}
                                        onChange={e => updateText(q._id, e.target.value, 'coding')}
                                        spellCheck={false}
                                    />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                        {answers[q._id]?.trim().split('\n').length || 0} lines · auto-saved · {q.codeLanguage}
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                                <button className="btn btn-secondary" onClick={() => setCurrent(p => p - 1)} disabled={current === 0}>
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
                                    {answeredCount} / {questions.length} answered
                                </span>
                                {current < questions.length - 1 ? (
                                    <button className="btn btn-primary" onClick={() => setCurrent(p => p + 1)}>
                                        Next <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button className="btn btn-success" onClick={confirmSubmit} disabled={submitting}>
                                        <Send size={15} /> Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Question Navigator */}
                <div className="exam-sidebar">
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>Question Navigator</div>
                        <div className="question-nav-grid">
                            {questions.map((qs, i) => (
                                <button key={qs._id}
                                    className={`qnav-btn ${isAnswered(qs) ? 'answered' : ''} ${i === current ? 'current' : ''}`}
                                    onClick={() => setCurrent(i)}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 12, height: 12, background: 'var(--accent-primary)', borderRadius: 3 }} /> Answered ({answeredCount})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 12, height: 12, border: '1.5px solid var(--border-color)', borderRadius: 3 }} /> Not Answered ({questions.length - answeredCount})
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
