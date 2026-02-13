import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { getSubdomain } from '../utils/subdomain';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get portal-specific token key
const getTokenKey = () => {
    const portal = getSubdomain();
    return portal ? `${portal}_token` : 'token';
};



// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(getTokenKey());

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!error.response) {
            message.error('Network error. Please check your connection.');
            return Promise.reject(error);
        }

        const status = error.response.status;
        const data = error.response.data as { error?: string };

        if (status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const portal = getSubdomain();
                const prefix = portal ? `${portal}_` : '';
                const refreshToken = localStorage.getItem(`${prefix}refreshToken`);

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // We need to use a clean axios instance to avoid infinite loops
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
                const { token } = data;

                localStorage.setItem(`${prefix}token`, token);

                // Update header for the original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }

                processQueue(null, token);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // If refresh fails, logout user
                const portal = getSubdomain();
                const prefix = portal ? `${portal}_` : '';
                localStorage.removeItem(`${prefix}token`);
                localStorage.removeItem(`${prefix}refreshToken`);
                localStorage.removeItem(`${prefix}user`);

                window.location.href = '/login';
                message.error('Session expired. Please login again.');

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        switch (status) {
            /* case 401 handled above */
            case 403:
                message.error('You do not have permission. Logging out...');
                const portal = getSubdomain();
                const prefix = portal ? `${portal}_` : '';
                localStorage.removeItem(`${prefix}token`);
                localStorage.removeItem(`${prefix}refreshToken`);
                localStorage.removeItem(`${prefix}user`);
                window.location.href = '/login';
                break;
            case 404:
                message.error(data.error || 'Resource not found.');
                break;
            case 500:
                message.error('Server error. Please try again later.');
                break;
            default:
                message.error(data.error || 'An error occurred.');
        }

        return Promise.reject(error);
    }
);

export default api;
