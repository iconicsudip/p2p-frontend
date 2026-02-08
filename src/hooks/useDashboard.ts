import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardAPI } from '../services/apiService';

// Vendor Dashboard Hooks
export const useVendorStats = (params?: { startDate?: string; endDate?: string }) => {
    return useQuery({
        queryKey: ['dashboard', 'vendor', 'stats', params],
        queryFn: async () => {
            const response = await dashboardAPI.getVendorStats(params);
            return response.data;
        },
    });
};

export const useVendorMonthlyStats = (params?: { startDate?: string; endDate?: string }) => {
    return useQuery({
        queryKey: ['dashboard', 'vendor', 'monthly', params],
        queryFn: async () => {
            const response = await dashboardAPI.getVendorMonthlyStats(params);
            return response.data;
        },
    });
};

// Admin Dashboard Hooks
export const useAllVendorsStats = (page = 1, limit = 10, filters?: { startDate?: string; endDate?: string; search?: string }) => {
    return useQuery({
        queryKey: ['dashboard', 'admin', 'vendors', page, limit, filters],
        queryFn: async () => {
            const response = await dashboardAPI.getAllVendorsStats({ page, limit, ...filters });
            return response.data;
        },
    });
};

export const useSystemOverview = (filters?: { startDate?: string; endDate?: string; vendorId?: string }) => {
    return useQuery({
        queryKey: ['dashboard', 'admin', 'overview', filters],
        queryFn: async () => {
            const response = await dashboardAPI.getSystemOverview(filters);
            return response.data;
        },
    });
};

export const useSystemMonthlyStats = (params?: { startDate?: string; endDate?: string }) => {
    return useQuery({
        queryKey: ['dashboard', 'admin', 'monthly', params],
        queryFn: async () => {
            const response = await dashboardAPI.getSystemMonthlyStats(params);
            return response.data;
        },
    });
};

export const useExportSettlement = () => {
    return useMutation({
        mutationFn: async (params?: { startDate?: string; endDate?: string; vendorId?: string }) => {
            const response = await dashboardAPI.exportSettlementStats(params);
            // Create a blob from the response and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `settlement-report-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
    });
};
// Fetch all vendors list (for dropdowns)
export const useAllVendorsList = () => {
    return useQuery({
        queryKey: ['vendors', 'list'],
        queryFn: async () => {
            const response = await import('../services/apiService').then(m => m.authAPI.getAllVendors({ limit: 1000 })); // Fetch all for dropdown
            return response.data.vendors.data;
        },
    });
};
