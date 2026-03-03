import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    BookOpen, Plus, Users, Copy, Check, X, Hash,
    Trash2, LogOut, ChevronDown, ChevronUp, Link2, UserMinus,
    Bell, Pin, PinOff, Megaphone, Calendar, ChevronRight
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────────── */
function CodeBadge({ code }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <span onClick={copy} title="Click to copy" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 8, padding: '4px 10px', fontFamily: 'monospace',
            fontSize: 15, fontWeight: 700, letterSpacing: 3, color: 'var(--accent-primary)',
            cursor: 'pointer', transition: 'all 0.2s',
        }}>
            {code}
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} style={{ opacity: 0.6 }} />}
        </span>
    );
}

function InviteLink({ code }) {
    const [copied, setCopied] = useState(false);
    const link = `${window.location.origin}/courses?code=${code}`;
    const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <button className="btn btn-secondary btn-sm" onClick={copy} style={{ gap: 6 }}>
            {copied ? <><Check size={13} /> Copied!</> : <><Link2 size={13} /> Copy invite link</>}
        </button>
    );
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── Announcement Panel ────────────────────────────────── */
function AnnouncementPanel({ courseId, isCreator, onClose }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', pinned: false });
    const [posting, setPosting] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const res = await api.get(`/courses/${courseId}/announcements`);
            setAnnouncements(res.data.announcements || []);
        } catch { toast.error('Failed to load announcements'); }
        finally { setLoading(false); }
    }, [courseId]);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

    const handlePost = async (e) => {
        e.preventDefault();
        setPosting(true);
        try {
            const res = await api.post(`/courses/${courseId}/announcements`, form);
            setAnnouncements(prev => [res.data.announcement, ...prev]);
            setForm({ title: '', content: '', pinned: false });
            setShowForm(false);
            toast.success('Announcement posted!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to post'); }
        finally { setPosting(false); }
    };

    const handleDelete = async (annId) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/courses/${courseId}/announcements/${annId}`);
            setAnnouncements(prev => prev.filter(a => a._id !== annId));
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const handlePin = async (annId) => {
        try {
            const res = await api.patch(`/courses/${courseId}/announcements/${annId}/pin`);
            setAnnouncements(prev => prev.map(a => a._id === annId ? { ...a, pinned: res.data.announcement.pinned } : a)
                .sort((a, b) => b.pinned - a.pinned || new Date(b.createdAt) - new Date(a.createdAt)));
            toast.success(res.data.message);
        } catch { toast.error('Failed to toggle pin'); }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Megaphone size={18} color="var(--accent-primary)" /> Announcements
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {isCreator && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)} style={{ gap: 6 }}>
                                <Plus size={14} /> New
                            </button>
                        )}
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Create form */}
                {showForm && (
                    <form onSubmit={handlePost} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16, flexShrink: 0 }}>
                        <div className="form-group">
                            <input className="form-input" placeholder="Announcement title *" value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <textarea className="form-input" rows={4} placeholder="Write your announcement..." value={form.content}
                                onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required style={{ resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} />
                                <span>Pin this announcement</span>
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={posting}>
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</div>
                    ) : announcements.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <p>No announcements yet.</p>
                            {isCreator && <p style={{ fontSize: 13 }}>Click "+ New" to post one.</p>}
                        </div>
                    ) : (
                        announcements.map(ann => (
                            <div key={ann._id} style={{
                                background: ann.pinned ? 'rgba(99,102,241,0.06)' : 'var(--bg-secondary)',
                                border: `1px solid ${ann.pinned ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                                borderRadius: 10, padding: '14px 16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            {ann.pinned && <Pin size={12} color="var(--accent-primary)" />}
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>{ann.title}</span>
                                        </div>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                                            {ann.content}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                                            <Calendar size={11} />
                                            {formatDate(ann.createdAt)}
                                            <span>· by {ann.author?.name}</span>
                                        </div>
                                    </div>
                                    {isCreator && (
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button style={{ background: 'none', border: 'none', color: ann.pinned ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                                                title={ann.pinned ? 'Unpin' : 'Pin'} onClick={() => handlePin(ann._id)}>
                                                {ann.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                            </button>
                                            <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                                onClick={() => handleDelete(ann._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Faculty Course Card ────────────────────────────────── */
function FacultyCourseCard({ course, onDelete, onRemoveStudent }) {
    const [expanded, setExpanded] = useState(false);
    const [annPanel, setAnnPanel] = useState(false);

    return (
        <>
            <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>{course.name}</span>
                            <span className="badge badge-blue">{course.subject}</span>
                        </div>
                        {course.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>{course.description}</p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Course Code:</span>
                            <CodeBadge code={course.code} />
                            <InviteLink code={course.code} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setAnnPanel(true)} style={{ gap: 5 }}>
                            <Megaphone size={13} /> Announce
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(e => !e)} style={{ gap: 5 }}>
                            <Users size={13} /> {course.students?.length ?? 0}
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                            onClick={() => onDelete(course._id)}><Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        {!course.students?.length ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                                No students yet. Share the course code!
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {course.students.map(s => (
                                    <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                        <div>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{s.email}</span>
                                            {s.enrollmentNo && <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>· #{s.enrollmentNo}</span>}
                                        </div>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                                            title="Remove" onClick={() => onRemoveStudent(course._id, s._id, s.name)}>
                                            <UserMinus size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {annPanel && (
                <AnnouncementPanel
                    courseId={course._id}
                    isCreator={true}
                    onClose={() => setAnnPanel(false)}
                />
            )}
        </>
    );
}

/* ─── Student Course Card ───────────────────────────────── */
function StudentCourseCard({ course, onLeave }) {
    const [annPanel, setAnnPanel] = useState(false);

    return (
        <>
            <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>{course.name}</span>
                            <span className="badge badge-blue">{course.subject}</span>
                        </div>
                        {course.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{course.description}</p>
                        )}
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            By <strong style={{ color: 'var(--text-secondary)' }}>{course.createdBy?.name}</strong>
                            {course.createdBy?.department && ` · ${course.createdBy.department}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setAnnPanel(true)} style={{ gap: 6 }}>
                            <Bell size={13} /> Announcements
                        </button>
                        <button className="btn btn-sm"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                            onClick={() => onLeave(course._id, course.name)}>
                            <LogOut size={13} /> Leave
                        </button>
                    </div>
                </div>
            </div>

            {annPanel && (
                <AnnouncementPanel
                    courseId={course._id}
                    isCreator={false}
                    onClose={() => setAnnPanel(false)}
                />
            )}
        </>
    );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function Courses() {
    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', subject: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data.courses || []);
        } catch { toast.error('Failed to load courses'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/courses', createForm);
            setCourses(prev => [res.data.course, ...prev]);
            setCreateForm({ name: '', subject: '', description: '' });
            setShowCreate(false);
            toast.success(`Course created! Code: ${res.data.course.code}`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create course'); }
        finally { setCreating(false); }
    };

    const handleDelete = async (courseId) => {
        if (!confirm('Delete this course? This cannot be undone.')) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
            toast.success('Course deleted');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    };

    const handleRemoveStudent = async (courseId, studentId, name) => {
        if (!confirm(`Remove ${name}?`)) return;
        try {
            await api.delete(`/courses/${courseId}/students/${studentId}`);
            setCourses(prev => prev.map(c =>
                c._id === courseId ? { ...c, students: c.students.filter(s => s._id !== studentId) } : c
            ));
            toast.success(`${name} removed`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setJoining(true);
        try {
            const res = await api.post('/courses/join', { code: joinCode.trim() });
            setCourses(prev => [res.data.course, ...prev]);
            setJoinCode('');
            toast.success(`Joined "${res.data.course.name}"!`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to join'); }
        finally { setJoining(false); }
    };

    const handleLeave = async (courseId, name) => {
        if (!confirm(`Leave "${name}"?`)) return;
        try {
            await api.delete(`/courses/${courseId}/leave`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
            toast.success(`Left "${name}"`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                        {isStudent ? 'My Courses' : 'Manage Courses'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {isStudent
                            ? 'View course announcements and join using a code from your faculty.'
                            : 'Create courses, post announcements, and manage enrolled students.'}
                    </p>
                </div>
                {!isStudent && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ gap: 8 }}>
                        <Plus size={16} /> Create Course
                    </button>
                )}
            </div>

            {/* Student: Join box */}
            {isStudent && (
                <div className="card" style={{ marginBottom: 28 }}>
                    <div className="card-header" style={{ marginBottom: 16 }}>
                        <div>
                            <div className="card-title">Join a Course</div>
                            <div className="card-subtitle">Enter the 6-character code from your faculty</div>
                        </div>
                    </div>
                    <form onSubmit={handleJoin} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                            <Hash size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: 36, fontFamily: 'monospace', letterSpacing: 3, fontSize: 16, textTransform: 'uppercase' }}
                                placeholder="AB3X9Z"
                                value={joinCode}
                                maxLength={6}
                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                id="join-code-input"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={joining || joinCode.length !== 6} style={{ gap: 8 }}>
                            {joining ? 'Joining...' : <><Plus size={15} /> Join</>}
                        </button>
                    </form>
                </div>
            )}

            {/* Course list */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            ) : courses.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><BookOpen size={28} /></div>
                        <div className="empty-state-title">{isStudent ? 'No courses joined yet' : 'No courses created yet'}</div>
                        <div className="empty-state-text">
                            {isStudent ? 'Enter a course code to join your first course.' : 'Click "Create Course" to set up your first course.'}
                        </div>
                        {!isStudent && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                                <Plus size={14} /> Create Course
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {courses.map(course => isStudent
                        ? <StudentCourseCard key={course._id} course={course} onLeave={handleLeave} />
                        : <FacultyCourseCard key={course._id} course={course} onDelete={handleDelete} onRemoveStudent={handleRemoveStudent} />
                    )}
                </div>
            )}

            {/* Create Course Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, animation: 'slideUp 0.25s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Create New Course</h2>
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowCreate(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Course Name *</label>
                                <input className="form-input" placeholder="e.g. Introduction to Algorithms" value={createForm.name}
                                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required id="course-name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input className="form-input" placeholder="e.g. Computer Science" value={createForm.subject}
                                    onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))} required id="course-subject" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(optional)</span></label>
                                <textarea className="form-input" style={{ minHeight: 80, resize: 'vertical' }} placeholder="Brief description..."
                                    value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} id="course-desc" />
                            </div>
                            <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                                💡 A unique 6-character course code will be auto-generated for you to share with students.
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating} id="create-course-submit">
                                    {creating ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
