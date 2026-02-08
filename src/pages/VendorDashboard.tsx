import React, { useMemo, useState } from 'react';
import { Card, Table, Button, message } from 'antd';
import {
    ArrowUp,
    ArrowDown,
    Wallet,
    Clock,
    Download
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useVendorStats, useVendorMonthlyStats, useExportSettlement } from '../hooks/useDashboard';
import { useCreatedRequests, usePickedRequests } from '../hooks/useRequests';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { RequestStatus, RequestType } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const VendorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [dateFilter, setDateFilter] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });

    // React Query Hooks
    const { data: stats, isLoading: statsLoading } = useVendorStats({
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined
    });
    const { data: monthlyStatsData, isLoading: monthlyLoading } = useVendorMonthlyStats({
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined
    });
    const { data: createdRequestsData, isLoading: createdLoading } = useCreatedRequests(1, 5, true, {
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined
    });
    const { data: pickedRequestsData, isLoading: pickedLoading } = usePickedRequests(1, 5, true, {
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined
    });

    const exportMutation = useExportSettlement();

    const handleDateFilterChange = (dates: { startDate: string | null; endDate: string | null }) => {
        setDateFilter(dates);
    };

    const handleDownloadReport = () => {
        exportMutation.mutate({
            startDate: dateFilter.startDate || undefined,
            endDate: dateFilter.endDate || undefined
        }, {
            onSuccess: () => message.success('Report downloaded successfully'),
            onError: () => message.error('Failed to download report')
        });
    };

    const monthlyStats = monthlyStatsData?.monthlyStats || [];
    const createdRequests = createdRequestsData?.createdRequests?.data || [];
    const pickedRequests = pickedRequestsData?.pickedRequests?.data || [];

    const recentRequests = useMemo(() => {
        return [...createdRequests, ...pickedRequests]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [createdRequests, pickedRequests]);

    const requestsLoading = createdLoading || pickedLoading;



    const columns: any = [
        {
            title: 'DATE',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <span className="font-semibold text-slate-700">{new Date(date).toLocaleDateString()}</span>
        },
        {
            title: 'TYPE',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${type === RequestType.DEPOSIT ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {type}
                </span>
            ),
        },
        {
            title: 'AMOUNT',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => <span className="font-bold text-slate-800">₹{amount.toLocaleString()}</span>,
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: RequestStatus) => {
                let bg = 'bg-slate-100';
                let text = 'text-slate-500';

                if (status === RequestStatus.COMPLETED || status === RequestStatus.PAID_FULL) {
                    bg = 'bg-emerald-100';
                    text = 'text-emerald-700';
                } else if (status === RequestStatus.PENDING) {
                    bg = 'bg-amber-100';
                    text = 'text-amber-700';
                } else if (status === RequestStatus.REJECTED) {
                    bg = 'bg-rose-100';
                    text = 'text-rose-700';
                }

                return (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${bg} ${text}`}>
                        {status}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Here's what's happening with your account today.</p>
                </div>

                <div className="flex items-center gap-4">
                    <DateRangeFilter onChange={handleDateFilterChange} />

                    <Button
                        icon={<Download size={18} />}
                        onClick={handleDownloadReport}
                        loading={exportMutation.isPending}
                        className="bg-indigo-50 text-indigo-600 border-indigo-100 font-semibold hover:bg-indigo-100 h-[32px] rounded-lg flex items-center gap-2"
                    >
                        Export
                    </Button>

                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 hidden md:block">
                        <span className="text-sm font-semibold text-slate-600">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} bordered={false} className="shadow-sm rounded-[24px] p-2">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Withdrawal Card */}
                    <Card bordered={false} className="shadow-sm rounded-[24px] p-2 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                                <ArrowDown className="text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 font-medium">Total Withdrawal</span>
                            <h3 className="text-3xl font-bold text-slate-800 m-0">₹{stats?.totalWithdrawal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </Card>

                    {/* Deposit Card */}
                    <Card bordered={false} className="shadow-sm rounded-[24px] p-2 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                <ArrowUp className="text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 font-medium">Total Deposit</span>
                            <h3 className="text-3xl font-bold text-slate-800 m-0">₹{stats?.totalDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </Card>

                    {/* Net Balance Card - Blue Accent */}
                    <Card bordered={false} className="shadow-sm rounded-[24px] p-2 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-50 text-yellow-600">
                                <Wallet className="text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 font-medium">Net Balance</span>
                            <h3 className="text-3xl font-bold text-slate-800 m-0">₹{stats?.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </Card>
                </div>
            )}

            {/* Charts Row */}
            {monthlyLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2].map((i) => (
                        <Card key={i} bordered={false} className="shadow-sm rounded-[24px] p-2 h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-2">
                                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-48 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            <div className="h-[280px] bg-slate-100 rounded-xl w-full"></div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Trend Bar Chart */}
                    <Card bordered={false} className="shadow-sm rounded-[24px] p-2">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 m-0">Monthly Trend</h3>
                                <span className="text-slate-400 text-xs">Transaction volume by month</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                                    <span className="text-xs font-bold text-slate-500">OUT</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                                    <span className="text-xs font-bold text-slate-500">IN</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyStats} barGap={8} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        dy={10}
                                        tickFormatter={(val) => val.substring(0, 3)}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="withdrawal" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={8} />
                                    <Bar dataKey="deposit" fill="#34d399" radius={[4, 4, 0, 0]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Growth Area Chart */}
                    <Card bordered={false} className="shadow-sm rounded-[24px] p-2">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 m-0">Net Balance Growth</h3>
                                <span className="text-slate-400 text-xs">Accumulated growth tracking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                <span className="text-xs font-bold text-indigo-500">PERFORMANCE</span>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        dy={10}
                                        tickFormatter={(val) => val.substring(0, 3)}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="netBalance"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorNet)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {/* Recent Activity */}
            {requestsLoading ? (
                <Card bordered={false} className="shadow-sm rounded-[24px] animate-pulse">
                    <div className="flex justify-between items-center py-2 mb-4">
                        <div className="space-y-2">
                            <div className="h-6 w-40 bg-slate-200 rounded"></div>
                            <div className="h-3 w-64 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-slate-50 rounded-xl w-full"></div>
                        ))}
                    </div>
                </Card>
            ) : (
                <Card
                    bordered={false}
                    className="shadow-sm rounded-[24px] overflow-hidden"
                    title={
                        <div className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Clock className="text-amber-600 text-lg" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 m-0">Recent Activity</h3>
                                    <span className="text-slate-400 text-xs font-normal">Monitor your latest transaction flows</span>
                                </div>
                            </div>
                            <Button className="bg-indigo-50 text-indigo-600 border-none font-semibold hover:bg-indigo-100 h-9 rounded-lg">
                                View All Activity
                            </Button>
                        </div>
                    }
                >
                    <Table
                        dataSource={recentRequests}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        className="custom-table"
                        rowClassName="hover:bg-slate-50 transition-colors"
                    />
                </Card>
            )}
        </div>
    );
};
