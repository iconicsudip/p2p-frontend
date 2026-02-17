import { Avatar, /* Button, */ Input, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ArrowLeftRight, Search /* , LogIn */ } from 'lucide-react';
import React, { useState } from 'react';
import { useAvailableRequests /* , usePickRequest */ } from '../hooks/useRequests';
import { Request, RequestType } from '../types';

export const AvailableRequests: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchText, setSearchText] = useState('');

    const { data: requestsData, isLoading } = useAvailableRequests({ page, limit });
    // const pickRequestMutation = usePickRequest();


    const requests = requestsData?.requests?.data || [];
    const meta = requestsData?.requests?.meta || { total: 0 };

    const handleTableChange = (newPagination: any) => {
        setPage(newPagination.current);
        setLimit(newPagination.pageSize);
    };

    /* const handlePickRequest = (id: string) => {
        pickRequestMutation.mutate(id);
    }; */

    const getTypeBadge = (type: RequestType) => {
        const isDeposit = type === RequestType.DEPOSIT;
        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isDeposit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                <ArrowLeftRight className={isDeposit ? '' : 'rotate-90'} size={16} />
                <span>{type}</span>
            </div>
        );
    };

    const columns: ColumnsType<Request> = [
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="text-sm font-medium text-gray-700">
                    {dayjs(date).format('DD MMM YYYY, hh:mm A')}
                </span>
            ),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requested By</span>,
            dataIndex: 'createdBy',
            key: 'createdBy',
            render: (createdBy: { name: string; email: string }) => (
                <div className="flex items-center gap-3">
                    <Avatar size={40} className="bg-gray-100 text-gray-600 font-bold border border-gray-200">
                        {createdBy?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div className="text-sm font-bold text-gray-900">{createdBy?.name}</div>
                        <div className="text-xs text-gray-500">{createdBy?.email}</div>
                    </div>
                </div>
            ),
            width: 250,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type</span>,
            dataIndex: 'displayType',
            key: 'displayType',
            render: (type: RequestType) => getTypeBadge(type),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</span>,
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => (
                <span className="text-base font-bold text-gray-900">
                    ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            ),
            width: 150,
        },

        /* {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</span>,
            key: 'actions',
            render: (_, record: Request) => (
                <Button
                    type="primary"
                    icon={<LogIn size={18} />}
                    onClick={() => handlePickRequest(record.id)}
                    loading={pickRequestMutation.isPending && pickRequestMutation.variables === record.id}
                    disabled={pickRequestMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-sm rounded-lg font-medium px-6 h-9"
                >
                    Pick Request
                </Button>
            ),
            width: 180,
        }, */
    ];

    // Client-side filtering on current page only for now
    const filteredRequests = requests.filter(request =>
        request.createdBy?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        request.amount.toString().includes(searchText)
    );

    // Stats calculated from current page (Limitations of simple pagination refactor without aggregator API)
    const totalAmount = requests.reduce((sum, req) => sum + Number(req.amount), 0);
    const withdrawalCount = requests.filter(r => r.displayType === RequestType.WITHDRAWAL).length;
    const depositCount = requests.filter(r => r.displayType === RequestType.DEPOSIT).length;

    if (isLoading) {
        return (
            <div className="mx-auto animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 w-64 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-2 h-32">
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-10 w-32 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>

                {/* Filter Bar Skeleton */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 flex gap-4 items-center">
                    <div className="flex-1 h-11 bg-slate-200 rounded-lg"></div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    </div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-slate-50 rounded-lg w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Available Requests</h1>
                <p className="text-slate-500">Pick a request to process payment</p>
            </div>

            {/* Stats Cards (Note: Reflects current page mostly, except Total Requests) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
                    <div className="text-sm font-medium text-slate-500">Total Requests</div>
                    <div className="text-4xl font-bold text-slate-900">{meta.total}</div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
                    <div className="text-sm font-medium text-slate-500">Page Amount</div>
                    <div className="text-4xl font-bold text-slate-900 tracking-tight">
                        ₹{totalAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            minimumIntegerDigits: 1, // Changed from 5 for better layout
                            useGrouping: true // Changed from false
                        })}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
                    <div className="text-sm font-medium text-slate-500">Page (Out / In)</div>
                    <div className="text-4xl font-bold flex items-center gap-2">
                        <span className="text-rose-500">{withdrawalCount}</span>
                        <span className="text-slate-300 text-2xl">/</span>
                        <span className="text-emerald-500">{depositCount}</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 flex gap-4 items-center">
                <Input
                    placeholder="Search visible requests..."
                    prefix={<Search className="text-slate-600 text-lg mr-2" />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="flex-1 h-11 text-base bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg"
                    variant="filled"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredRequests}
                    rowKey="id"
                    loading={isLoading}
                    onChange={handleTableChange}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: meta.total,
                        showTotal: (total) => <span className="text-slate-500 font-medium">Total {total} requests</span>,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        className: '!px-6 py-4',
                    }}
                    className="custom-table"
                />
            </div>
        </div>
    );
};
