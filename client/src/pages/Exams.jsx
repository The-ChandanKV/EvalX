import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Clock, BookOpen, AlertCircle, X, Edit2, Trash2, Eye, Send, FileQuestion, Users } from 'lucide-react';

const EMPTY_EXAM = {
    title: '', description: '', subject: '', duration: 60,
    totalMarks: 100, passingMarks: 40, startTime: '', endTime: '',
    maxAttempts: 1, shuffleQuestions: false, shuffleOptions: false,
    randomQuestions: false, questionsToSelect: '',
    showResults: true,
    negativeMarking: { enabled: false, fraction: 0.25 }
};

function ExamModal({ exam, onClose, onSave }) {
    const [form, setForm] = useState(exam ? {
        ...exam,
        startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
        endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
    } : EMPTY_EXAM);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (exam?._id) {
                await api.put(`/exams/${exam._id}`, form);
                toast.success('Exam updated!');
            } else {
                await api.post('/exams', form);
                toast.success('Exam created!');
            }
            onSave();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save exam');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h2 className="modal-title">{exam?._id ? 'Edit Exam' : 'Create New Exam'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Exam Title *</label>
                            <input className="form-input" value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Mid-Term Mathematics" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input className="form-input" value={form.subject}
                                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required placeholder="e.g. Mathematics" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duration (minutes) *</label>
                                <input className="form-input" type="number" min={1} max={480} value={form.duration}
                                    onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" rows={2} value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description..." style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Total Marks *</label>
                                <input className="form-input" type="number" min={1} value={form.totalMarks}
                                    onChange={e => setForm(p => ({ ...p, totalMarks: +e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Passing Marks *</label>
                                <input className="form-input" type="number" min={0} value={form.passingMarks}
                                    onChange={e => setForm(p => ({ ...p, passingMarks: +e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Start Time *</label>
                                <input className="form-input" type="datetime-local" value={form.startTime}
                                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time *</label>
                                <input className="form-input" type="datetime-local" value={form.endTime}
                                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Max Attempts</label>
                                <input className="form-input" type="number" min={1} value={form.maxAttempts}
                                    onChange={e => setForm(p => ({ ...p, maxAttempts: +e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.shuffleQuestions}
                                    onChange={e => setForm(p => ({ ...p, shuffleQuestions: e.target.checked }))} />
                                <span>Shuffle Questions</span>
                            </label>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.shuffleOptions}
                                    onChange={e => setForm(p => ({ ...p, shuffleOptions: e.target.checked }))} />
                                <span>Shuffle Options</span>
                            </label>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.randomQuestions}
                                    onChange={e => setForm(p => ({ ...p, randomQuestions: e.target.checked }))} />
                                <span>Random Question Selection</span>
                            </label>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.showResults}
                                    onChange={e => setForm(p => ({ ...p, showResults: e.target.checked }))} />
                                <span>Show Results Immediately</span>
                            </label>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.negativeMarking?.enabled}
                                    onChange={e => setForm(p => ({ ...p, negativeMarking: { ...p.negativeMarking, enabled: e.target.checked } }))} />
                                <span>Negative Marking</span>
                            </label>
                        </div>
                        {form.randomQuestions && (
                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label className="form-label">Questions to Select <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(pick N random from pool)</span></label>
                                <input className="form-input" type="number" min={1} style={{ maxWidth: 160 }}
                                    value={form.questionsToSelect}
                                    onChange={e => setForm(p => ({ ...p, questionsToSelect: e.target.value ? +e.target.value : '' }))}
                                    placeholder="e.g. 20" />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : exam?._id ? 'Update Exam' : 'Create Exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Exams() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [modal, setModal] = useState(null);

    const isStaff = user?.role === 'faculty' || user?.role === 'admin';

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams');
            // Backend spreads at top level: { success, message, exams, pagination }
            setExams(res.data.exams || []);
        } catch { toast.error('Failed to load exams'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExams(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this exam?')) return;
        try {
            await api.delete(`/exams/${id}`);
            toast.success('Exam deleted');
            setExams(p => p.filter(e => e._id !== id));
        } catch { toast.error('Failed to delete exam'); }
    };

    const handlePublish = async (id) => {
        try {
            await api.patch(`/exams/${id}/publish`);
            toast.success('Exam published!');
            fetchExams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to publish'); }
    };

    const filtered = exams.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.subject.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || e.status === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isStaff ? 'My Exams' : 'Available Exams'}</h1>
                    <p className="page-subtitle">{isStaff ? `${exams.length} total exam${exams.length !== 1 ? 's' : ''}` : 'Browse and take your exams'}</p>
                </div>
                {isStaff && (
                    <button className="btn btn-primary" onClick={() => setModal('create')} id="create-exam-btn">
                        <Plus size={16} /> Create Exam
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-box">
                    <Search size={15} />
                    <input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="tabs" style={{ marginBottom: 0 }}>
                    {['all', 'draft', 'published', 'active', 'completed'].map(s => (
                        <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Exams Grid */}
            {loading ? (
                <div className="exam-grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><BookOpen size={28} /></div>
                    <div className="empty-state-title">No exams found</div>
                    <div className="empty-state-text">{search ? 'Try a different search.' : isStaff ? 'Create your first exam to get started.' : 'No exams available yet.'}</div>
                    {isStaff && <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Create Exam</button>}
                </div>
            ) : (
                <div className="exam-grid">
                    {filtered.map(exam => (
                        <div key={exam._id} className="exam-card">
                            <div className="exam-card-header">
                                <div>
                                    <div className="exam-card-subject">{exam.subject}</div>
                                    <div className="exam-card-title">{exam.title}</div>
                                </div>
                                <span className={`badge badge-${exam.status}`}>{exam.status}</span>
                            </div>

                            {exam.description && <div className="exam-card-desc">{exam.description}</div>}

                            <div className="exam-meta">
                                <div className="exam-meta-item"><Clock size={12} /> {exam.duration} min</div>
                                <div className="exam-meta-item"><BookOpen size={12} /> {exam.totalMarks} marks</div>
                                <div className="exam-meta-item">Pass: {exam.passingMarks}</div>
                                {isStaff && exam.questionCount !== undefined && (
                                    <div className="exam-meta-item"><FileQuestion size={12} /> {exam.questionCount ?? 0} Qs</div>
                                )}
                            </div>

                            {/* Faculty: created by info */}
                            {isStaff && exam.createdBy && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                                    By {exam.createdBy.name}
                                </div>
                            )}

                            <div className="exam-card-footer">
                                {isStaff ? (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button className="btn btn-secondary btn-sm"
                                            onClick={() => navigate(`/questions?examId=${exam._id}`)}>
                                            <FileQuestion size={13} /> Questions
                                        </button>
                                        <button className="btn btn-secondary btn-sm"
                                            onClick={() => navigate(`/results?examId=${exam._id}`)}>
                                            <Users size={13} /> Results
                                        </button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(exam)}>
                                            <Edit2 size={13} /> Edit
                                        </button>
                                        {exam.status === 'draft' && (
                                            <button className="btn btn-success btn-sm" onClick={() => handlePublish(exam._id)}>
                                                <Send size={13} /> Publish
                                            </button>
                                        )}
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exam._id)}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {(exam.status === 'published' || exam.status === 'active') ? (
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => navigate(`/take-exam/${exam._id}`)}>
                                                Start Exam →
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not available yet</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(modal === 'create' || (modal && modal._id)) && (
                <ExamModal
                    exam={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={() => { setModal(null); fetchExams(); }}
                />
            )}
        </div>
    );
}
