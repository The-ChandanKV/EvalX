import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, BookOpen, FileQuestion, ClipboardList,
    Users, LogOut, GraduationCap, BarChart2, Library, PenLine
} from 'lucide-react';

const navItems = {
    student: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Library, label: 'My Courses', path: '/courses' },
        { icon: BookOpen, label: 'Available Exams', path: '/exams' },
        { icon: ClipboardList, label: 'My Attempts', path: '/my-attempts' },
    ],
    faculty: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: BookOpen, label: 'My Exams', path: '/exams' },
        { icon: FileQuestion, label: 'Questions', path: '/questions' },
        { icon: PenLine, label: 'Grading', path: '/grading' },
        { icon: BarChart2, label: 'Results', path: '/results' },
    ],
    admin: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Library, label: 'Courses', path: '/courses' },
        { icon: BookOpen, label: 'All Exams', path: '/exams' },
        { icon: FileQuestion, label: 'Questions', path: '/questions' },
        { icon: PenLine, label: 'Grading', path: '/grading' },
        { icon: Users, label: 'Users', path: '/users' },
        { icon: BarChart2, label: 'Results', path: '/results' },
    ],
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const items = navItems[user?.role] || navItems.student;
    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <GraduationCap size={20} color="#fff" />
                </div>
                <span className="sidebar-logo-text">EvalX</span>
            </div>

            <div className="sidebar-section-label">Navigation</div>
            <nav className="sidebar-nav">
                {items.map(({ icon: Icon, label, path }) => (
                    <div
                        key={path}
                        className={`sidebar-item ${location.pathname === path ? 'active' : ''}`}
                        onClick={() => navigate(path)}
                    >
                        <Icon size={18} />
                        {label}
                    </div>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name}</div>
                        <div className="sidebar-user-role">{user?.role}</div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
