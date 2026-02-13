import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { getSubdomain } from '../utils/subdomain';

interface SubdomainRouteGuardProps {
    children: React.ReactNode;
    allowedPortal: 'admin' | 'vendor';
}

/**
 * Component to protect routes based on subdomain
 * Prevents admin routes on vendor subdomain and vice versa
 */
export const SubdomainRouteGuard: React.FC<SubdomainRouteGuardProps> = ({ children, allowedPortal }) => {
    const portal = getSubdomain();
    const location = useLocation();

    useEffect(() => {
        // If on a specific portal subdomain and trying to access wrong routes
        if (portal && portal !== allowedPortal) {
            message.error(`This section is not available on the ${portal} portal`);
        }
    }, [portal, allowedPortal, location]);

    // If on wrong portal, redirect to login
    if (portal && portal !== allowedPortal) {
        return <Navigate to="/login" replace />;
    }

    // If no specific portal (localhost), allow access
    return <>{children}</>;
};
