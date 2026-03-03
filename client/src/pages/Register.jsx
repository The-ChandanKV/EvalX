import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, Hash } from 'lucide-react';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', enrollmentNo: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created! Welcome to EvalX.');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const IconInput = ({ icon: Icon, ...props }) => (
        <div style={{ position: 'relative' }}>
            <Icon size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 38 }} {...props} />
        </div>
    );

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 500 }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <GraduationCap size={24} color="#fff" />
                    </div>
                    <span className="auth-logo-text">EvalX</span>
                </div>

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Join EvalX to start your learning journey</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <IconInput icon={User} type="text" placeholder="John Doe" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required id="reg-name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={form.role}
                                onChange={e => setForm(p => ({ ...p, role: e.target.value }))} id="reg-role">
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <IconInput icon={Mail} type="email" placeholder="you@example.com" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required id="reg-email" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <IconInput icon={Hash} type="text" placeholder="e.g. Computer Science" value={form.department}
                                onChange={e => setForm(p => ({ ...p, department: e.target.value }))} id="reg-dept" />
                        </div>
                        {form.role === 'student' && (
                            <div className="form-group">
                                <label className="form-label">Enrollment No.</label>
                                <IconInput icon={Hash} type="text" placeholder="e.g. 2024CS001" value={form.enrollmentNo}
                                    onChange={e => setForm(p => ({ ...p, enrollmentNo: e.target.value }))} id="reg-enroll" />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }}
                                type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} id="reg-pass" />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="reg-submit" style={{ marginTop: 8 }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account?{' '}
                    <a onClick={() => navigate('/login')}>Sign in</a>
                </div>
            </div>
        </div>
    );
}
