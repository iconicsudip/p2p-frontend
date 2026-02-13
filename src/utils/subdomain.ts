/**
 * Subdomain detection and validation utilities
 */

import { UserRole } from "../types";

export type PortalType = 'admin' | 'vendor' | null;

/**
 * Get the current subdomain from the hostname
 * @returns The subdomain (admin/vendor) or null if not on a subdomain
 */
export const getSubdomain = (): PortalType => {
    const hostname = window.location.hostname;

    // For localhost or IP addresses, check for specific ports or return null
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return null;
    }

    const parts = hostname.split('.');

    // Need at least subdomain.domain.tld (3 parts)
    if (parts.length < 3) {
        return null;
    }

    const subdomain = parts[0].toLowerCase();

    // Return recognized subdomains
    if (subdomain === 'admin') return 'admin';
    if (subdomain === 'vendor') return 'vendor';

    return null;
};

/**
 * Check if currently on admin portal
 */
export const isAdminPortal = (): boolean => {
    return getSubdomain() === 'admin';
};

/**
 * Check if currently on vendor portal
 */
export const isVendorPortal = (): boolean => {
    return getSubdomain() === 'vendor';
};

/**
 * Get the portal name for display
 */
export const getPortalName = (): string => {
    const subdomain = getSubdomain();
    if (subdomain === 'admin') return 'Admin Portal';
    if (subdomain === 'vendor') return 'Vendor Portal';
    return 'Portal';
};

/**
 * Get the default redirect path after login based on portal
 */
export const getDefaultDashboardPath = (portal: PortalType): string => {
    if (portal === 'admin') return '/admin/dashboard';
    if (portal === 'vendor') return '/vendor/dashboard';
    return '/';
};

/**
 * Check if a user role matches the current portal
 */
export const isRoleValidForPortal = (userRole: string, portal: PortalType): boolean => {
    if (portal === 'admin') return userRole === UserRole.SUPER_ADMIN;
    if (portal === 'vendor') return userRole === UserRole.VENDOR;
    // If no specific portal, allow both
    return true;
};
