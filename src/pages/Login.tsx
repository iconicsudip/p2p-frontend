import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalNotification } from '../components/GlobalNotification';
import { useLogin } from '../hooks/useAuth';
import { authAPI } from '../services/apiService';
import { UserRole } from '../types';
import { getSubdomain, getPortalName, getDefaultDashboardPath, isRoleValidForPortal } from '../utils/subdomain';
import { LoginForm } from '../components/auth/LoginForm';
import { LoginSidePanel } from '../components/auth/LoginSidePanel';

export const Login: React.FC = () => {
    const { login, user } = useAuth();
    const { notification } = useGlobalNotification();
    const loginMutation = useLogin();
    const navigate = useNavigate();
    const [portal] = useState(getSubdomain());
    const portalName = getPortalName();
    const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            // Validate user role matches portal
            if (!isRoleValidForPortal(user.role, portal)) {
                notification.error({
                    message: 'Access Denied',
                    description: `Please use the ${user.role === UserRole.SUPER_ADMIN ? 'admin' : 'vendor'} portal to login`,
                });
                return;
            }

            // Redirect to appropriate dashboard
            const dashboardPath = getDefaultDashboardPath(portal);
            navigate(dashboardPath);
        }
    }, [user, navigate, portal, notification]);

    const onFinish = async (values: { username: string; password: string }) => {
        try {
            const data = await loginMutation.mutateAsync(values);

            // Validate user role matches portal before logging in
            if (portal && !isRoleValidForPortal(data.user.role, portal)) {
                const correctPortal = data.user.role === UserRole.SUPER_ADMIN ? 'admin' : 'vendor';
                notification.error({
                    message: 'Access Denied',
                    description: `Please use the ${correctPortal} portal to login`,
                });
                return;
            }

            login(data.token, data.refreshToken, data.user);
            notification.success({
                message: 'Login Successful',
                description: 'Welcome back!',
            });

            // Navigation is handled by the useEffect watching 'user'
        } catch (error: any) {
            // Error is handled by axios interceptor or mutation onError
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            notification.error({
                message: 'Login Failed',
                description: errorMessage,
            });
        }
    };

    const onForgotPasswordFinish = async (values: { username: string; newPassword: string }) => {
        try {
            setForgotPasswordLoading(true);
            await authAPI.forgotPassword(values.username, values.newPassword);
            notification.success({
                message: 'Password Reset Successful',
                description: 'You can now login with your new password.',
            });
            setIsForgotPasswordModalVisible(false);
        } catch (error: any) {
            console.error('Forgot password error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
            notification.error({
                message: 'Reset Password Failed',
                description: errorMessage,
            });
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // Configuration based on portal type
    const isVendor = portal === 'vendor';

    // Admin config
    const adminConfig = {
        imageSrc: "/p2p-illustration.png",
        title: "Effortlessly manage your team and operations.",
        description: "Log in to access your dashboard, manage transactions, and track payments in real-time.",
        gradient: "bg-gradient-to-br from-indigo-600 to-violet-700"
    };

    // Vendor config
    const vendorConfig = {
        imageSrc: "/vendor-transfer-illustration.png",
        title: "Seamless P2P Transfers for Your Business.",
        description: "Experience fast, secure, and effortless money transfers between you and your partners.",
        gradient: "bg-gradient-to-br from-indigo-900 to-violet-900" // Deep purple/blue theme
    };

    const currentConfig = isVendor ? vendorConfig : adminConfig;

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
            {/* Left Side - Login Form Component */}
            <LoginForm
                portalName={portalName}
                onFinish={onFinish}
                isLoading={loginMutation.isPending}
                onForgotPassword={onForgotPasswordFinish}
                isForgotPasswordLoading={forgotPasswordLoading}
                isForgotPasswordModalVisible={isForgotPasswordModalVisible}
                setIsForgotPasswordModalVisible={setIsForgotPasswordModalVisible}
            />

            {/* Right Side - Feature Showcase Component */}
            <LoginSidePanel
                imageSrc={currentConfig.imageSrc}
                title={currentConfig.title}
                description={currentConfig.description}
                backgroundGradient={currentConfig.gradient}
            />
        </div>
    );
};
