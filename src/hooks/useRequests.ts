import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { requestAPI, authAPI } from '../services/apiService';
import { message } from 'antd';

// Fetch available requests
export const useAvailableRequests = (params: { page?: number; limit?: number; amount?: number; type?: string } = { page: 1, limit: 10 }, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['requests', 'available', params],
        queryFn: async () => {
            const response = await requestAPI.getAvailableRequests(params);
            return response.data;
        },
        enabled: options?.enabled,
    });
};


// Fetch created requests
export const useCreatedRequests = (page = 1, limit = 10, enabled = true, filters?: { startDate?: string; endDate?: string }) => {
    return useQuery({
        queryKey: ['requests', 'created', page, limit, filters],
        queryFn: async () => {
            const response = await requestAPI.getCreatedRequests({ page, limit, ...filters });
            return response.data;
        },
        enabled,
    });
};

// Fetch picked requests
export const usePickedRequests = (page = 1, limit = 10, enabled = true, filters?: { startDate?: string; endDate?: string }) => {
    return useQuery({
        queryKey: ['requests', 'picked', page, limit, filters],
        queryFn: async () => {
            const response = await requestAPI.getPickedRequests({ page, limit, ...filters });
            return response.data;
        },
        enabled,
    });
};

// Fetch request counts
export const useMyRequestsCounts = () => {
    return useQuery({
        queryKey: ['requests', 'counts'],
        queryFn: async () => {
            const response = await requestAPI.getMyRequestsCounts();
            return response.data;
        },
    });
};

// Pick request mutation
export const usePickRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requestId, amount }: { requestId: string; amount?: number }) => {
            const response = await requestAPI.pickRequest(requestId, amount);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['requests', 'available'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'picked'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
            message.success('Request picked successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to pick request');
        },
    });
};

// Upload payment slip mutation
export const useUploadPaymentSlip = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requestId, formData }: { requestId: string; formData: FormData }) => {
            const response = await requestAPI.uploadPaymentSlip(requestId, formData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'picked'] });
            message.success('Payment slip uploaded successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to upload payment slip');
        },
    });
};

// Verify payment mutation
export const useVerifyPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requestId, data }: { requestId: string; data: { approved: boolean; rejectionReason?: string } }) => {
            const response = await requestAPI.verifyPayment(requestId, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'created'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
            message.success(data.message || 'Payment verified successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to verify payment');
        },
    });
};

// Fetch all requests for admin
export const useAllRequestsForAdmin = (
    params: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        type?: string;
        vendorId?: string;
        search?: string;
    } = { page: 1, limit: 10 }
) => {
    return useQuery({
        queryKey: ['requests', 'admin-all', params],
        queryFn: async () => {
            const response = await requestAPI.getAllRequestsForAdmin(params);
            return response.data;
        },
    });
};

export const useRequestSlips = (requestId: string) => {
    return useQuery({
        queryKey: ['request-slips', requestId],
        queryFn: async () => {
            if (!requestId) return [];
            const response = await requestAPI.getPaymentSlips(requestId);
            return response.data.slips;
        },
        enabled: !!requestId,
    });
};

// Create request mutation
export const useCreateRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await requestAPI.createRequest(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'created'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
            message.success('Request created successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to create request');
        },
    });
};

// Fetch request logs
export const useRequestLogs = (requestId: string) => {
    return useQuery({
        queryKey: ['requests', requestId, 'logs'],
        queryFn: async () => {
            const response = await requestAPI.getRequestLogs(requestId);
            return response.data.logs;
        },
        enabled: !!requestId, // Only fetch if requestId is provided
    });
};

// Fetch request details
export const useRequestDetails = (requestId: string, enabled = true) => {
    return useQuery({
        queryKey: ['requests', requestId, 'details'],
        queryFn: async () => {
            const response = await requestAPI.getRequestDetails(requestId);
            return response.data.request;
        },
        enabled: enabled && !!requestId,
    });
};

// Report payment failure mutation
export const useReportPaymentFailure = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
            const response = await requestAPI.reportPaymentFailure(requestId, reason);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'picked'] });
            message.success('Payment failure reported successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to report payment failure');
        },
    });
};

// Revert request mutation
export const useRevertRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requestId, data }: { requestId: string; data: { bankDetails?: any; upiId?: string; comment?: string } }) => {
            const response = await requestAPI.revertRequest(requestId, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'created'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
            message.success('Request reverted successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to revert request');
        },
    });
};

// Delete request mutation
export const useDeleteRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
            const response = await requestAPI.deleteRequest(requestId, reason);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'created'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
            message.success('Request deleted successfully');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to delete request');
        },
    });
};

// Fetch admin bank details
export const useAdminBankDetails = () => {
    return useQuery({
        queryKey: ['admin', 'bank-details'],
        queryFn: async () => {
            const response = await authAPI.getAdminBankDetails();
            return response.data.admin;
        },
    });
};

// Update admin bank details
export const useUpdateAdminBankDetails = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { bankDetails?: any; upiId?: string }) => {
            const response = await authAPI.updateAdminBankDetails(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'bank-details'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            message.success('Bank details updated successfully');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to update bank details');
        },
    });
};

// Infinite fetch all requests for admin
export const useInfiniteAllRequestsForAdmin = (
    params: {
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        type?: string;
        vendorId?: string;
        search?: string;
    } = { limit: 10 }
) => {
    return useInfiniteQuery({
        queryKey: ['requests', 'admin-all', 'infinite', params],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await requestAPI.getAllRequestsForAdmin({ ...params, page: pageParam });
            return response.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.requests.meta.hasNextPage) {
                return lastPage.requests.meta.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });
};
