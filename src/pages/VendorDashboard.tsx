import { Button, Card, message, Table } from 'antd';
import dayjs from 'dayjs';
import {
    ArrowDown,
    ArrowRightCircle,
    ArrowUp,
    CheckCircle2,
    Clock,
    Download,
    Wallet,
    XCircle
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { useAuth } from '../contexts/AuthContext';
import { useExportSettlement, useVendorStats } from '../hooks/useDashboard';
import { useCreatedRequests, usePickedRequests } from '../hooks/useRequests';
import { RequestStatus, RequestType } from '../types';

const StatCard = ({ title, value, count, icon, color, bgColor, isLoading, link }: any) => (
    <Card bordered={false} className={`shadow-sm rounded-[24px] p-2 hover:shadow-md transition-shadow group relative overflow-hidden h-full ${bgColor}`} style={{ backgroundColor: `${color}15` }}>
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white" style={{ color: color }}>
                {icon}
            </div>
            {link && (
                <Link to={link} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowRightCircle size={18} />
                </Link>
            )}
        </div>
        <div className="space-y-1 pb-6">
            <span className="text-slate-500 font-medium text-sm">{title}</span>
            <h3 className="text-3xl font-bold text-slate-800 m-0">
                {isLoading ? '...' : `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </h3>
            {count !== undefined && (
                <p className="text-slate-400 text-xs font-semibold">
                    Total {title.split(' - ').pop()} : {isLoading ? '...' : count}
                </p>
            )}
        </div>
        {link && (
            <Link
                to={link}
                className="absolute bottom-0 left-0 right-0 py-2 bg-slate-50 text-center text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-all border-t border-slate-100 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
            >
                More info <ArrowRightCircle size={14} />
            </Link>
        )}
    </Card>
);

export const VendorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [dateFilter, setDateFilter] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });

    // React Query Hooks
    const { data: stats, isLoading: statsLoading } = useVendorStats({
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
            render: (date: string) => <span className="font-semibold text-slate-700">{dayjs(date).format('DD MMM YYYY, hh:mm A')}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Withdrawal"
                    value={stats?.totalWithdrawal || 0}
                    icon={<ArrowDown size={24} />}
                    color="#f43f5e"
                    bgColor="bg-rose-50"
                    isLoading={statsLoading}
                />
                <StatCard
                    title="Total Deposit"
                    value={stats?.totalDeposit || 0}
                    icon={<ArrowUp size={24} />}
                    color="#10b981"
                    bgColor="bg-emerald-50"
                    isLoading={statsLoading}
                />
                <StatCard
                    title="Net Balance"
                    value={stats?.netBalance || 0}
                    icon={<Wallet size={24} />}
                    color="#f59e0b"
                    bgColor="bg-yellow-50"
                    isLoading={statsLoading}
                />
            </div>

            {/* Enhanced Status Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Rejected Deposits"
                    value={stats?.rejectedDeposits?.amount || 0}
                    count={stats?.rejectedDeposits?.count}
                    icon={<XCircle size={22} />}
                    color="#f43f5e"
                    bgColor="bg-rose-50"
                    isLoading={statsLoading}
                    link={`/vendor/my-requests?type=DEPOSIT&status=REJECTED`}
                />
                <StatCard
                    title="Pending Withdrawals"
                    value={stats?.pendingWithdrawals?.amount || 0}
                    count={stats?.pendingWithdrawals?.count}
                    icon={<Clock size={22} />}
                    color="#f59e0b"
                    bgColor="bg-amber-50"
                    isLoading={statsLoading}
                    link={`/vendor/my-requests?type=WITHDRAWAL&status=${RequestStatus.PENDING},${RequestStatus.PICKED},${RequestStatus.PAID_FULL},${RequestStatus.PAID_PARTIAL}`}
                />
                <StatCard
                    title="Rejected Withdrawals"
                    value={stats?.rejectedWithdrawals?.amount || 0}
                    count={stats?.rejectedWithdrawals?.count}
                    icon={<XCircle size={22} />}
                    color="#f43f5e"
                    bgColor="bg-rose-50"
                    isLoading={statsLoading}
                    link={`/vendor/my-requests?type=WITHDRAWAL&status=REJECTED`}
                />
                <StatCard
                    title="Approved Deposits"
                    value={stats?.approvedDeposits?.amount || 0}
                    count={stats?.approvedDeposits?.count}
                    icon={<CheckCircle2 size={22} />}
                    color="#10b981"
                    bgColor="bg-emerald-50"
                    isLoading={statsLoading}
                    link={`/vendor/my-requests?type=DEPOSIT&status=COMPLETED`}
                />
                <StatCard
                    title="Approved Withdrawals"
                    value={stats?.approvedWithdrawals?.amount || 0}
                    count={stats?.approvedWithdrawals?.count}
                    icon={<CheckCircle2 size={22} />}
                    color="#10b981"
                    bgColor="bg-emerald-50"
                    isLoading={statsLoading}
                    link={`/vendor/my-requests?type=WITHDRAWAL&status=COMPLETED`}
                />
            </div>

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
                            <Link to="/vendor/my-requests">
                                <Button className="bg-indigo-50 text-indigo-600 border-none font-semibold hover:bg-indigo-100 h-9 rounded-lg">
                                    View All Activity
                                </Button>
                            </Link>
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
