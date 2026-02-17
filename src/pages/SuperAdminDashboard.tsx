import { useQuery } from '@tanstack/react-query';
import { Button, Card, Form, Input, message, Modal, Select, Space, Table, Tooltip, Typography } from 'antd';
import {
    ArrowDown,
    ArrowRightCircle,
    ArrowUp,
    CheckCircle2,
    Clock,
    Download,
    History,
    KeyRound,
    Wallet,
    XCircle
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BankDetailsAlert } from '../components/BankDetailsAlert';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { VendorActivityDrawer } from '../components/VendorActivityDrawer';
import { useAuth } from '../contexts/AuthContext';
import { useAllVendorsStats, useExportSettlement, useSystemOverview } from '../hooks/useDashboard';
import { authAPI } from '../services/apiService';

const { Title } = Typography;

// Stat Card Component
const StatCard = ({ title, value, count, icon, color, bgColor, isLoading, link }: any) => (
    <Card bordered={false} className={`shadow-sm rounded-2xl h-full hover:shadow-md transition-shadow group relative overflow-hidden ${bgColor}`} style={{ backgroundColor: `${color}15` }}>
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white">
                <span style={{ color: color }}>{icon}</span>
            </div>
            {link && (
                <Link to={link} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <ArrowRightCircle size={20} />
                </Link>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-1">
                {isLoading ? '...' : `₹${value.toLocaleString()}`}
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

export const SuperAdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [dateFilter, setDateFilter] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });
    const [selectedVendor, setSelectedVendor] = useState<string | undefined>(undefined);

    // Activity Drawer & Reset Password State
    const [activityDrawerVisible, setActivityDrawerVisible] = useState(false);
    const [selectedVendorForActivity, setSelectedVendorForActivity] = useState<{ id: string; name: string } | null>(null);
    const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
    const [selectedVendorForReset, setSelectedVendorForReset] = useState<{ id: string; name: string } | null>(null);
    const [form] = Form.useForm();
    const [resetLoading, setResetLoading] = useState(false);

    const handleResetPassword = async (values: { newPassword: string }) => {
        if (!selectedVendorForReset) return;

        setResetLoading(true);
        try {
            await authAPI.resetUserPassword(selectedVendorForReset.id, values.newPassword);
            message.success('Password reset successfully');
            setResetPasswordModalVisible(false);
            form.resetFields();
            setSelectedVendorForReset(null);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    // Fetch all vendors for the dropdown
    const { data: vendorsData } = useQuery({
        queryKey: ['vendors', 'all'],
        queryFn: async () => {
            const res = await authAPI.getAllVendors({ limit: 100 });
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

    const { data: vendorStatsData, isLoading: tableLoading } = useAllVendorsStats(page, limit, {
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
        search: selectedVendor ? vendors.find(v => v.id === selectedVendor)?.name : undefined
    });

    const exportMutation = useExportSettlement();

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
            title: 'USERNAME',
            dataIndex: ['vendor', 'username'],
            key: 'username',
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
        {
            title: 'ACTIONS',
            key: 'actions',
            align: 'right',
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Activity History">
                        <button
                            onClick={() => {
                                setSelectedVendorForActivity({ id: record.vendor.id, name: record.vendor.name });
                                setActivityDrawerVisible(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                            <History size={16} />
                        </button>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                        <button
                            onClick={() => {
                                setSelectedVendorForReset({ id: record.vendor.id, name: record.vendor.name });
                                setResetPasswordModalVisible(true);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                            <KeyRound size={16} />
                        </button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Get selected vendor name for display
    const selectedVendorName = selectedVendor
        ? vendors.find(v => v.id === selectedVendor)?.name
        : null;

    return (
        <div className="mx-auto">
            <BankDetailsAlert />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Here's what's happening with the system today.</p>
                </div>
            </div>

            {/* Total Vendors and Filters */}
            <Card bordered={false} className="shadow-sm rounded-2xl mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Vendors</p>
                        <h2 className="text-4xl font-bold text-slate-900">
                            {overviewLoading ? '...' : (overview?.totalVendors || 0).toLocaleString()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap justify-end">
                        <Select
                            showSearch
                            placeholder="All"
                            optionFilterProp="children"
                            onChange={(value) => setSelectedVendor(value)}
                            value={selectedVendor || ''}
                            style={{ width: 200 }}
                            className="rounded-lg"
                        >
                            <Select.Option value="">All</Select.Option>
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
            </Card>

            {/* Admin Financials Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Admin Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title={selectedVendorName ? `${selectedVendorName} - Total Debit` : "System Total Debit"}
                        value={overview?.totalWithdrawal || 0}
                        icon={<ArrowDown size={24} />}
                        color="#f43f5e"
                        bgColor="bg-rose-50"
                        isLoading={overviewLoading}
                    />
                    <StatCard
                        title={selectedVendorName ? `${selectedVendorName} - Total Credit` : "System Total Credit"}
                        value={overview?.totalDeposit || 0}
                        icon={<ArrowUp size={24} />}
                        color="#10b981"
                        bgColor="bg-emerald-50"
                        isLoading={overviewLoading}
                    />
                    <StatCard
                        title={selectedVendorName ? `${selectedVendorName} - Net Balance` : "System Net Balance"}
                        value={(overview?.totalDeposit || 0) - (overview?.totalWithdrawal || 0)}
                        icon={<Wallet size={24} />}
                        color="#6366f1"
                        bgColor="bg-indigo-50"
                        isLoading={overviewLoading}
                    />
                </div>
            </div>

            {/* Operational Status Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Operational Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Rejected Deposits"
                        value={overview?.rejectedDeposits?.amount || 0}
                        count={overview?.rejectedDeposits?.count}
                        icon={<XCircle size={24} />}
                        color="#f43f5e"
                        bgColor="bg-rose-50"
                        isLoading={overviewLoading}
                        link={`/admin/requests?type=DEPOSIT&status=REJECTED${selectedVendor ? `&vendorId=${selectedVendor}` : ''}`}
                    />
                    <StatCard
                        title="Pending Withdrawals"
                        value={overview?.pendingWithdrawals?.amount || 0}
                        count={overview?.pendingWithdrawals?.count}
                        icon={<Clock size={24} />}
                        color="#f59e0b"
                        bgColor="bg-amber-50"
                        isLoading={overviewLoading}
                        link={`/admin/requests?type=WITHDRAWAL&status=PENDING${selectedVendor ? `&vendorId=${selectedVendor}` : ''}`}
                    />
                    <StatCard
                        title="Rejected Withdrawals"
                        value={overview?.rejectedWithdrawals?.amount || 0}
                        count={overview?.rejectedWithdrawals?.count}
                        icon={<XCircle size={24} />}
                        color="#f43f5e"
                        bgColor="bg-rose-50"
                        isLoading={overviewLoading}
                        link={`/admin/requests?type=WITHDRAWAL&status=REJECTED${selectedVendor ? `&vendorId=${selectedVendor}` : ''}`}
                    />
                    <StatCard
                        title="Approved Deposits"
                        value={overview?.approvedDeposits?.amount || 0}
                        count={overview?.approvedDeposits?.count}
                        icon={<CheckCircle2 size={24} />}
                        color="#10b981"
                        bgColor="bg-emerald-50"
                        isLoading={overviewLoading}
                        link={`/admin/requests?type=DEPOSIT&status=COMPLETED${selectedVendor ? `&vendorId=${selectedVendor}` : ''}`}
                    />
                    <StatCard
                        title="Approved Withdrawals"
                        value={overview?.approvedWithdrawals?.amount || 0}
                        count={overview?.approvedWithdrawals?.count}
                        icon={<CheckCircle2 size={24} />}
                        color="#10b981"
                        bgColor="bg-emerald-50"
                        isLoading={overviewLoading}
                        link={`/admin/requests?type=WITHDRAWAL&status=COMPLETED${selectedVendor ? `&vendorId=${selectedVendor}` : ''}`}
                    />
                </div>
            </div>

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
                            pageSizeOptions: ['10', '20', '50', '100']
                        }}
                        rowClassName="hover:bg-slate-50 transition-colors"
                    />
                </Card>
            )}


            <VendorActivityDrawer
                open={activityDrawerVisible}
                onClose={() => {
                    setActivityDrawerVisible(false);
                    setSelectedVendorForActivity(null);
                }}
                vendorId={selectedVendorForActivity?.id || null}
                vendorName={selectedVendorForActivity?.name || ''}
            />

            <Modal
                title={`Reset Password for ${selectedVendorForReset?.name}`}
                open={resetPasswordModalVisible}
                onCancel={() => {
                    setResetPasswordModalVisible(false);
                    form.resetFields();
                    setSelectedVendorForReset(null);
                }}
                footer={null}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleResetPassword}
                >
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please enter new password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={resetLoading} block>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div >
    );
};
