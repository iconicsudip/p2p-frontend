import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
        const token = localStorage.getItem('token');

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
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as { error?: string };

            switch (status) {
                case 401:
                    message.error('Session expired. Please login again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;
                case 403:
                    message.error('You do not have permission to perform this action.');
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
        } else if (error.request) {
            message.error('Network error. Please check your connection.');
        } else {
            message.error('An unexpected error occurred.');
        }

        return Promise.reject(error);
    }
);

export default api;
