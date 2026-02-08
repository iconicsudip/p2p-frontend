import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../services/apiService';
import { message } from 'antd';
import { CreateVendorRequest } from '../types';

export const useLogin = () => {
    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const response = await authAPI.login(email, password);
            return response.data;
        },
    });
};

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const response = await authAPI.getMe();
            return response.data;
        },
        retry: false,
    });
};

export const useCreateVendor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateVendorRequest) => {
            const response = await authAPI.createVendor(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            message.success('Vendor created successfully!');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to create vendor');
        },
    });
};

export const useAllVendors = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendors', 'list', page, limit],
        queryFn: async () => {
            const response = await authAPI.getAllVendors({ page, limit });
            return response.data;
        },
    });
};

export const useVendorCredentials = (id: string, enabled = false) => {
    return useQuery({
        queryKey: ['vendors', id, 'credentials'],
        queryFn: async () => {
            const response = await authAPI.getVendorCredentials(id);
            return response.data;
        },
        enabled: enabled && !!id,
    });
};
