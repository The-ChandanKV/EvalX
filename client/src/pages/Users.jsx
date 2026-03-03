import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Shield, GraduationCap, BookOpen } from 'lucide-react';

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/auth/users')
            .then(r => setUsers(r.data.users || r.data.data?.users || []))
            .catch(() => toast.error('Failed to load users'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u => {
        const matchRole = filter === 'all' || u.role === filter;
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        return matchRole && matchSearch;
    });

    const counts = {
        all: users.length,
        student: users.filter(u => u.role === 'student').length,
        faculty: users.filter(u => u.role === 'faculty').length,
        admin: users.filter(u => u.role === 'admin').length,
    };

    return (
        <div className="page-container" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage all platform users</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card indigo">
                    <div className="stat-icon indigo"><UsersIcon size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{counts.all}</div><div className="stat-label">Total Users</div></div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon blue"><GraduationCap size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{counts.student}</div><div className="stat-label">Students</div></div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><BookOpen size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{counts.faculty}</div><div className="stat-label">Faculty</div></div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-icon amber"><Shield size={22} /></div>
                    <div className="stat-info"><div className="stat-value">{counts.admin}</div><div className="stat-label">Admins</div></div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="search-box">
                            <UsersIcon size={15} />
                            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="tabs" style={{ marginBottom: 0 }}>
                            {['all', 'student', 'faculty', 'admin'].map(r => (
                                <button key={r} className={`tab-btn ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)} ({counts[r]})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-overlay"><div className="spinner" /></div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Enrollment No.</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => {
                                    const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <tr key={u._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{u.department || '-'}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{u.enrollmentNo || '-'}</td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: u.isActive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(u.createdAt)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
