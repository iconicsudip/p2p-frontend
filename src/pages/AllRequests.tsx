import { Button, Card, DatePicker, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Calendar, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAllRequestsForAdmin, usePickRequest } from '../hooks/useRequests';
import { Request, RequestStatus, RequestType } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

export const AllRequests: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(queryParams.get('status') || undefined);
    // Default to withdrawal requests as per requirement, but allow override from query
    const [typeFilter, setTypeFilter] = useState<string | undefined>(queryParams.get('type') || RequestType.WITHDRAWAL);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<[string, string] | undefined>();
    const [vendorIdFilter, setVendorIdFilter] = useState<string | undefined>(queryParams.get('vendorId') || undefined);

    useEffect(() => {
        const type = queryParams.get('type');
        const status = queryParams.get('status');
        const vendorId = queryParams.get('vendorId');

        if (type) setTypeFilter(type);
        if (status) setStatusFilter(status);
        if (vendorId) setVendorIdFilter(vendorId);
    }, [location.search]);

    const { data, isLoading } = useAllRequestsForAdmin({
        page,
        limit,
        status: statusFilter,
        type: typeFilter,
        search: searchQuery,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        vendorId: vendorIdFilter
    });

    const requests = data?.requests?.data || [];
    const meta = data?.requests?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

    const getStatusBadge = (status: RequestStatus) => {
        const config: Record<RequestStatus, { color: string }> = {
            [RequestStatus.PENDING]: { color: 'blue' },
            [RequestStatus.PICKED]: { color: 'orange' },
            [RequestStatus.PAID_FULL]: { color: 'cyan' },
            [RequestStatus.PAID_PARTIAL]: { color: 'purple' },
            [RequestStatus.COMPLETED]: { color: 'green' },
            [RequestStatus.REJECTED]: { color: 'red' },
            [RequestStatus.PAYMENT_FAILED]: { color: 'volcano' },
        };
        const style = config[status] || { color: 'default' };

        return <Tag color={style.color} className="font-semibold uppercase">{status}</Tag>;
    };

    const getTypeBadge = (type: RequestType) => {
        return (
            <Tag color={type === RequestType.DEPOSIT ? 'green' : 'red'} className="font-semibold uppercase">
                {type}
            </Tag>
        );
    };

    const columns: ColumnsType<Request> = [
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Date</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="text-sm font-medium text-gray-900">
                    {dayjs(date).format('DD MMM YYYY, hh:mm A')}
                </span>
            ),
            width: 120,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Type</span>,
            dataIndex: 'type',
            key: 'type',
            render: (type: RequestType) => getTypeBadge(type),
            width: 120,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Amount</span>,
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => (
                <span className="text-base font-bold text-gray-900">
                    ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            ),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Created By</span>,
            dataIndex: 'createdBy',
            key: 'createdBy',
            render: (createdBy: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{createdBy?.name}</span>
                    <span className="text-xs text-gray-500">{createdBy?.email}</span>
                </div>
            ),
            width: 200,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Picked By</span>,
            dataIndex: 'pickedBy',
            key: 'pickedBy',
            render: (pickedBy: any) => (
                pickedBy ? (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{pickedBy?.name}</span>
                        <span className="text-xs text-gray-500">{pickedBy?.email}</span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">-</span>
                )
            ),
            width: 200,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Status</span>,
            dataIndex: 'status',
            key: 'status',
            render: (status: RequestStatus) => getStatusBadge(status),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Actions</span>,
            key: 'actions',
            render: (_, record: Request) => (
                <Space>
                    {record.status === RequestStatus.PENDING && record.type === RequestType.WITHDRAWAL && (
                        <Button
                            type="primary"
                            onClick={() => handlePickRequest(record.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 h-8 px-4 rounded-lg font-medium shadow-sm shadow-indigo-200 border-none"
                            loading={pickRequestMutation.isPending && pickRequestMutation.variables?.requestId === record.id}
                        >
                            Pick Request
                        </Button>
                    )}
                </Space>
            ),
            width: 120,
        },
    ];

    const pickRequestMutation = usePickRequest();

    const handlePickRequest = (id: string) => {
        // Find the request to get the amount (though backend handles it likely from ID)
        const request = requests.find((r: Request) => r.id === id);
        if (request) {
            pickRequestMutation.mutate({
                requestId: id,
                amount: request.amount
            });
        }
    };

    const handleTableChange = (pagination: any) => {
        setPage(pagination.current);
        setLimit(pagination.pageSize);
    };

    const handleDateRangeChange = (dates: any) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange([
                dates[0].startOf('day').toISOString(),
                dates[1].endOf('day').toISOString()
            ]);
        } else {
            setDateRange(undefined);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">All Requests</h1>
                <p className="text-slate-600">View all withdrawal requests from vendors</p>
            </div>

            {/* Filters */}
            <Card bordered={false} className="shadow-sm border border-slate-200 rounded-2xl mb-6">
                <Space wrap className="w-full" size="middle">
                    <Input
                        placeholder="Search by vendor name or email..."
                        prefix={<Search size={16} className="text-gray-400" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 h-10 rounded-xl"
                        allowClear
                    />



                    <Select
                        placeholder="Filter by Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-48"
                        allowClear
                    >
                        <Option value={`${RequestStatus.PENDING},${RequestStatus.PICKED},${RequestStatus.PAID_FULL},${RequestStatus.PAID_PARTIAL}`}>Pending (All)</Option>
                        <Option value={RequestStatus.PENDING}>Pending</Option>
                        <Option value={RequestStatus.PICKED}>Picked</Option>
                        <Option value={RequestStatus.PAID_FULL}>Paid Full</Option>
                        <Option value={RequestStatus.PAID_PARTIAL}>Paid Partial</Option>
                        <Option value={RequestStatus.COMPLETED}>Completed</Option>
                        <Option value={RequestStatus.REJECTED}>Rejected</Option>
                        <Option value={RequestStatus.PAYMENT_FAILED}>Payment Failed</Option>
                    </Select>

                    <RangePicker
                        onChange={handleDateRangeChange}
                        className="h-10 rounded-xl"
                        suffixIcon={<Calendar size={16} className="text-gray-400" />}
                    />
                </Space>
            </Card>

            {/* Table */}
            <Card bordered={false} className="shadow-sm border border-slate-200 rounded-2xl !mt-6">
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={isLoading}
                    onChange={handleTableChange}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.limit,
                        total: meta.total,
                        showTotal: (total) => `Total ${total} requests`,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    );
};
