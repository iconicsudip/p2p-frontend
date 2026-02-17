import { Button, Pagination, Tabs } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    AlertCircle,
    Bell,
    Check,
    CheckCircle,
    Info,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadNotifications } from '../hooks/useNotifications';
import { Notification, NotificationType } from '../types';

dayjs.extend(relativeTime);

export const Notifications: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [activeTab, setActiveTab] = useState('all');

    // React Query Hooks
    // React Query Hooks
    const isUnreadTab = activeTab === 'unread';
    const isAllTab = activeTab === 'all' || activeTab === 'transactions';

    const allNotificationsQuery = useNotifications(page, limit, isAllTab);
    const unreadNotificationsQuery = useUnreadNotifications(page, limit, isUnreadTab);

    // Select data based on tab
    const currentQuery = isUnreadTab ? unreadNotificationsQuery : allNotificationsQuery;

    const { data: notificationsData, isLoading } = currentQuery;

    const markAsReadMutation = useMarkNotificationRead();
    const markAllAsReadMutation = useMarkAllNotificationsRead();

    // Data extraction
    const rawNotifications = notificationsData?.notifications?.data || [];
    const meta = notificationsData?.notifications?.meta || { total: 0 };

    const handlePageChange = (page: number, pageSize: number) => {
        setPage(page);
        setLimit(pageSize);
    };

    // Client-side filtering for other tabs if needed (e.g. transactions)
    const filteredNotifications = useMemo(() => {
        let filtered = [...rawNotifications];

        switch (activeTab) {
            case 'transactions':
                filtered = filtered.filter(n => [
                    NotificationType.PAYMENT_APPROVED,
                    NotificationType.PAYMENT_REJECTED,
                    NotificationType.PAYMENT_UPLOADED
                ].includes(n.type));
                break;
            // 'unread' is handled by API now, so no filter needed here if we rely on API
            // 'all' passes through
            default:
                break;
        }
        return filtered;
    }, [rawNotifications, activeTab]);

    const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        markAsReadMutation.mutate(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getTimeAgo = (dateStr: string) => {
        return dayjs(dateStr).fromNow();
    };

    const getNotificationStyle = (type: NotificationType) => {
        switch (type) {
            case NotificationType.PAYMENT_APPROVED:
                return {
                    icon: <CheckCircle className="text-emerald-500 text-xl" />,
                    bg: 'bg-emerald-50',
                };
            case NotificationType.PAYMENT_REJECTED:
                return {
                    icon: <AlertCircle className="text-rose-500 text-xl" />,
                    bg: 'bg-rose-50',
                };
            case NotificationType.ADMIN_ALERT:
                return {
                    icon: <Bell className="text-amber-500 text-xl" />,
                    bg: 'bg-amber-50',
                };
            case NotificationType.PAYMENT_UPLOADED:
            case NotificationType.REQUEST_PICKED:
            default:
                return {
                    icon: <Info className="text-indigo-500 text-xl" />,
                    bg: 'bg-indigo-50',
                };
        }
    };

    // Custom Empty State Component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20">
            {/* Graphic Circle */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                {/* Main Circle Background */}
                <div className="absolute inset-0 bg-indigo-50/50 rounded-full blur-xl scale-90"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-white rounded-full border border-indigo-50/30"></div>

                {/* Central Icon */}
                <div className="relative z-10 w-24 h-20 bg-white shadow-lg shadow-indigo-100 rounded-2xl flex items-center justify-center border border-indigo-50">
                    <div className="space-y-2 w-12">
                        <div className="h-1 bg-slate-200 rounded-full"></div>
                        <div className="h-1 bg-slate-200 rounded-full w-4/5"></div>
                        <div className="h-1 bg-slate-200 rounded-full w-3/5"></div>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-8 right-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 animate-bounce-slow" style={{ animationDuration: '3s' }}>
                    <CheckCircle className="!text-white text-sm" />
                </div>
                <div className="absolute bottom-10 left-6 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 animate-bounce-slow" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                    <Bell className="!text-white text-sm" />
                </div>
                <div className="absolute bottom-6 right-8 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 animate-bounce-slow" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
                    <Check className="!text-white text-sm" />
                </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">You're all caught up!</h3>
            <p className="text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
                No new notifications at the moment. We'll let you know when something important happens.
            </p>
        </div>
    );

    const NotificationItem = ({ notification }: { notification: Notification }) => {
        const style = getNotificationStyle(notification.type);
        const title = notification.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

        return (
            <div className={`p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors group relative flex gap-5 ${!notification.isRead ? 'bg-slate-50/40' : ''}`}>

                {/* Unread Indicator */}
                {!notification.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"></div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 mt-1`}>
                    {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-base font-bold text-slate-900 ${!notification.isRead ? 'text-indigo-900' : ''}`}>
                            {title}
                        </h4>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-4">
                            {getTimeAgo(notification.createdAt)}
                        </span>
                    </div>

                    <p className="text-slate-500 text-[15px] leading-relaxed mb-3">
                        {notification.message}
                    </p>

                    <div className="flex items-center gap-4">
                        {!notification.isRead && (
                            <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                                Mark as read
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const items = [
        { key: 'all', label: 'All Notifications' },
        { key: 'unread', label: 'Unread' },
    ];

    return (
        <div className="mx-auto min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Notifications</h1>
                    <p className="text-slate-500">
                        Stay updated with your latest financial activities and security alerts.
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<Check size={18} />}
                    loading={markAllAsReadMutation.isPending}
                    onClick={handleMarkAllAsRead}
                    className="bg-indigo-electric hover:bg-indigo-600 h-10 px-6 rounded-lg font-semibold border-none shadow-lg shadow-indigo-500/20"
                >
                    Mark All as Read
                </Button>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 min-h-[600px] overflow-hidden">
                {/* Tabs */}
                <div className="px-6 pt-2 border-b border-slate-100">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={items}
                        className="custom-tabs px-4"
                        tabBarStyle={{ marginBottom: 0 }}
                    />
                </div>

                {/* List Content */}
                {isLoading ? (
                    <div className="p-6 space-y-6 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : rawNotifications.length === 0 ? (
                    <EmptyState />
                ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <Info className="text-4xl mb-3 text-slate-200" />
                        <p>No notifications in this filter</p>
                    </div>
                ) : (
                    <div>
                        {filteredNotifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}

                        {/* Pagination */}
                        <div className="flex justify-end p-6 border-t border-slate-50">
                            <Pagination
                                current={page}
                                pageSize={limit}
                                total={meta.total}
                                onChange={handlePageChange}
                                showTotal={(total) => `Total ${total} notifications`}
                                showSizeChanger
                                pageSizeOptions={['10', '20', '50', '100']}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
