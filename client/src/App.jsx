import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Exams from './pages/Exams';
import Questions from './pages/Questions';
import MyAttempts from './pages/MyAttempts';
import TakeExam from './pages/TakeExam';
import Users from './pages/Users';
import Results from './pages/Results';
import Grading from './pages/Grading';
import MyResult from './pages/MyResult';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  // Fallback: also check localStorage to avoid race condition right after login/register
  const storedUser = user ?? (() => {
    try { return JSON.parse(localStorage.getItem('evalx_user')); } catch { return null; }
  })();
  if (!storedUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(storedUser.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
      <Route path="/exams" element={<PrivateRoute><Exams /></PrivateRoute>} />
      <Route path="/questions" element={<PrivateRoute roles={['faculty', 'admin']}><Questions /></PrivateRoute>} />
      <Route path="/my-attempts" element={<PrivateRoute roles={['student']}><MyAttempts /></PrivateRoute>} />
      <Route path="/take-exam/:examId" element={<PrivateRoute roles={['student']}><TakeExam /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
      {/* Faculty/Admin: full results with exam selector */}
      <Route path="/results" element={<PrivateRoute roles={['faculty', 'admin']}><Results /></PrivateRoute>} />
      {/* Students go to /my-attempts for history, then a specific result link */}
      <Route path="/my-result" element={<PrivateRoute roles={['student']}><MyResult /></PrivateRoute>} />
      <Route path="/grading" element={<PrivateRoute roles={['faculty', 'admin']}><Grading /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#131929', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14 },
          success: { iconTheme: { primary: '#10b981', secondary: '#131929' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#131929' } }
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
