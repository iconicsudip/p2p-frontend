import api from './api';
import {
    LoginResponse,
    User,
    CreateVendorRequest,
    Request,
    CreateRequestRequest,
    VendorStats,
    MonthlyStats,
    VendorStatsWithUser,
    SystemOverview,
    Notification,
    PaginatedResponse,
} from '../types';

// Authentication APIs
export const authAPI = {
    login: (username: string, password: string) =>
        api.post<LoginResponse>('/auth/login', { username, password }),

    getMe: () =>
        api.get<{ user: User }>('/auth/me'),

    createVendor: (data: CreateVendorRequest) =>
        api.post('/auth/create-vendor', data),

    getAllVendors: (params?: { page?: number; limit?: number }) =>
        api.get<{ vendors: PaginatedResponse<User> }>('/auth/vendors', { params }),

    getVendorCredentials: (id: string) => api.get(`/auth/vendors/${id}/credentials`),

    getAdminBankDetails: () =>
        api.get<{ admin: { name: string; bankDetails?: any; upiId?: string } }>('/auth/admin/bank-details'),

    updateAdminBankDetails: (data: { bankDetails?: any; upiId?: string }) =>
        api.put('/auth/admin/bank-details', data),

    resetPassword: (currentPassword: string, newPassword: string) =>
        api.post<{ message: string; user: User }>('/auth/reset-password', { currentPassword, newPassword }),

    resetUserPassword: (userId: string, newPassword: string) =>
        api.post<{ message: string }>('/auth/admin/reset-password', { userId, newPassword }),

    checkUsernameAvailability: (username: string) =>
        api.get<{ available: boolean }>(`/auth/check-username/${username}`),

    updateProfile: (data: { name: string; username: string }) =>
        api.put<{ message: string; user: User }>('/auth/profile', data),

    forgotPassword: (username: string, newPassword: string) =>
        api.post<{ message: string }>('/auth/forgot-password', { username, newPassword }),

    logout: async () => {
        return api.post('/auth/logout');
    },

    getUserActivity: async (userId: string, params?: { page?: number; limit?: number }) => {
        return api.get(`/auth/activity/${userId}`, { params });
    },
};

// Request APIs
export const requestAPI = {
    createRequest: async (data: Partial<CreateRequestRequest>) => {
        return api.post('/requests', data);
    },

    createAdminWithdrawal: (amount: number) =>
        api.post<{ message: string; request: Request }>('/requests/admin-withdrawal', { amount }),

    getAvailableRequests: (params?: { page?: number; limit?: number; amount?: number; type?: string }) =>
        api.get<{ requests: PaginatedResponse<Request> }>('/requests/available', { params }),

    getMyRequests: (params?: { createdPage?: number; pickedPage?: number; limit?: number; startDate?: string; endDate?: string }) =>
        api.get<{ createdRequests: PaginatedResponse<Request>; pickedRequests: PaginatedResponse<Request> }>('/requests/my-requests', { params }),

    getMyRequestsCounts: () =>
        api.get<{ createdCount: number; pickedCount: number }>('/requests/my-requests/counts'),

    getCreatedRequests: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
        api.get<{ createdRequests: PaginatedResponse<Request> }>('/requests/my-requests', {
            params: { createdPage: params?.page || 1, limit: params?.limit || 10, startDate: params?.startDate, endDate: params?.endDate }
        }),

    getPickedRequests: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
        api.get<{ pickedRequests: PaginatedResponse<Request> }>('/requests/my-requests', {
            params: { pickedPage: params?.page || 1, limit: params?.limit || 10, startDate: params?.startDate, endDate: params?.endDate }
        }),

    pickRequest: (id: string, amount?: number) =>
        api.post<{ message: string; request: Request }>(`/requests/${id}/pick`, { amount }),

    getRequestDetails: (id: string) =>
        api.get<{ request: Request }>(`/requests/${id}/details`),

    uploadPaymentSlip: (id: string, formData: FormData) =>
        api.post<{ message: string; request: Request }>(`/requests/${id}/upload-slip`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),

    verifyPayment: (id: string, data: { approved: boolean; rejectionReason?: string }) => {
        return api.post(`/requests/${id}/verify`, data);
    },

    reportPaymentFailure: (id: string, reason: string) => {
        return api.post(`/requests/${id}/fail-payment`, { reason });
    },

    revertRequest: (id: string, data: { bankDetails?: any; upiId?: string; comment?: string }) => {
        return api.post(`/requests/${id}/revert`, data);
    },

    getRequestLogs: (id: string) =>
        api.get<{ logs: any[] }>(`/requests/${id}/logs`),

    getPaymentSlips: (id: string) =>
        api.get<{ slips: any[] }>(`/requests/${id}/slips`),

    getPaymentSlipUrl: (requestId: string, slipId: string) =>
        api.get<{ url: string }>(`/requests/${requestId}/payment-slips/${slipId}/url`),

    getAllRequestsForAdmin: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; status?: string; type?: string; vendorId?: string; search?: string }) =>
        api.get<{ requests: PaginatedResponse<Request> }>('/requests/admin/all', { params }),

    deleteRequest: (id: string, reason?: string) =>
        api.delete<{ message: string; id: string }>(`/requests/${id}`, { data: { reason } }),
};

// Dashboard APIs
export const dashboardAPI = {
    getVendorStats: (params?: { startDate?: string; endDate?: string }) =>
        api.get<VendorStats>('/dashboard/vendor/stats', { params }),

    getVendorMonthlyStats: (params?: { startDate?: string; endDate?: string }) =>
        api.get<{ monthlyStats: MonthlyStats[] }>('/dashboard/vendor/monthly', { params }),

    getAllVendorsStats: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; search?: string }) =>
        api.get<{ vendorStats: PaginatedResponse<VendorStatsWithUser> }>('/dashboard/admin/vendors', { params }),

    getSystemOverview: (params?: { startDate?: string; endDate?: string; vendorId?: string }) =>
        api.get<SystemOverview>('/dashboard/admin/overview', { params }),

    getSystemMonthlyStats: (params?: { startDate?: string; endDate?: string }) =>
        api.get<{ monthlyStats: MonthlyStats[] }>('/dashboard/admin/monthly', { params }),

    exportSettlementStats: (params?: { startDate?: string; endDate?: string; vendorId?: string }) =>
        api.get('/dashboard/export', { params, responseType: 'blob' }),
};

// Notification APIs
export const notificationAPI = {
    getNotifications: (params?: { page?: number; limit?: number }) =>
        api.get<{ notifications: PaginatedResponse<Notification>; unreadCount: number }>('/notifications', { params }),

    getUnreadNotifications: (params?: { page?: number; limit?: number }) =>
        api.get<{ notifications: PaginatedResponse<Notification>; unreadCount: number }>('/notifications/unread', { params }),

    markAsRead: (id: string) =>
        api.put<{ message: string }>(`/notifications/${id}/read`),

    markAllAsRead: () =>
        api.put<{ message: string }>('/notifications/read-all'),

    getUnreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count'),
};
