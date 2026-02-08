import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../services/apiService';
import { message } from 'antd';

export const useNotifications = (page = 1, limit = 10, enabled = true) => {
    return useQuery({
        queryKey: ['notifications', 'all', page, limit],
        queryFn: async () => {
            const response = await notificationAPI.getNotifications({ page, limit });
            return response.data;
        },
        enabled,
    });
};

export const useUnreadNotifications = (page = 1, limit = 10, enabled = true) => {
    return useQuery({
        queryKey: ['notifications', 'unread', page, limit],
        queryFn: async () => {
            const response = await notificationAPI.getUnreadNotifications({ page, limit });
            return response.data;
        },
        enabled,
        refetchInterval: enabled ? 30000 : false, // Poll only if enabled
    });
};

export const useUnreadCount = () => {
    return useQuery({
        queryKey: ['notifications', 'count'],
        queryFn: async () => {
            const response = await notificationAPI.getUnreadCount();
            return response.data;
        },
        refetchInterval: 30000, // Poll every 30 seconds
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await notificationAPI.markAsRead(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await notificationAPI.markAllAsRead();
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            message.success('All notifications marked as read');
        },
    });
};
