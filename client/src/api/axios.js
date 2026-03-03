import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('evalx_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const isAuthRoute = err.config?.url?.includes('/auth/login') ||
            err.config?.url?.includes('/auth/register');
        const hasToken = !!localStorage.getItem('evalx_token');

        // Only force-redirect if a logged-in user's session expired on a non-auth route
        if (err.response?.status === 401 && hasToken && !isAuthRoute) {
            localStorage.removeItem('evalx_token');
            localStorage.removeItem('evalx_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
