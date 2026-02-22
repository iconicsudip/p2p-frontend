import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { GlobalNotification } from './components/GlobalNotification';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RootRedirect } from './components/RootRedirect';
import { SubdomainRouteGuard } from './components/SubdomainRouteGuard';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import { AccountList } from './pages/AdminAccounts/AccountList';
import { AddAccount } from './pages/AdminAccounts/AddAccount';
import { AdminActivityLog } from './pages/AdminActivityLog';
import { AdminMyRequests } from './pages/AdminMyRequests';
import { AdminSettings } from './pages/AdminSettings';
import { AllRequests } from './pages/AllRequests';
import { CancelledRequests } from './pages/CancelledRequests';
import { VendorCancelledRequests } from './pages/VendorCancelledRequests';
import { CreateRequest } from './pages/CreateRequest';
import { CreateVendor } from './pages/CreateVendor';
import { Login } from './pages/Login';
import { MyRequests } from './pages/MyRequests';
import { Notifications } from './pages/Notifications';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { VendorDashboard } from './pages/VendorDashboard';
import { VendorSettings } from './pages/VendorSettings';
import { VendorsList } from './pages/VendorsList';
import { UserRole } from './types';

const App: React.FC = () => {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#667eea',
                    borderRadius: 8,
                },
            }}
        >
            <GlobalNotification>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/login" element={<Login />} />

                                {/* Vendor Routes */}
                                <Route
                                    path="/vendor"
                                    element={
                                        <SubdomainRouteGuard allowedPortal="vendor">
                                            <ProtectedRoute allowedRoles={[UserRole.VENDOR]}>
                                                <DashboardLayout />
                                            </ProtectedRoute>
                                        </SubdomainRouteGuard>
                                    }
                                >
                                    <Route path="dashboard" element={<VendorDashboard />} />
                                    <Route path="create-request" element={<CreateRequest />} />
                                    <Route path="my-requests" element={<MyRequests />} />
                                    <Route path="picked-requests" element={<MyRequests />} />
                                    <Route path="cancelled-requests" element={<VendorCancelledRequests />} />
                                    <Route path="notifications" element={<Notifications />} />
                                    <Route path="settings" element={<VendorSettings />} />
                                </Route>

                                {/* Super Admin Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <SubdomainRouteGuard allowedPortal="admin">
                                            <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                                                <DashboardLayout />
                                            </ProtectedRoute>
                                        </SubdomainRouteGuard>
                                    }
                                >
                                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                                    <Route path="vendors" element={<VendorsList />} />
                                    <Route path="requests" element={<AllRequests />} />
                                    <Route path="activity-log" element={<AdminActivityLog />} />
                                    <Route path="create-vendor" element={<CreateVendor />} />
                                    <Route path="settings" element={<AdminSettings />} />
                                    <Route path="my-requests" element={<AdminMyRequests />} />
                                    <Route path="picked-requests" element={<AdminMyRequests />} />
                                    <Route path="cancelled-requests" element={<CancelledRequests />} />
                                    <Route path="notifications" element={<Notifications />} />
                                    <Route path="accounts/list" element={<AccountList />} />
                                    <Route path="accounts/add" element={<AddAccount />} />
                                </Route>

                                {/* Default redirect based on subdomain and auth */}
                                <Route path="/" element={<RootRedirect />} />
                                <Route path="*" element={<RootRedirect />} />
                            </Routes>
                        </BrowserRouter>
                    </AuthProvider>
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
            </GlobalNotification>
        </ConfigProvider>
    );
};

export default App;
