import React, { useState } from 'react';
import { Button, Space, Modal, Tooltip, message } from 'antd';
import {
    Plus,
    Edit,
    Trash2,
    Info,
    Key,
    Copy,
    Loader2,
    History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAllVendors, useVendorCredentials } from '../hooks/useAuth';
import { User } from '../types';
import { Pagination } from 'antd';


export const VendorsList: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const navigate = useNavigate();

    // React Query Hooks
    const { data: vendorsData, isLoading: loading } = useAllVendors(page, limit);

    const vendors = vendorsData?.vendors?.data || [];
    const pagination = vendorsData?.vendors?.meta || { total: 0 };

    const handlePageChange = (page: number, pageSize: number) => {
        setPage(page);
        setLimit(pageSize);
    };


    const copyToClipboard = (text: string, label: string) => {
        if (!text || text === '******') return;
        navigator.clipboard.writeText(text);
        message.success(`${label} copied to clipboard`);
    };


    if (loading) {
        return (
            <div className="max-w-[1400px] mx-auto min-h-screen animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-200 rounded"></div>
                        <div className="h-4 w-64 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-32 bg-slate-200 rounded"></div>
                                </div>
                                <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
                                <div className="w-32 h-4 bg-slate-200 rounded"></div>
                                <div className="w-24 h-4 bg-slate-200 rounded"></div>
                                <div className="w-24 h-6 bg-slate-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Vendors List</h2>
                    <p className="text-slate-500">Manage and oversee all your strategic partnerships.</p>
                </div>
                <Button
                    size='middle'
                    onClick={() => navigate('/admin/create-vendor')}
                    type='primary'
                >
                    <Plus size={16} />
                    New Vendor
                </Button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 table-container overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vendor Details</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Bank Details</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Created Date</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Loading vendors...
                                    </td>
                                </tr>
                            ) : vendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${vendor.name.charAt(0).toUpperCase() === 'G' ? 'bg-indigo-50 text-indigo-electric' :
                                                vendor.name.charAt(0).toUpperCase() === 'N' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-purple-50 text-purple-600'
                                                }`}>
                                                {vendor.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{vendor.name}</p>
                                                <p className="text-xs text-slate-500">{vendor.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{vendor.bankDetails?.bankName || 'N/A'}</span>
                                            <span className="text-xs">
                                                {vendor.bankDetails?.accountNumber ? `**** ${vendor.bankDetails.accountNumber.slice(-4)}` : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(vendor.createdAt || '').toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Space>
                                            <Tooltip title="View Activity History">
                                                <button
                                                    onClick={() => navigate(`/admin/activity-log?vendorId=${vendor.id}`)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                                                >
                                                    <History size={16} />
                                                </button>
                                            </Tooltip>
                                        </Space>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {vendors.length} of {pagination.total} vendors
                    </p>
                    <Pagination
                        current={page}
                        pageSize={limit}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger
                    />
                </div>
            </div>
        </div>
    );
};
