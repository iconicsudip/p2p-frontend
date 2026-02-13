import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSubdomain } from '../utils/subdomain';
import { UserRole } from '../types';

/**
 * Component to handle root path redirect based on subdomain and auth status
 */
export const RootRedirect: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const portal = getSubdomain();

    // If not authenticated, go to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, redirect to appropriate dashboard
    // First check if portal matches user role
    if (portal === 'admin' && user.role === UserRole.SUPER_ADMIN) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (portal === 'vendor' && user.role === UserRole.VENDOR) {
        return <Navigate to="/vendor/dashboard" replace />;
    }

    // If no specific portal (localhost), redirect based on user role
    if (!portal) {
        const dashboardPath = user.role === UserRole.SUPER_ADMIN
            ? '/admin/dashboard'
            : '/vendor/dashboard';
        return <Navigate to={dashboardPath} replace />;
    }

    // If portal doesn't match user role, go to login
    return <Navigate to="/login" replace />;
};
