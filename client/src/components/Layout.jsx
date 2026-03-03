import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';

const pageTitles = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your overview.' },
    '/courses': { title: 'Courses', subtitle: 'Manage courses and student enrollment.' },
    '/exams': { title: 'Exams', subtitle: 'Manage and browse all exams.' },
    '/questions': { title: 'Questions', subtitle: 'Manage exam questions.' },
    '/my-attempts': { title: 'My Attempts', subtitle: 'View your exam history and results.' },
    '/users': { title: 'User Management', subtitle: 'Manage all platform users.' },
    '/results': { title: 'Results', subtitle: 'View and analyze exam results.' },
    '/my-result': { title: 'Exam Result', subtitle: 'Your detailed exam result.' },
    '/grading': { title: 'Manual Grading', subtitle: 'Grade descriptive and coding answers.' },
};

export default function Layout({ children }) {
    const location = useLocation();
    const meta = pageTitles[location.pathname] || { title: 'EvalX', subtitle: '' };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <span className="topbar-title">{meta.title}</span>
                        <span className="topbar-subtitle">{meta.subtitle}</span>
                    </div>
                    <div className="topbar-right">
                        <div style={{
                            fontSize: 12, color: 'var(--accent-success)',
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                            padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 600
                        }}>
                            ● Live
                        </div>
                    </div>
                </header>
                <main style={{ flex: 1, overflow: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
