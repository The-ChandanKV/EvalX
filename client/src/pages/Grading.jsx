import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Code2, FileText, AlertCircle, ChevronDown, ChevronUp, Star, BookOpen } from 'lucide-react';

const STATUS_COLORS = {
    submitted: 'var(--accent-info)', auto_submitted: 'var(--accent-warning)',
    evaluated: 'var(--accent-success)',
};

function GradeCard({ submission, onGraded }) {
    const [expanded, setExpanded] = useState(false);
    const [marks, setMarks] = useState(submission.marksAwarded ?? 0);
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [saving, setSaving] = useState(false);

    const q = submission.question;
    const student = submission.attempt?.student;
    const maxMarks = q?.marks ?? 0;
    const isCoding = q?.questionType === 'coding';
    const alreadyGraded = submission.gradedManually;

    const handleGrade = async () => {
        if (marks < 0 || marks > maxMarks) {
            toast.error(`Marks must be 0–${maxMarks}`); return;
        }
        setSaving(true);
        try {
            await api.post(`/questions/grade/${submission._id}`, { marksAwarded: marks, feedback });
            toast.success(`Graded: ${marks}/${maxMarks}`);
            onGraded?.();
        } catch (err) { toast.error(err.response?.data?.message || 'Grading failed'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 14,
        }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => setExpanded(e => !e)}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        {isCoding ? <Code2 size={15} color="#f43f5e" /> : <FileText size={15} color="#10b981" />}
                        <span style={{ fontWeight: 700, fontSize: 15 }}>
                            {isCoding ? 'Coding' : 'Descriptive'}: {q?.questionText?.slice(0, 80)}{q?.questionText?.length > 80 ? '…' : ''}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                        <span>👤 {student?.name} ({student?.email})</span>
                        {student?.enrollmentNo && <span>#{student.enrollmentNo}</span>}
                        <span style={{ color: STATUS_COLORS[submission.attempt?.status] || 'var(--text-muted)' }}>
                            ● {submission.attempt?.status?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {alreadyGraded ? (
                        <div style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: 16 }}>
                            {submission.marksAwarded}/{maxMarks}
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>Graded</div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            Pending / {maxMarks}pts
                        </div>
                    )}
                </div>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {/* Expanded Body */}
            {expanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-color)' }}>
                    {/* Question */}
                    <div style={{ paddingTop: 16, marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                            Question
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>{q?.questionText}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        {/* Student answer */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Student's Answer
                            </div>
                            {submission.textAnswer ? (
                                <div style={{
                                    background: isCoding ? '#0d1117' : 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)', borderRadius: 8,
                                    padding: '12px 16px', minHeight: 100, maxHeight: 260,
                                    overflowY: 'auto', fontSize: isCoding ? 13 : 14,
                                    fontFamily: isCoding ? 'monospace' : 'inherit',
                                    color: isCoding ? '#c9d1d9' : 'var(--text-primary)',
                                    whiteSpace: 'pre-wrap', lineHeight: 1.6,
                                }}>
                                    {submission.textAnswer}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                                    No answer submitted
                                </div>
                            )}
                        </div>

                        {/* Model answer */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Model Answer
                            </div>
                            {q?.modelAnswer ? (
                                <div style={{
                                    background: isCoding ? '#0a1628' : 'rgba(16,185,129,0.06)',
                                    border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8,
                                    padding: '12px 16px', minHeight: 100, maxHeight: 260,
                                    overflowY: 'auto', fontSize: isCoding ? 13 : 14,
                                    fontFamily: isCoding ? 'monospace' : 'inherit',
                                    color: isCoding ? '#79c0ff' : 'var(--text-primary)',
                                    whiteSpace: 'pre-wrap', lineHeight: 1.6,
                                }}>
                                    {q.modelAnswer}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, fontStyle: 'italic' }}>
                                    No model answer set
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Test cases (coding) */}
                    {isCoding && q?.testCases?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Test Cases
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {q.testCases.map((tc, i) => (
                                    <div key={tc._id || i} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: '#8b949e' }}>TC {i + 1} {tc.isHidden ? '🔒' : ''} · {tc.marks}pt</span>
                                        </div>
                                        {tc.input && <div style={{ color: '#c9d1d9' }}>Input: <span style={{ color: '#79c0ff' }}>{tc.input}</span></div>}
                                        <div style={{ color: '#c9d1d9' }}>Expected: <span style={{ color: '#3fb950' }}>{tc.expectedOutput}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grading Controls */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                            {alreadyGraded ? '✓ Re-grade' : '📝 Grade this answer'}
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Marks Awarded (0–{maxMarks})</label>
                                <input className="form-input" type="number" min={0} max={maxMarks}
                                    style={{ width: 120 }} value={marks}
                                    onChange={e => setMarks(Math.max(0, Math.min(maxMarks, +e.target.value)))} />
                            </div>
                            {/* Quick buttons */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                {[0, Math.floor(maxMarks * 0.5), Math.floor(maxMarks * 0.75), maxMarks].filter((v, i, a) => a.indexOf(v) === i).map(v => (
                                    <button key={v} type="button" className="btn btn-secondary btn-sm"
                                        style={{ minWidth: 36, padding: '4px 10px', fontWeight: 700 }}
                                        onClick={() => setMarks(v)}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: 12, marginBottom: 12 }}>
                            <label className="form-label">Feedback <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(optional, shown to student)</span></label>
                            <textarea className="form-input" rows={2} value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="Well explained but missing edge case..." style={{ resize: 'vertical' }} />
                        </div>
                        <button className="btn btn-success" onClick={handleGrade} disabled={saving} style={{ gap: 6 }}>
                            <Star size={15} /> {saving ? 'Saving...' : alreadyGraded ? `Update Grade (${marks}/${maxMarks})` : `Submit Grade (${marks}/${maxMarks})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Grading() {
    const [searchParams] = useSearchParams();
    const examIdParam = searchParams.get('examId');
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(examIdParam || '');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'graded'

    useEffect(() => {
        api.get('/exams').then(r => setExams(r.data.exams || [])).catch(() => { });
    }, []);

    const loadSubmissions = (examId = selectedExam) => {
        if (!examId) return;
        setLoading(true);
        api.get(`/questions/grade/${examId}`)
            .then(r => setSubmissions(r.data.submissions || []))
            .catch(err => toast.error(err.response?.data?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (selectedExam) loadSubmissions(); }, [selectedExam]);
    useEffect(() => { if (examIdParam) setSelectedExam(examIdParam); }, [examIdParam]);

    const filtered = submissions.filter(s => {
        if (filter === 'pending') return !s.gradedManually;
        if (filter === 'graded') return s.gradedManually;
        return true;
    });

    const pendingCount = submissions.filter(s => !s.gradedManually).length;
    const gradedCount = submissions.filter(s => s.gradedManually).length;

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manual Grading</h1>
                    <p className="page-subtitle">Grade descriptive and coding answers</p>
                </div>
            </div>

            {/* Exam selector */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">Select Exam</label>
                        <select className="form-select" value={selectedExam}
                            onChange={e => { setSelectedExam(e.target.value); setSubmissions([]); }}>
                            <option value="">-- Choose an exam --</option>
                            {exams.map(e => <option key={e._id} value={e._id}>{e.title} ({e.subject})</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {!selectedExam ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><BookOpen size={28} /></div>
                    <div className="empty-state-title">Select an Exam</div>
                    <div className="empty-state-text">Choose an exam to view and grade open-ended submissions.</div>
                </div>
            ) : loading ? (
                <div className="loading-overlay"><div className="spinner" /></div>
            ) : submissions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><CheckCircle size={28} /></div>
                    <div className="empty-state-title">No open-ended submissions yet</div>
                    <div className="empty-state-text">This exam has no submitted descriptive or coding answers yet, or all questions are auto-graded.</div>
                </div>
            ) : (
                <>
                    {/* Stats bar */}
                    <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                        <div className="card" style={{ padding: '12px 20px', flex: 'none' }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{submissions.length}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Submissions</div>
                        </div>
                        <div className="card" style={{ padding: '12px 20px', flex: 'none', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{pendingCount}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Grading</div>
                        </div>
                        <div className="card" style={{ padding: '12px 20px', flex: 'none', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{gradedCount}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Graded</div>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="tabs" style={{ marginBottom: 20 }}>
                        {[['all', 'All'], ['pending', 'Pending'], ['graded', 'Graded']].map(([v, l]) => (
                            <button key={v} className={`tab-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>
                                {l} {v === 'pending' && pendingCount > 0 && (
                                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, fontWeight: 700, padding: '1px 6px', marginLeft: 4 }}>
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><CheckCircle size={28} /></div>
                            <div className="empty-state-title">
                                {filter === 'graded' ? 'None graded yet' : 'All answers graded!'}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {filtered.map(s => (
                                <GradeCard key={s._id} submission={s} onGraded={() => loadSubmissions()} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
