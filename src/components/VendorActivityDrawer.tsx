import React, { useEffect, useState } from 'react';
import { Drawer, Tag, Spin, Empty, Tabs } from 'antd';
import { useInfiniteAllRequestsForAdmin } from '../hooks/useRequests';
import { RequestStatus, RequestType } from '../types';
import { Clock, ArrowUpRight, ArrowDownLeft, LogIn, LogOut } from 'lucide-react';
import { authAPI } from '../services/apiService';

interface VendorActivityDrawerProps {
    open: boolean;
    onClose: () => void;
    vendorId: string | null;
    vendorName: string;
}

export const VendorActivityDrawer: React.FC<VendorActivityDrawerProps> = ({
    open,
    onClose,
    vendorId,
    vendorName,
}) => {
    // Tab state
    const [activeTab, setActiveTab] = useState('requests');

    // Requests Data (Existing)
    const {
        data: requestsData,
        isLoading: requestsLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteAllRequestsForAdmin({
        limit: 15,
        vendorId: vendorId || undefined,
    });

    // Login Activity Data (New)
    const [activities, setActivities] = useState<any[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);

    useEffect(() => {
        if (open && vendorId && activeTab === 'logins') {
            fetchActivities();
        }
    }, [open, vendorId, activeTab]);

    const fetchActivities = async () => {
        if (!vendorId) return;
        setActivitiesLoading(true);
        try {
            const res = await authAPI.getUserActivity(vendorId, { limit: 50 });
            setActivities(res.data.activities.data);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        } finally {
            setActivitiesLoading(false);
        }
    };

    // Flatten pages to get all requests
    const requests = requestsData?.pages.flatMap((page) => page.requests.data) || [];

    const RequestsTimeline = () => (
        requestsLoading ? (
            <div className="flex justify-center py-20">
                <Spin size="large" />
            </div>
        ) : requests.length === 0 ? (
            <div className="mt-8">
                <Empty description="No transaction history found" />
            </div>
        ) : (
            <div className="p-6">
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[110px] top-4 bottom-0 w-px bg-slate-200" />

                    <div className="space-y-8">
                        {requests.map((req) => (
                            <div key={req.id} className="relative flex items-start gap-8 group">
                                {/* Date Column */}
                                <div className="w-[85px] text-right pt-[2px] shrink-0">
                                    <span className="text-sm font-medium text-slate-600 block">
                                        {new Date(req.createdAt).toLocaleDateString('en-GB')}
                                    </span>
                                    <span className="text-xs text-slate-400 block mt-1">
                                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Timeline Node */}
                                <div className="absolute left-[106px] top-[6px] w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 z-10 bg-white group-hover:bg-slate-50">
                                    <div className={`w-full h-full rounded-full ${req.type === RequestType.DEPOSIT ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 mb-1">
                                            {req.type === RequestType.DEPOSIT ? (
                                                <ArrowDownLeft size={16} className="text-emerald-500 shrink-0" />
                                            ) : (
                                                <ArrowUpRight size={16} className="text-red-500 shrink-0" />
                                            )}
                                            <span className="font-bold text-slate-700">
                                                {req.type === RequestType.DEPOSIT ? 'Deposit' : 'Withdrawal'}
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-900 text-base">
                                            ₹{req.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <Tag className="mr-0 rounded px-2" color={
                                            req.status === RequestStatus.COMPLETED ? 'success' :
                                                req.status === RequestStatus.PENDING ? 'geekblue' :
                                                    req.status === RequestStatus.REJECTED || req.status === RequestStatus.PAYMENT_FAILED ? 'error' :
                                                        'default'
                                        }>
                                            {req.status}
                                        </Tag>
                                        <span className="text-xs text-slate-300 font-mono">
                                            ID: {req.id.substring(0, 8)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasNextPage && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                            >
                                {isFetchingNextPage ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    );

    const LoginActivityTimeline = () => (
        activitiesLoading ? (
            <div className="flex justify-center py-20">
                <Spin size="large" />
            </div>
        ) : activities.length === 0 ? (
            <div className="mt-8">
                <Empty description="No login history found" />
            </div>
        ) : (
            <div className="p-6">
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[110px] top-4 bottom-0 w-px bg-slate-200" />

                    <div className="space-y-8">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative flex items-start gap-8 group">
                                {/* Date Column */}
                                <div className="w-[85px] text-right pt-[2px] shrink-0">
                                    <span className="text-sm font-medium text-slate-600 block">
                                        {new Date(activity.timestamp).toLocaleDateString('en-GB')}
                                    </span>
                                    <span className="text-xs text-slate-400 block mt-1">
                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Timeline Node */}
                                <div className="absolute left-[106px] top-[6px] w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 z-10 bg-white group-hover:bg-slate-50">
                                    <div className={`w-full h-full rounded-full ${activity.action === 'LOGIN' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        {activity.action === 'LOGIN' ? (
                                            <LogIn size={16} className="text-indigo-500 shrink-0" />
                                        ) : (
                                            <LogOut size={16} className="text-slate-500 shrink-0" />
                                        )}
                                        <span className={`font-bold ${activity.action === 'LOGIN' ? 'text-indigo-700' : 'text-slate-600'}`}>
                                            {activity.action === 'LOGIN' ? 'Logged In' : 'Logged Out'}
                                        </span>
                                    </div>

                                    <div className="mt-1 space-y-1">
                                        {activity.ipAddress && (
                                            <p className="text-xs text-slate-500">
                                                IP: <span className="font-mono text-slate-700">{activity.ipAddress}</span>
                                            </p>
                                        )}
                                        {activity.userAgent && (
                                            <p className="text-xs text-slate-400 max-w-[250px]" title={activity.userAgent}>
                                                {activity.userAgent}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    );

    return (
        <Drawer
            title={
                <div className="flex items-center gap-2">
                    <Clock className="text-indigo-600" size={20} />
                    <span>Activity History: <span className="font-bold text-slate-800">{vendorName}</span></span>
                </div>
            }
            placement="right"
            width={500}
            onClose={onClose}
            open={open}
            bodyStyle={{ padding: 0 }}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                centered
                className="mt-2"
                items={[
                    {
                        key: 'requests',
                        label: 'Transactions',
                        children: <RequestsTimeline />,
                    },
                    {
                        key: 'logins',
                        label: 'Login History',
                        children: <LoginActivityTimeline />,
                    },
                ]}
            />
        </Drawer>
    );
};
