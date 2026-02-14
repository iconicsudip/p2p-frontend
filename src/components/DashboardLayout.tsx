import React, { useState } from 'react';
import { Layout, Drawer, Button } from 'antd';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Bell,
    LogOut,
    Wallet,
    FileText,
    Activity,
    Menu,
    X,
    Settings,
    CheckCircle,
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadCount } from '../hooks/useNotifications';
import { ResetPasswordModal } from './ResetPasswordModal';

const { Header, Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
    const { user, logout, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { data: countData } = useUnreadCount();
    const unreadCount = countData?.count || 0;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Sidebar items based on the mockup style

    const vendorMenuItems = [
        {
            key: '/vendor/dashboard',
            icon: <LayoutDashboard size={18} />,
            label: 'Dashboard',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50',
            activeColor: 'text-indigo-600'
        },
        {
            key: '/vendor/create-request',
            icon: <Wallet size={18} />,
            label: 'Create Request',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50',
            activeColor: 'text-emerald-600'
        },
        {
            key: '/vendor/my-requests',
            icon: <FileText size={18} />,
            label: 'Created Requests',
            color: 'text-violet-500',
            bgColor: 'bg-violet-50',
            activeColor: 'text-violet-600'
        },
        {
            key: '/vendor/picked-requests',
            icon: <CheckCircle size={18} />,
            label: 'Picked Requests',
            color: 'text-teal-500',
            bgColor: 'bg-teal-50',
            activeColor: 'text-teal-600'
        },
        {
            key: '/vendor/notifications',
            icon: <Bell size={18} />,
            label: 'Notifications',
            color: 'text-amber-500',
            bgColor: 'bg-amber-50',
            activeColor: 'text-amber-600'
        },
        {
            key: '/vendor/settings',
            icon: <Settings size={18} />,
            label: 'Settings',
            color: 'text-slate-500',
            bgColor: 'bg-slate-50',
            activeColor: 'text-slate-600'
        }
    ];

    const adminMenuItems = [
        {
            key: '/admin/dashboard',
            icon: <LayoutDashboard size={18} />,
            label: 'Dashboard',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50',
            activeColor: 'text-indigo-600'
        },
        {
            key: '/admin/vendors',
            icon: <Users size={18} />,
            label: 'Vendors',
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-50',
            activeColor: 'text-cyan-600'
        },
        {
            key: '/admin/activity-log',
            icon: <Activity size={18} />,
            label: 'Activity Log',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50',
            activeColor: 'text-purple-600'
        },
        {
            key: '/admin/create-vendor',
            icon: <UserPlus size={18} />,
            label: 'Create Vendor',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50',
            activeColor: 'text-emerald-600'
        },
        {
            key: '/admin/settings',
            icon: <Settings size={18} />,
            label: 'Settings',
            color: 'text-slate-500',
            bgColor: 'bg-slate-50',
            activeColor: 'text-slate-600'
        },
        {
            key: '/admin/requests',
            icon: <FileText size={18} />,
            label: 'All Requests',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            activeColor: 'text-blue-600'
        },
        {
            key: '/admin/my-requests',
            icon: <FileText size={18} />,
            label: 'Created Requests',
            color: 'text-violet-500',
            bgColor: 'bg-violet-50',
            activeColor: 'text-violet-600'
        },
        {
            key: '/admin/picked-requests',
            icon: <CheckCircle size={18} />,
            label: 'Picked Requests',
            color: 'text-teal-500',
            bgColor: 'bg-teal-50',
            activeColor: 'text-teal-600'
        },
        {
            key: '/admin/notifications',
            icon: <Bell size={18} />,
            label: 'Notifications',
            color: 'text-amber-500',
            bgColor: 'bg-amber-50',
            activeColor: 'text-amber-600'
        }
    ];

    const menuItems = isSuperAdmin ? adminMenuItems : vendorMenuItems;


    const renderSidebarContent = () => (
        <div className='flex flex-col justify-between h-full'>
            {/* Logo Area */}
            <div>
                <div className="h-24 flex items-center px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">
                            <Wallet size={24} />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                            IndigoPay
                        </span>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex flex-col px-4 mt-2">
                    {menuItems.map(item => {
                        const isActive = location.pathname === item.key;
                        return (
                            <div
                                key={item.key}
                                onClick={() => {
                                    navigate(item.key);
                                    setMobileMenuOpen(false);
                                }}
                                className={`flex items-center gap-3 px-[16px] py-[8px] rounded-[8px] transition-all cursor-pointer group mb-1 ${isActive
                                    ? `${item.bgColor} ${item.activeColor} font-bold border border-gray-200`
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span className={`text-[18px] flex items-center transition-colors ${isActive ? item.activeColor : item.color
                                    }`}>
                                    {item.icon}
                                </span>
                                <span className={`text-[14px] flex-1 font-medium`}>{item.label as string}</span>
                                {item.label === 'Notifications' && unreadCount > 0 && (
                                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm shadow-rose-200">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Sign Out */}
            <div className="px-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-rose-500 hover:text-rose-600 transition-all rounded-xl hover:bg-rose-50 group font-medium"
                >
                    <LogOut className="text-[18px] group-hover:scale-110 transition-transform" />
                    <span className="text-[14px]">Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <Layout className="min-h-screen bg-slate-50/50">
            {/* Desktop Sidebar */}
            <Sider
                width={260}
                className="!bg-white border-r border-slate-200 z-50 !sticky inset-y-0 left-0 h-screen flex flex-col justify-between pb-6 hidden md:flex"
                theme="light"
            >
                {renderSidebarContent()}
            </Sider>

            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                width={280}
                styles={{ body: { padding: 0 } }}
                closeIcon={null}
            >
                <div className="relative h-full flex flex-col pb-6">
                    <Button
                        type="text"
                        icon={<X size={24} />}
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600"
                    />
                    {renderSidebarContent()}
                </div>
            </Drawer>

            <Layout className="bg-background-light min-h-screen transition-all duration-200">
                {/* Header */}
                <Header className="h-16 md:h-20 !bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <Button
                            type="text"
                            icon={<Menu size={24} />}
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden -ml-2 text-slate-600 flex md:!hidden"
                        />

                        {/* Breadcrumbs */}
                        <div className="flex items-center text-sm font-medium text-slate-500 gap-2">
                            <span className="hidden sm:inline">{isSuperAdmin ? 'Master Admin' : 'Vendor'}</span>
                            <span className="mx-2 text-xs hidden sm:inline">›</span>
                            <span className="text-slate-900 capitalize text-lg sm:text-sm font-bold sm:font-normal">
                                {location.pathname.split('/').pop()?.replace(/-/g, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Right: Search, Theme Toggle, Profile */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
                                <p className="text-xs text-slate-500">{isSuperAdmin ? 'Master Admin' : 'Vendor'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full !bg-indigo-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                                {user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </Header>

                <Content className="p-8 max-w-[1400px] mx-auto w-full bg-slate-50/50">
                    <Outlet />
                </Content>
            </Layout>

            {/* Reset Password Modal - Shows when vendor must reset password */}
            <ResetPasswordModal visible={!!user?.mustResetPassword} />
        </Layout>
    );
};
