import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    Plus, Trash2, X, BookOpen, CheckCircle, AlertCircle, ChevronRight,
    Code2, FileText, Upload, Download, Database, Search, Filter,
    ArrowRight, Copy, RefreshCw
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────── */
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const TYPE_LABELS = {
    mcq: 'MCQ', multi_select: 'MSQ', true_false: 'True/False',
    descriptive: 'Descriptive', coding: 'Coding',
};
const TYPE_COLORS = {
    mcq: 'var(--accent-primary)', multi_select: '#06b6d4',
    true_false: '#f59e0b', descriptive: '#10b981', coding: '#f43f5e',
};
const EMPTY_Q = {
    questionText: '', questionType: 'mcq',
    options: [
        { text: '', isCorrect: false }, { text: '', isCorrect: false },
        { text: '', isCorrect: false }, { text: '', isCorrect: false },
    ],
    modelAnswer: '', marks: 1, difficulty: 'medium',
    topic: '', subject: '', explanation: '', codeLanguage: 'javascript',
    testCases: [],
};

/* ─── Type chip helper ─────────────────────────────── */
function TypeChip({ type }) {
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            border: `1px solid ${TYPE_COLORS[type] || 'var(--border-color)'}20`,
            background: `${TYPE_COLORS[type] || 'var(--border-color)'}18`,
            color: TYPE_COLORS[type] || 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
            {TYPE_LABELS[type] || type}
        </span>
    );
}

/* ─── Question Modal ──────────────────────────────── */
function QuestionModal({ examId, question, bankMode, onClose, onSave }) {
    const [form, setForm] = useState(question
        ? { ...EMPTY_Q, ...question }
        : { ...EMPTY_Q });
    const [loading, setLoading] = useState(false);
    const [newTestCase, setNewTestCase] = useState({ input: '', expectedOutput: '', marks: 1, isHidden: false });

    const isChoice = ['mcq', 'multi_select', 'true_false'].includes(form.questionType);
    const isOpen = ['descriptive', 'coding'].includes(form.questionType);

    const handleTypeChange = (type) => {
        let options = form.options;
        if (type === 'true_false') options = [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }];
        else if (['mcq', 'multi_select'].includes(type) && form.questionType === 'true_false') options = EMPTY_Q.options;
        setForm(p => ({ ...p, questionType: type, options }));
    };

    const setOption = (i, field, value) => {
        setForm(p => {
            const options = [...p.options];
            if (field === 'isCorrect' && p.questionType === 'mcq') {
                options.forEach((o, j) => { options[j] = { ...o, isCorrect: j === i }; });
            } else {
                options[i] = { ...options[i], [field]: value };
            }
            return { ...p, options };
        });
    };

    const addTestCase = () => {
        if (!newTestCase.expectedOutput.trim()) { toast.error('Expected output is required'); return; }
        setForm(p => ({ ...p, testCases: [...p.testCases, { ...newTestCase }] }));
        setNewTestCase({ input: '', expectedOutput: '', marks: 1, isHidden: false });
    };

    const removeTestCase = (i) => setForm(p => ({ ...p, testCases: p.testCases.filter((_, j) => j !== i) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isChoice && !form.options.some(o => o.isCorrect)) {
            toast.error('Mark at least one correct answer'); return;
        }
        setLoading(true);
        const payload = {
            questionText: form.questionText, questionType: form.questionType,
            marks: form.marks, difficulty: form.difficulty,
            topic: form.topic, subject: form.subject, explanation: form.explanation,
            ...(isChoice ? { options: form.options } : {}),
            ...(isOpen ? {
                modelAnswer: form.modelAnswer,
                ...(form.questionType === 'coding' ? { codeLanguage: form.codeLanguage, testCases: form.testCases } : {}),
            } : {}),
        };
        try {
            if (question?._id) {
                await api.put(`/questions/edit/${question._id}`, payload);
                toast.success('Updated!');
            } else if (bankMode) {
                await api.post('/questions/bank', payload);
                toast.success('Added to bank!');
            } else {
                await api.post(`/questions/${examId}`, payload);
                toast.success('Question added!');
            }
            onSave();
        } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 680 }}>
                <div className="modal-header">
                    <h2 className="modal-title">{question?._id ? 'Edit Question' : bankMode ? 'Add to Bank' : 'Add Question'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Question *</label>
                            <textarea className="form-input" rows={3} required value={form.questionText}
                                onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
                                placeholder="Enter the question..." style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={form.questionType} onChange={e => handleTypeChange(e.target.value)}>
                                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Marks</label>
                                <input className="form-input" type="number" min={1} value={form.marks}
                                    onChange={e => setForm(p => ({ ...p, marks: +e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Difficulty</label>
                                <select className="form-select" value={form.difficulty}
                                    onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Subject <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(for bank)</span></label>
                                <input className="form-input" placeholder="e.g. Mathematics" value={form.subject}
                                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Topic / Chapter</label>
                                <input className="form-input" placeholder="e.g. Calculus" value={form.topic}
                                    onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
                            </div>
                        </div>

                        {/* MCQ / MSQ Options */}
                        {['mcq', 'multi_select'].includes(form.questionType) && (
                            <div className="form-group">
                                <label className="form-label">Options *
                                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                                        {form.questionType === 'mcq' ? '(click letter = single correct)' : '(toggle multiple correct)'}
                                    </span>
                                </label>
                                {form.options.map((opt, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                                        <button type="button" onClick={() => setOption(i, 'isCorrect', !opt.isCorrect)}
                                            style={{
                                                width: 34, height: 34, borderRadius: '50%', border: '2px solid', flexShrink: 0,
                                                borderColor: opt.isCorrect ? 'var(--accent-success)' : 'var(--border-color)',
                                                background: opt.isCorrect ? 'rgba(16,185,129,0.15)' : 'var(--bg-input)',
                                                color: opt.isCorrect ? 'var(--accent-success)' : 'var(--text-muted)',
                                                cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                                            }}>
                                            {OPTION_LABELS[i]}
                                        </button>
                                        <input className="form-input" placeholder={`Option ${OPTION_LABELS[i]}`}
                                            value={opt.text} onChange={e => setOption(i, 'text', e.target.value)} required />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* True/False */}
                        {form.questionType === 'true_false' && (
                            <div className="form-group">
                                <label className="form-label">Correct Answer</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {['True', 'False'].map((val, i) => (
                                        <button key={val} type="button"
                                            onClick={() => setForm(p => ({ ...p, options: p.options.map((o, j) => ({ ...o, isCorrect: j === i })) }))}
                                            style={{
                                                padding: '10px 28px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
                                                borderColor: form.options[i]?.isCorrect ? 'var(--accent-success)' : 'var(--border-color)',
                                                background: form.options[i]?.isCorrect ? 'rgba(16,185,129,0.12)' : 'var(--bg-input)',
                                                color: form.options[i]?.isCorrect ? 'var(--accent-success)' : 'var(--text-secondary)',
                                                fontWeight: 700, transition: 'all 0.2s',
                                            }}>
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Descriptive */}
                        {form.questionType === 'descriptive' && (
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileText size={14} /> Model Answer <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(for faculty reference)</span>
                                </label>
                                <textarea className="form-input" rows={5} value={form.modelAnswer}
                                    onChange={e => setForm(p => ({ ...p, modelAnswer: e.target.value }))}
                                    placeholder="Expected answer..." style={{ resize: 'vertical' }} />
                            </div>
                        )}

                        {/* Coding */}
                        {form.questionType === 'coding' && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Language</label>
                                        <select className="form-select" value={form.codeLanguage}
                                            onChange={e => setForm(p => ({ ...p, codeLanguage: e.target.value }))}>
                                            {['javascript', 'python', 'java', 'c', 'cpp'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Code2 size={14} /> Model Solution
                                    </label>
                                    <textarea className="form-input" rows={6} value={form.modelAnswer}
                                        onChange={e => setForm(p => ({ ...p, modelAnswer: e.target.value }))}
                                        placeholder="// Expected solution..." style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
                                </div>
                                {/* Test Cases */}
                                <div className="form-group">
                                    <label className="form-label">Test Cases <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(for auto-evaluation)</span></label>
                                    {form.testCases.map((tc, i) => (
                                        <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                                    TC {i + 1} · {tc.marks}pt {tc.isHidden ? '· 🔒 Hidden' : ''}
                                                </div>
                                                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Input: </span>{tc.input || '(none)'}
                                                </div>
                                                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    <span style={{ color: 'var(--accent-success)' }}>Expected: </span>{tc.expectedOutput}
                                                </div>
                                            </div>
                                            <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} onClick={() => removeTestCase(i)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 8, padding: 12 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, marginBottom: 8 }}>
                                            <input className="form-input" style={{ fontFamily: 'monospace', fontSize: 12 }} placeholder="Input (optional)"
                                                value={newTestCase.input} onChange={e => setNewTestCase(p => ({ ...p, input: e.target.value }))} />
                                            <input className="form-input" style={{ fontFamily: 'monospace', fontSize: 12 }} placeholder="Expected output *"
                                                value={newTestCase.expectedOutput} onChange={e => setNewTestCase(p => ({ ...p, expectedOutput: e.target.value }))} />
                                            <input className="form-input" type="number" min={1} style={{ width: 64 }} value={newTestCase.marks}
                                                onChange={e => setNewTestCase(p => ({ ...p, marks: +e.target.value }))} title="Marks" />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={newTestCase.isHidden}
                                                    onChange={e => setNewTestCase(p => ({ ...p, isHidden: e.target.checked }))} />
                                                Hidden
                                            </label>
                                        </div>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addTestCase} style={{ gap: 6 }}>
                                            <Plus size={13} /> Add Test Case
                                        </button>
                                    </div>
                                    <p className="form-hint">Visible test cases shown to students as examples. Hidden ones used only for evaluation.</p>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="form-label">Explanation <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(optional)</span></label>
                            <input className="form-input" value={form.explanation}
                                onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                                placeholder="Shown after submission" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} id="save-question-btn">
                            {loading ? 'Saving...' : question?._id ? 'Update' : bankMode ? 'Add to Bank' : 'Add Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── CSV Bulk Upload Modal ──────────────────────────── */
const CSV_TEMPLATE = `questionText,questionType,optionA,optionB,optionC,optionD,correctOptions,marks,difficulty,topic,explanation
"What is 2+2?",mcq,3,4,5,6,B,1,easy,Arithmetic,The answer is 4
"Which are prime?",multi_select,2,3,4,6,"A,B",2,medium,Numbers,2 and 3 are prime
"Is Earth round?",true_false,,,,,A,1,easy,General,Yes
"Explain Newton's laws",descriptive,,,,,,,2,medium,Physics,
"Write a bubble sort",coding,,,,,,,5,hard,Sorting,`;

function CSVUploadModal({ examId, onClose, onUploaded }) {
    const [csv, setCsv] = useState('');
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Proper CSV row parser that handles quoted fields and empty cells
    const parseCSVLine = (line) => {
        const result = [];
        let inQuote = false;
        let cell = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuote && line[i + 1] === '"') { cell += '"'; i++; } // escaped quote
                else inQuote = !inQuote;
            } else if (ch === ',' && !inQuote) {
                result.push(cell.trim()); cell = '';
            } else {
                cell += ch;
            }
        }
        result.push(cell.trim());
        return result;
    };

    const parseCSV = (text) => {
        setError('');
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) { setError('CSV must have a header row and at least one question.'); return; }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            const [questionText, questionType, optA, optB, optC, optD, correctOpts, marks, difficulty, topic, explanation] = cols;
            if (!questionText) continue;

            const qType = (questionType || 'mcq').toLowerCase().trim();
            const isChoice = ['mcq', 'multi_select', 'true_false'].includes(qType);

            let options = [];
            if (isChoice) {
                const corrects = (correctOpts || '').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
                if (qType === 'true_false') {
                    options = [
                        { text: 'True', isCorrect: corrects.includes('A') || corrects.includes('TRUE') },
                        { text: 'False', isCorrect: corrects.includes('B') || corrects.includes('FALSE') },
                    ];
                } else {
                    const optMap = [['A', optA], ['B', optB], ['C', optC], ['D', optD]];
                    optMap.forEach(([label, text]) => {
                        if (text && text.trim()) {
                            options.push({ text: text.trim(), isCorrect: corrects.includes(label) });
                        }
                    });
                }
                // Ensure at least one option is marked correct
                if (options.length > 0 && !options.some(o => o.isCorrect)) {
                    options[0].isCorrect = true; // fallback: mark first as correct
                }
            }

            rows.push({
                questionText: questionText.trim(),
                questionType: qType,
                ...(isChoice ? { options } : {}),
                marks: parseInt(marks) || 1,
                difficulty: ['easy', 'medium', 'hard'].includes((difficulty || '').toLowerCase()) ? difficulty.toLowerCase() : 'medium',
                topic: (topic || '').trim(),
                explanation: (explanation || '').trim(),
            });
        }
        if (rows.length === 0) setError('No valid questions found in the CSV.');
        setPreview(rows);
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { const text = ev.target.result; setCsv(text); parseCSV(text); };
        reader.readAsText(file);
    };

    const [uploadErrors, setUploadErrors] = useState([]);

    const handleUpload = async () => {
        if (!preview.length) return;
        setLoading(true);
        setUploadErrors([]);
        try {
            const res = await api.post(`/questions/${examId}/bulk`, { questions: preview });
            const { count, skipped, errors: errs } = res.data;
            if (skipped > 0) {
                toast.success(`${count} uploaded, ${skipped} skipped`);
                setUploadErrors(errs || []);
            } else {
                toast.success(`${count} questions uploaded!`);
                onUploaded();
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Import failed';
            toast.error(msg);
            // Show detailed errors if provided
            if (err.response?.data?.errors) setUploadErrors(err.response.data.errors);
        }
        finally { setLoading(false); }
    };

    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'questions_template.csv'; a.click();
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 720 }}>
                <div className="modal-header">
                    <h2 className="modal-title"><Upload size={18} /> Bulk Upload via CSV</h2>
                    <button className="modal-close" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                        <label htmlFor="csv-upload" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: 6 }}>
                            <Upload size={14} /> Choose CSV file
                        </label>
                        <input id="csv-upload" type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFile} />
                        <button className="btn btn-secondary btn-sm" onClick={downloadTemplate} style={{ gap: 6 }}>
                            <Download size={14} /> Download Template
                        </button>
                        {preview.length > 0 && (
                            <span style={{ fontSize: 13, color: 'var(--accent-success)', fontWeight: 600 }}>
                                ✓ {preview.length} questions ready
                            </span>
                        )}
                    </div>

                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

                    {/* Column guide */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>CSV Columns:</div>
                        <code style={{ color: 'var(--accent-primary)', fontSize: 11 }}>
                            questionText, questionType (mcq/multi_select/true_false/descriptive/coding),
                            optionA, optionB, optionC, optionD, correctOptions (A/B/C/A,B),
                            marks, difficulty (easy/medium/hard), topic, explanation
                        </code>
                    </div>

                    {/* Preview */}
                    {preview.length > 0 && (
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {preview.map((q, i) => (
                                <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Q{i + 1}</span>
                                        <TypeChip type={q.questionType} />
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.marks}pt · {q.difficulty}</span>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{q.questionText}</div>
                                    {q.options?.map((o, j) => (
                                        <div key={j} style={{ fontSize: 12, color: o.isCorrect ? 'var(--accent-success)' : 'var(--text-muted)', marginTop: 2 }}>
                                            {o.isCorrect ? '✓' : '○'} {o.text}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Upload errors from server */}
                    {uploadErrors.length > 0 && (
                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: 12, marginTop: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#ef4444', marginBottom: 8 }}>
                                ⚠ {uploadErrors.length} row{uploadErrors.length !== 1 ? 's' : ''} skipped:
                            </div>
                            {uploadErrors.map((e, i) => (
                                <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                    <strong>Row {e.row}:</strong> {e.question} — <span style={{ color: '#ef4444' }}>{e.error}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        {uploadErrors.length > 0 ? 'Close' : 'Cancel'}
                    </button>
                    {uploadErrors.length === 0 && (
                        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!preview.length || loading}>
                            {loading ? 'Uploading...' : `Upload ${preview.length} Questions`}
                        </button>
                    )}
                    {uploadErrors.length > 0 && (
                        <button type="button" className="btn btn-success" onClick={onUploaded}>
                            ✓ Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Question Card ─────────────────────────────────── */
function QuestionCard({ q, idx, onEdit, onDelete }) {
    return (
        <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 36, height: 36, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 14 }}>
                    {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 15, lineHeight: 1.5 }}>{q.questionText}</div>
                    {['mcq', 'multi_select', 'true_false'].includes(q.questionType) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                            {q.options?.map((opt, i) => (
                                <div key={i} style={{
                                    padding: '7px 12px', borderRadius: 8,
                                    background: opt.isCorrect ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
                                    border: `1px solid ${opt.isCorrect ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <span style={{ fontWeight: 700, color: opt.isCorrect ? 'var(--accent-success)' : 'var(--text-muted)', fontSize: 12 }}>
                                        {OPTION_LABELS[i] || i + 1}
                                    </span>
                                    {opt.text}
                                    {opt.isCorrect && <CheckCircle size={12} color="var(--accent-success)" style={{ marginLeft: 'auto' }} />}
                                </div>
                            ))}
                        </div>
                    )}
                    {q.modelAnswer && (
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, fontFamily: q.questionType === 'coding' ? 'monospace' : 'inherit', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2, fontFamily: 'inherit' }}>MODEL ANSWER</span>
                            {q.modelAnswer}
                        </div>
                    )}
                    {q.questionType === 'coding' && q.testCases?.length > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                            🧪 {q.testCases.length} test case{q.testCases.length !== 1 ? 's' : ''}
                            ({q.testCases.filter(tc => tc.isHidden).length} hidden)
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <TypeChip type={q.questionType} />
                        <span className="badge badge-published">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{q.difficulty}</span>
                        {q.topic && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {q.topic}</span>}
                    </div>
                    {q.explanation && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>💡 {q.explanation}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => onEdit(q)} title="Edit"><ChevronRight size={14} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(q._id)} title="Delete"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Questions Page ────────────────────────────── */
export default function Questions() {
    const [searchParams] = useSearchParams();
    const examId = searchParams.get('examId');

    const [tab, setTab] = useState('exam'); // 'exam' | 'bank'
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(examId || '');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null); // null | 'create' | questionObj | 'csv' | 'bank-create'

    // Bank state
    const [bankQuestions, setBankQuestions] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankFilter, setBankFilter] = useState({ subject: '', topic: '', difficulty: '', type: '', search: '' });
    const [selectedBankIds, setSelectedBankIds] = useState([]);

    useEffect(() => {
        api.get('/exams').then(r => setExams(r.data.exams || [])).catch(() => { });
    }, []);

    const loadQuestions = useCallback(() => {
        if (!selectedExam) return setQuestions([]);
        setLoading(true);
        api.get(`/questions/${selectedExam}`)
            .then(r => setQuestions(r.data.questions || []))
            .catch(() => toast.error('Failed to load questions'))
            .finally(() => setLoading(false));
    }, [selectedExam]);

    useEffect(() => { loadQuestions(); }, [loadQuestions]);

    const loadBank = useCallback(() => {
        setBankLoading(true);
        const params = new URLSearchParams(Object.fromEntries(Object.entries(bankFilter).filter(([, v]) => v)));
        api.get(`/questions/bank?${params}`)
            .then(r => setBankQuestions(r.data.questions || []))
            .catch(() => toast.error('Failed to load bank'))
            .finally(() => setBankLoading(false));
    }, [bankFilter]);

    useEffect(() => { if (tab === 'bank') loadBank(); }, [tab, loadBank]);

    const handleDelete = async (qId) => {
        if (!confirm('Delete this question?')) return;
        try {
            await api.delete(`/questions/edit/${qId}`);
            toast.success('Deleted');
            setQuestions(p => p.filter(q => q._id !== qId));
        } catch { toast.error('Failed to delete'); }
    };

    const handleBankDelete = async (qId) => {
        if (!confirm('Remove from bank?')) return;
        try {
            await api.delete(`/questions/edit/${qId}`);
            toast.success('Removed from bank');
            setBankQuestions(p => p.filter(q => q._id !== qId));
        } catch { toast.error('Failed'); }
    };

    const handleImportToExam = async () => {
        if (!selectedExam) { toast.error('Select an exam first'); return; }
        if (!selectedBankIds.length) { toast.error('Select questions to import'); return; }
        try {
            const res = await api.post(`/questions/bank/import/${selectedExam}`, { questionIds: selectedBankIds });
            toast.success(`${res.data.count} questions imported!`);
            setSelectedBankIds([]);
            loadQuestions();
        } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    };

    const toggleBankSelect = (id) => setSelectedBankIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Questions</h1>
                    <p className="page-subtitle">Manage exam questions and question bank</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {tab === 'exam' && selectedExam && (
                        <>
                            <button className="btn btn-secondary" onClick={() => setModal('csv')} style={{ gap: 6 }}>
                                <Upload size={15} /> Bulk Upload
                            </button>
                            <button className="btn btn-primary" onClick={() => setModal('create')} id="add-question-btn" style={{ gap: 6 }}>
                                <Plus size={16} /> Add Question
                            </button>
                        </>
                    )}
                    {tab === 'bank' && (
                        <button className="btn btn-primary" onClick={() => setModal('bank-create')} style={{ gap: 6 }}>
                            <Plus size={16} /> Add to Bank
                        </button>
                    )}
                </div>
            </div>

            {/* Tab switcher */}
            <div className="tabs" style={{ marginBottom: 24 }}>
                <button className={`tab-btn ${tab === 'exam' ? 'active' : ''}`} onClick={() => setTab('exam')}>
                    <BookOpen size={14} /> Exam Questions
                </button>
                <button className={`tab-btn ${tab === 'bank' ? 'active' : ''}`} onClick={() => setTab('bank')}>
                    <Database size={14} /> Question Bank
                </button>
            </div>

            {/* ── EXAM TAB ─────────────────────────────── */}
            {tab === 'exam' && (
                <>
                    {/* Exam Selector */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Select Exam</label>
                            <select className="form-select" value={selectedExam}
                                onChange={e => setSelectedExam(e.target.value)} id="exam-selector">
                                <option value="">-- Choose an exam --</option>
                                {exams.map(e => <option key={e._id} value={e._id}>{e.title} ({e.subject})</option>)}
                            </select>
                        </div>
                    </div>

                    {!selectedExam ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><BookOpen size={28} /></div>
                            <div className="empty-state-title">Select an Exam</div>
                            <div className="empty-state-text">Choose an exam above to view and manage its questions.</div>
                        </div>
                    ) : loading ? (
                        <div className="loading-overlay"><div className="spinner" /></div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BookOpen size={16} color="var(--accent-primary)" />
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{questions.length} Questions</span>
                                </div>
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle size={16} color="var(--accent-success)" />
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{totalMarks} Total Marks</span>
                                </div>
                                {Object.entries(TYPE_LABELS).map(([type]) => {
                                    const count = questions.filter(q => q.questionType === type).length;
                                    if (!count) return null;
                                    return (
                                        <div key={type} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{count}×</span>
                                            <TypeChip type={type} />
                                        </div>
                                    );
                                })}
                            </div>

                            {questions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon"><AlertCircle size={28} /></div>
                                    <div className="empty-state-title">No questions yet</div>
                                    <div className="empty-state-text">Add questions manually or use Bulk Upload.</div>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Add First Question</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setModal('csv')}>Bulk Upload CSV</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {questions.map((q, idx) => (
                                        <QuestionCard key={q._id} q={q} idx={idx}
                                            onEdit={(q) => setModal(q)} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ── BANK TAB ─────────────────────────────── */}
            {tab === 'bank' && (
                <>
                    {/* Filters */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Search</label>
                                <div className="search-box">
                                    <Search size={14} />
                                    <input placeholder="Keywords..." value={bankFilter.search}
                                        onChange={e => setBankFilter(p => ({ ...p, search: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Subject</label>
                                <input className="form-input" placeholder="All subjects" value={bankFilter.subject}
                                    onChange={e => setBankFilter(p => ({ ...p, subject: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Topic</label>
                                <input className="form-input" placeholder="All topics" value={bankFilter.topic}
                                    onChange={e => setBankFilter(p => ({ ...p, topic: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Difficulty</label>
                                <select className="form-select" value={bankFilter.difficulty}
                                    onChange={e => setBankFilter(p => ({ ...p, difficulty: e.target.value }))}>
                                    <option value="">All</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Type</label>
                                <select className="form-select" value={bankFilter.type}
                                    onChange={e => setBankFilter(p => ({ ...p, type: e.target.value }))}>
                                    <option value="">All</option>
                                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={loadBank} style={{ gap: 6 }}>
                                <Filter size={14} /> Apply
                            </button>
                        </div>
                    </div>

                    {/* Import Controls */}
                    {selectedBankIds.length > 0 && (
                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedBankIds.length} selected</span>
                            <select className="form-select" style={{ maxWidth: 280 }} value={selectedExam}
                                onChange={e => setSelectedExam(e.target.value)}>
                                <option value="">-- Select target exam --</option>
                                {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                            </select>
                            <button className="btn btn-primary btn-sm" onClick={handleImportToExam} style={{ gap: 6 }}>
                                <ArrowRight size={14} /> Import to Exam
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBankIds([])}>Clear</button>
                        </div>
                    )}

                    {bankLoading ? (
                        <div className="loading-overlay"><div className="spinner" /></div>
                    ) : bankQuestions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Database size={28} /></div>
                            <div className="empty-state-title">Question Bank is Empty</div>
                            <div className="empty-state-text">Add standalone questions to reuse across multiple exams.</div>
                            <button className="btn btn-primary btn-sm" onClick={() => setModal('bank-create')}>
                                <Plus size={14} /> Add to Bank
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {bankQuestions.map((q, idx) => (
                                <div key={q._id} style={{
                                    background: selectedBankIds.includes(q._id) ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)',
                                    border: `1px solid ${selectedBankIds.includes(q._id) ? 'rgba(99,102,241,0.3)' : 'var(--border-color)'}`,
                                    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }} onClick={() => toggleBankSelect(q._id)}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={{
                                            width: 20, height: 20, borderRadius: 5, border: '2px solid', marginTop: 2, flexShrink: 0,
                                            borderColor: selectedBankIds.includes(q._id) ? 'var(--accent-primary)' : 'var(--border-color)',
                                            background: selectedBankIds.includes(q._id) ? 'var(--accent-primary)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12,
                                        }}>
                                            {selectedBankIds.includes(q._id) ? '✓' : ''}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 6 }}>{q.questionText}</div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <TypeChip type={q.questionType} />
                                                <span className="badge badge-draft">{q.marks}pt</span>
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{q.difficulty}</span>
                                                {q.subject && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {q.subject}</span>}
                                                {q.topic && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {q.topic}</span>}
                                            </div>
                                        </div>
                                        <button className="btn btn-danger btn-sm btn-icon" onClick={e => { e.stopPropagation(); handleBankDelete(q._id); }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {(modal === 'create' || (modal && modal._id && tab === 'exam')) && (
                <QuestionModal examId={selectedExam} question={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)} onSave={() => { setModal(null); loadQuestions(); }} />
            )}
            {modal === 'bank-create' && (
                <QuestionModal bankMode examId={null} question={null}
                    onClose={() => setModal(null)} onSave={() => { setModal(null); loadBank(); }} />
            )}
            {modal && modal._id && tab === 'bank' && (
                <QuestionModal bankMode examId={null} question={modal}
                    onClose={() => setModal(null)} onSave={() => { setModal(null); loadBank(); }} />
            )}
            {modal === 'csv' && (
                <CSVUploadModal examId={selectedExam} onClose={() => setModal(null)} onUploaded={() => { setModal(null); loadQuestions(); }} />
            )}
        </div>
    );
}
