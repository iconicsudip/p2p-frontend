import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { VendorDashboard } from './pages/VendorDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { CreateRequest } from './pages/CreateRequest';
import { AvailableRequests } from './pages/AvailableRequests';
import { MyRequests } from './pages/MyRequests';
import { CreateVendor } from './pages/CreateVendor';
import { VendorsList } from './pages/VendorsList';
import { Notifications } from './pages/Notifications';
import { AdminActivityLog } from './pages/AdminActivityLog';
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
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            {/* Vendor Routes */}
                            <Route
                                path="/vendor"
                                element={
                                    <ProtectedRoute allowedRoles={[UserRole.VENDOR]}>
                                        <DashboardLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="dashboard" element={<VendorDashboard />} />
                                <Route path="create-request" element={<CreateRequest />} />
                                <Route path="available-requests" element={<AvailableRequests />} />
                                <Route path="my-requests" element={<MyRequests />} />
                                <Route path="notifications" element={<Notifications />} />
                            </Route>

                            {/* Super Admin Routes */}
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                                        <DashboardLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="dashboard" element={<SuperAdminDashboard />} />
                                <Route path="vendors" element={<VendorsList />} />
                                <Route path="activity-log" element={<AdminActivityLog />} />
                                <Route path="create-vendor" element={<CreateVendor />} />
                                <Route path="notifications" element={<Notifications />} />
                            </Route>

                            {/* Default redirect */}
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ConfigProvider>
    );
};

export default App;
