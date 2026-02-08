import React, { useState } from 'react';
import { Card, Typography, Table, Button, message, Select } from 'antd';
import {
    Users,
    ArrowLeftRight,
    ArrowDown,
    ArrowUp,
    Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSystemOverview, useSystemMonthlyStats, useAllVendorsStats, useExportSettlement } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthContext';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { authAPI } from '../services/apiService';
import { useQuery } from '@tanstack/react-query';

const { Title, Text } = Typography;

// Custom Stat Card Component
const StatCard = ({ title, value, icon, color, bgColor, prefix }: any) => (
    <Card bordered={false} className="shadow-sm rounded-2xl h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                <span style={{ fontSize: '18px', color: color }}>{icon}</span>
            </div>
        </div>
        <div>
            <Text className="text-slate-500 text-sm font-medium block mb-1">{title}</Text>
            <Title level={2} style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
            </Title>
        </div>
    </Card>
);

export const SuperAdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [dateFilter, setDateFilter] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });
    const [selectedVendor, setSelectedVendor] = useState<string | undefined>(undefined);

    // Fetch all vendors for the dropdown
    const { data: vendorsData } = useQuery({
        queryKey: ['vendors', 'all'],
        queryFn: async () => {
            const res = await authAPI.getAllVendors({ limit: 100 }); // Reasonable limit for dropdown
            return res.data;
        }
    });

    const vendors = vendorsData?.vendors?.data || [];

    // React Query Hooks
    const { data: overview, isLoading: overviewLoading } = useSystemOverview({
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
        vendorId: selectedVendor
    });
    const { data: monthlyStatsData, isLoading: monthlyLoading } = useSystemMonthlyStats({
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined
    });

    // Vendor table stats - we might want to filter this list by date too?
    // Usually Admin wants to see stats for ALL vendors in the table, but filtered by date.
    // The "selectedVendor" filter probably applies to the Overview Cards. 
    // If selectedVendor is set, maybe the table should filter to show only that vendor?
    // For now, let's keep table showing all vendors, but apply date filter to their stats.
    const { data: vendorStatsData, isLoading: tableLoading } = useAllVendorsStats(page, limit, {
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
        search: selectedVendor ? vendors.find(v => v.id === selectedVendor)?.name : undefined // Hacky way to filter table by selected vendor if needed, or just leave it separate
    });

    const exportMutation = useExportSettlement();

    const monthlyStats = monthlyStatsData?.monthlyStats || [];
    const vendorStats = vendorStatsData?.vendorStats?.data || [];
    const pagination = vendorStatsData?.vendorStats?.meta || { total: 0 };

    const handleTableChange = (newPagination: any) => {
        setPage(newPagination.current);
        setLimit(newPagination.pageSize);
    };

    const columns: any = [
        {
            title: 'VENDOR',
            dataIndex: ['vendor', 'name'],
            key: 'name',
            render: (text: string) => <span className="font-semibold text-slate-700">{text}</span>
        },
        {
            title: 'EMAIL',
            dataIndex: ['vendor', 'email'],
            key: 'email',
            render: (text: string) => <span className="text-slate-500">{text}</span>
        },
        {
            title: 'WITHDRAWAL',
            dataIndex: 'totalWithdrawal',
            key: 'totalWithdrawal',
            render: (amount: number) => <span className="font-bold text-rose-500">₹{amount.toLocaleString()}</span>,
        },
        {
            title: 'DEPOSIT',
            dataIndex: 'totalDeposit',
            key: 'totalDeposit',
            render: (amount: number) => <span className="font-bold text-emerald-500">₹{amount.toLocaleString()}</span>,
        },
        {
            title: 'NET BALANCE',
            dataIndex: 'netBalance',
            key: 'netBalance',
            render: (amount: number) => (
                <span className={`font-extrabold ${amount >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    ₹{amount.toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <div className="mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Here's what's happening with the system today.</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap justify-end">
                    <Select
                        showSearch
                        placeholder="Select Vendor"
                        optionFilterProp="children"
                        allowClear
                        onChange={(value) => setSelectedVendor(value)}
                        style={{ width: 200 }}
                        className="rounded-lg"
                    >
                        {vendors.map(v => (
                            <Select.Option key={v.id} value={v.id}>{v.name}</Select.Option>
                        ))}
                    </Select>

                    <DateRangeFilter onChange={(dates) => setDateFilter(dates)} />

                    <Button
                        icon={<Download size={18} />}
                        onClick={() => exportMutation.mutate({
                            startDate: dateFilter.startDate || undefined,
                            endDate: dateFilter.endDate || undefined,
                            vendorId: selectedVendor
                        }, {
                            onSuccess: () => message.success('Report downloaded successfully'),
                            onError: () => message.error('Failed to download report')
                        })}
                        loading={exportMutation.isPending}
                        className="bg-indigo-50 text-indigo-600 border-indigo-100 font-semibold hover:bg-indigo-100 h-[32px] rounded-lg flex items-center gap-2"
                    >
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            {overviewLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} bordered={false} className="shadow-sm rounded-2xl h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                <div className="h-8 w-32 bg-slate-200 rounded"></div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Vendors"
                        value={overview?.totalVendors || 0}
                        icon={<Users size={20} />}
                        color="#6366f1"
                        bgColor="bg-indigo-50"
                    />
                    <StatCard
                        title="Total Transactions"
                        value={overview?.totalTransactions || 0}
                        icon={<ArrowLeftRight size={20} />}
                        color="#3b82f6"
                        bgColor="bg-blue-50"
                    />
                    <StatCard
                        title="Total Withdrawal"
                        value={overview?.totalWithdrawal || 0}
                        icon={<ArrowDown size={20} />}
                        color="#f43f5e"
                        bgColor="bg-rose-50"
                        prefix="₹"
                    />
                    <StatCard
                        title="Total Deposit"
                        value={overview?.totalDeposit || 0}
                        icon={<ArrowUp size={20} />}
                        color="#10b981"
                        bgColor="bg-emerald-50"
                        prefix="₹"
                    />
                </div>
            )}

            {/* Chart Section */}
            {monthlyLoading ? (
                <Card bordered={false} className="shadow-sm rounded-2xl !mb-8 h-[450px] animate-pulse">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-6 w-48 bg-slate-200 rounded"></div>
                        <div className="flex gap-4">
                            <div className="h-4 w-20 bg-slate-200 rounded"></div>
                            <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="h-[320px] bg-slate-100 rounded-xl w-full"></div>
                </Card>
            ) : (
                <Card
                    bordered={false}
                    className="shadow-sm rounded-2xl !mb-8"
                    title={<Title level={4} style={{ margin: 0 }}>System Transaction Volume</Title>}
                    extra={
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                                <span className="text-slate-500 text-sm">Withdrawal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                <span className="text-slate-500 text-sm">Deposit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                                <span className="text-slate-500 text-sm">Total Volume</span>
                            </div>
                        </div>
                    }
                >
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="totalVolume" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="deposit" stroke="#34d399" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="withdrawal" stroke="#fb7185" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Vendor Statistics Table */}
            {tableLoading && vendorStats.length === 0 ? (
                <Card bordered={false} className="shadow-sm rounded-2xl animate-pulse">
                    <div className="flex justify-between items-center py-4 pr-6 mb-2">
                        <div className="h-6 w-40 bg-slate-200 rounded"></div>
                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    </div>
                    <div className="space-y-4 px-6 pb-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-full bg-slate-100 rounded"></div>
                                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                <Card
                    bordered={false}
                    className="shadow-sm rounded-2xl overflow-hidden"
                    bodyStyle={{ padding: 0 }}
                    title={
                        <div className="flex justify-between items-center py-4 pr-6">
                            <Title level={4} style={{ margin: 0 }}>Vendor Statistics</Title>
                            <Button type="link" className="text-indigo-600 font-semibold p-0">View All</Button>
                        </div>
                    }
                >
                    <Table
                        dataSource={vendorStats}
                        columns={columns}
                        rowKey={(record) => record.vendor.id}
                        loading={tableLoading}
                        onChange={handleTableChange}
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total: pagination.total,
                            position: ['bottomRight'],
                            className: 'px-6 pb-4',
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '20', '50']
                        }}
                        rowClassName="hover:bg-slate-50 transition-colors"
                    />
                </Card>
            )}
        </div>
    );
};
