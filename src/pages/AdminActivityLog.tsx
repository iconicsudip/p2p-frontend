import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Card, Tag, Button, Input, Select, Drawer, Timeline, Spin, Avatar, Image as AntImage, Skeleton } from 'antd';
import { Calendar, Search, Filter, Shield, AlertTriangle, FileText, CheckCircle, Smartphone, Eye, DollarSign, User, Image } from 'lucide-react';
import { useAllRequestsForAdmin, useRequestLogs, useRequestDetails, useRequestSlips } from '../hooks/useRequests';
import { useAllVendorsList } from '../hooks/useDashboard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { RequestStatus, RequestType, Request } from '../types';

const { Option } = Select;

export const AdminActivityLog: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
    const [vendorFilter, setVendorFilter] = useState<string | undefined>(searchParams.get('vendorId') || undefined);
    const [dateFilter, setDateFilter] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });

    // Update filter if URL changes
    useEffect(() => {
        const vid = searchParams.get('vendorId');
        if (vid) setVendorFilter(vid);
    }, [searchParams]);

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

    // Queries
    const { data: requestsData, isLoading } = useAllRequestsForAdmin({
        page,
        limit,
        search,
        status: statusFilter,
        type: typeFilter,
        vendorId: vendorFilter,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
    });

    const { data: vendors } = useAllVendorsList();

    // Details Queries (only enabled when drawer is open and request selected)
    const { data: fullRequestDetails, isLoading: detailsLoading } = useRequestDetails(selectedRequest?.id || '', drawerVisible);
    const { data: requestLogs, isLoading: logsLoading } = useRequestLogs(selectedRequest?.id || '');
    const { data: requestSlips, isLoading: slipsLoading } = useRequestSlips(selectedRequest?.id || '');

    const handleTableChange = (pagination: any) => {
        setPage(pagination.current);
        setLimit(pagination.pageSize);
    };

    const showDetails = (record: Request) => {
        setSelectedRequest(record);
        setDrawerVisible(true);
    };

    const onCloseDrawer = () => {
        setDrawerVisible(false);
        setSelectedRequest(null);
    };

    const columns: any = [
        {
            title: 'Ref ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <span className="text-xs text-slate-400 font-mono">{id.substring(0, 8)}</span>,
            width: 100,
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <span className="text-sm text-slate-700">{new Date(date).toLocaleDateString()}</span>,
            width: 120,
        },
        {
            title: 'Vendor',
            dataIndex: ['createdBy', 'name'],
            key: 'vendor',
            render: (name: string, record: Request) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-xs text-slate-400">{record.createdBy?.email}</span>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === RequestType.DEPOSIT ? 'green' : 'red'}>
                    {type}
                </Tag>
            ),
            width: 100,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (amount: number) => <span className="font-bold text-slate-700">₹{amount.toLocaleString()}</span>,
            width: 120,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === RequestStatus.COMPLETED) color = 'success';
                else if (status === RequestStatus.PENDING) color = 'processing';
                else if (status === RequestStatus.REJECTED || status === RequestStatus.PAYMENT_FAILED) color = 'error';
                else if (status === RequestStatus.PICKED) color = 'warning';

                return <Tag color={color}>{status}</Tag>;
            },
            width: 150,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Request) => (
                <Button
                    type="text"
                    icon={<Eye size={16} />}
                    onClick={() => showDetails(record)}
                    className="text-indigo-600 hover:bg-indigo-50"
                >
                    View
                </Button>
            ),
            width: 100,
        },
    ];

    const currentRequest = fullRequestDetails || selectedRequest;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
                    <p className="text-slate-500">Track and monitor all request activities across all vendors</p>
                </div>
                <div className="flex gap-2">
                    <DateRangeFilter onChange={setDateFilter} />
                </div>
            </div>

            <Card className="shadow-sm rounded-2xl border-slate-100">
                <div className="flex flex-wrap gap-4 mb-6">
                    <Input
                        placeholder="Search by ID, Name or Email"
                        prefix={<Search size={16} className="text-slate-400" />}
                        className="w-full md:w-64 rounded-lg"
                        allowClear
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <Select
                        placeholder="Filter by Vendor"
                        allowClear
                        className="w-full md:w-48"
                        onChange={setVendorFilter}
                    >
                        {vendors?.map((v: any) => (
                            <Option key={v.id} value={v.id}>{v.name}</Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="Filter by Status"
                        allowClear
                        className="w-full md:w-40"
                        onChange={setStatusFilter}
                    >
                        {Object.values(RequestStatus).map((status) => (
                            <Option key={status} value={status}>{status}</Option>
                        ))}
                    </Select>

                    <Select
                        placeholder="Request Type"
                        allowClear
                        className="w-full md:w-40"
                        onChange={setTypeFilter}
                    >
                        <Option value={RequestType.DEPOSIT}>DEPOSIT</Option>
                        <Option value={RequestType.WITHDRAWAL}>WITHDRAWAL</Option>
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={requestsData?.requests?.data || []}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: requestsData?.requests?.meta.total || 0,
                        showSizeChanger: true,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Drawer
                title={
                    <div className="flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        <span>Request Details</span>
                        {currentRequest && <span className="text-slate-400 text-sm font-normal font-mono ml-2">#{currentRequest.id.substring(0, 8)}</span>}
                    </div>
                }
                placement="right"
                width={600}
                onClose={onCloseDrawer}
                open={drawerVisible}
            >
                {currentRequest ? (
                    <div className="space-y-8">
                        {/* Status Banner */}
                        <div className={`p-4 rounded-xl border ${currentRequest.status === RequestStatus.COMPLETED ? 'bg-emerald-50 border-emerald-100' :
                            currentRequest.status === RequestStatus.PAYMENT_FAILED || currentRequest.status === RequestStatus.REJECTED ? 'bg-red-50 border-red-100' :
                                'bg-slate-50 border-slate-100'
                            } `}>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-700">Current Status</span>
                                <Tag className="m-0 text-sm px-3 py-1" color={
                                    currentRequest.status === RequestStatus.COMPLETED ? 'success' :
                                        currentRequest.status === RequestStatus.PAYMENT_FAILED ? 'error' :
                                            'default'
                                }>
                                    {currentRequest.status}
                                </Tag>
                            </div>
                            {(currentRequest.paymentFailureReason || currentRequest.rejectionReason) && (
                                <div className="mt-3 pt-3 border-t border-red-100 text-red-600 text-sm">
                                    <span className="font-bold">Reason: </span>
                                    {currentRequest.paymentFailureReason || currentRequest.rejectionReason}
                                </div>
                            )}
                        </div>

                        {/* Money Details */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <DollarSign size={18} /> Financials
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Card size="small" className="bg-slate-50 border-slate-200">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Total Amount</div>
                                    <div className="text-xl font-bold text-slate-800">₹{currentRequest.amount.toLocaleString()}</div>
                                </Card>
                                <Card size="small" className="bg-slate-50 border-slate-200">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Paid / Pending</div>
                                    <div className="text-sm font-semibold text-slate-700">
                                        {detailsLoading ? (
                                            <Skeleton.Button active size="small" block />
                                        ) : (
                                            <>
                                                <span className="text-emerald-600">Paid: ₹{currentRequest.paidAmount?.toLocaleString() || '0'}</span>
                                                <br />
                                                <span className="text-amber-600">Pending: ₹{currentRequest.pendingAmount?.toLocaleString() || currentRequest.amount.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* People Involved */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <User size={18} /> Users Involved
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <Avatar className="bg-indigo-100 text-indigo-600">C</Avatar>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Created By (Vendor)</div>
                                        <div className="font-medium text-slate-900">{currentRequest.createdBy?.name || '...'}</div>
                                        <div className="text-xs text-slate-500">{currentRequest.createdBy?.email}</div>
                                    </div>
                                </div>
                                {currentRequest.pickedBy && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                        <Avatar className="bg-orange-100 text-orange-600">P</Avatar>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Picked By</div>
                                            <div className="font-medium text-slate-900">{currentRequest.pickedBy?.name}</div>
                                            <div className="text-xs text-slate-500">{currentRequest.pickedBy?.email}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Slips */}
                        {slipsLoading ? (
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Image size={18} /> Payment Slips
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Skeleton.Image active className="!w-full !h-32" />
                                    <Skeleton.Image active className="!w-full !h-32" />
                                </div>
                            </div>
                        ) : requestSlips && requestSlips.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Image size={18} /> Payment Slips
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {requestSlips.map((slip: any) => (
                                        <div key={slip.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                            <div className="aspect-video flex items-center justify-center bg-slate-100 overflow-hidden">
                                                <AntImage
                                                    src={slip.fileUrl}
                                                    alt="Payment Slip"
                                                    className="object-cover"
                                                    fallback="https://placehold.co/600x400?text=No+Image"
                                                    width="100%"
                                                    height="100%"
                                                />
                                            </div>
                                            <div className="p-3 bg-white">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-700">₹{Number(slip.amount).toLocaleString()}</span>
                                                    <span className="text-xs text-slate-400">{new Date(slip.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity Timeline */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Calendar size={18} /> Activity Log
                            </h3>
                            {logsLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : (
                                requestLogs?.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500">No activity logs found</p>
                                    </div>
                                ) : (
                                    <Timeline
                                        mode="left"
                                        items={requestLogs?.map((log: any) => ({
                                            key: log.id,
                                            color: log.action === 'CREATED' ? 'blue' :
                                                log.action === 'PAYMENT_FAILED' ? 'red' :
                                                    log.action === 'COMPLETED' ? 'green' : 'gray',
                                            children: (
                                                <div className="pb-4">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-slate-700 text-sm">
                                                            {log.action?.replace(/_/g, ' ') || 'ACTION'}
                                                        </span>
                                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-600 mt-1">
                                                        {log.comment || 'No comment'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded">
                                                        by {log.user?.name || 'Unknown User'}
                                                    </div>
                                                </div>
                                            )
                                        }))}
                                    />
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center py-20"><Spin size="large" /></div>
                )}
            </Drawer>
        </div>
    );
};
