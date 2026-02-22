import { Card, Table, Tag, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useAllRequestsForAdmin } from '../hooks/useRequests';
import { useAllVendors } from '../hooks/useAuth';
import { Request, RequestType } from '../types';

export const CancelledRequests: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedVendor, setSelectedVendor] = useState<string | undefined>(undefined);

    const { data: vendorsData } = useAllVendors(1, 100);
    const vendors = vendorsData?.vendors?.data || [];

    const { data, isLoading } = useAllRequestsForAdmin({
        page,
        limit,
        status: 'CANCELLED',
        vendorId: selectedVendor,
    });

    const requests = data?.requests?.data || [];
    const meta = data?.requests?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

    const getTypeBadge = (type: RequestType) => {
        return type === RequestType.WITHDRAWAL ? (
            <Tag color="purple" className="mx-0">WITHDRAWAL</Tag>
        ) : (
            <Tag color="green" className="mx-0">DEPOSIT</Tag>
        );
    };

    const columns: ColumnsType<Request> = [
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Created At</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{dayjs(date).format('MMM D, YYYY')}</span>
                    <span className="text-xs text-gray-500">{dayjs(date).format('h:mm A')}</span>
                </div>
            ),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Type</span>,
            dataIndex: 'type',
            key: 'type',
            render: (type: RequestType) => getTypeBadge(type),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Amount</span>,
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => (
                <span className="font-bold whitespace-nowrap text-gray-900">
                    ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            ),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Creator</span>,
            key: 'createdBy',
            render: (_, record: Request) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{record.createdBy.name}</span>
                    <span className="text-xs text-gray-500">{record.createdBy.email}</span>
                </div>
            ),
            width: 200,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Status</span>,
            dataIndex: 'status',
            key: 'status',
            render: () => <Tag color="default" className="font-semibold uppercase">CANCELLED</Tag>,
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Cancellation Reason</span>,
            key: 'cancellationReason',
            render: (_: any, record: Request) => (
                <div className="text-sm text-gray-600 max-w-sm break-words">
                    {record.cancellationReason || '-'}
                </div>
            ),
            width: 250,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase">Cancelled At</span>,
            dataIndex: 'deletedAt',
            key: 'deletedAt',
            render: (date: string) => date ? (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{dayjs(date).format('MMM D, YYYY')}</span>
                    <span className="text-xs text-gray-500">{dayjs(date).format('h:mm A')}</span>
                </div>
            ) : '-',
            width: 150,
        },
    ];

    const handleTableChange = (pagination: any) => {
        setPage(pagination.current);
        setLimit(pagination.pageSize);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cancelled Requests</h1>
                    <p className="text-gray-500 mt-1">View all requests that have been cancelled.</p>
                </div>
                <div>
                    <Select
                        placeholder="Filter by Vendor"
                        allowClear
                        value={selectedVendor}
                        onChange={(value) => setSelectedVendor(value)}
                        className="w-64"
                        options={vendors.map((vendor) => ({
                            value: vendor.id,
                            label: vendor.name,
                        }))}
                        showSearch
                        filterOption={(input: string, option: any) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </div>
            </div>

            <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden">
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
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} cancelled requests`,
                    }}
                    className="bg-white"
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    );
};
