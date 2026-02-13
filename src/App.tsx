import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SubdomainRouteGuard } from './components/SubdomainRouteGuard';
import { RootRedirect } from './components/RootRedirect';
import { DashboardLayout } from './components/DashboardLayout';
import { GlobalNotification } from './components/GlobalNotification';
import { Login } from './pages/Login';
import { VendorDashboard } from './pages/VendorDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { CreateRequest } from './pages/CreateRequest';
import { MyRequests } from './pages/MyRequests';
import { AdminMyRequests } from './pages/AdminMyRequests';
import { AllRequests } from './pages/AllRequests';
import { CreateVendor } from './pages/CreateVendor';
import { VendorsList } from './pages/VendorsList';
import { Notifications } from './pages/Notifications';
import { AdminActivityLog } from './pages/AdminActivityLog';
import { AdminSettings } from './pages/AdminSettings';
import { VendorSettings } from './pages/VendorSettings';
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
                                    <Route path="notifications" element={<Notifications />} />
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
