import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { getSubdomain } from '../utils/subdomain';
import { authAPI } from '../services/apiService';


interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, refreshToken: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    isSuperAdmin: boolean;
    isVendor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get portal-specific localStorage keys
const getStorageKeys = () => {
    const portal = getSubdomain();
    const prefix = portal ? `${portal}_` : '';
    return {
        token: `${prefix}token`,
        refreshToken: `${prefix}refreshToken`,
        user: `${prefix}user`,
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const keys = getStorageKeys();
        const storedToken = localStorage.getItem(keys.token);
        const storedUser = localStorage.getItem(keys.user);

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newRefreshToken: string, newUser: User) => {
        const keys = getStorageKeys();
        localStorage.setItem(keys.token, newToken);
        localStorage.setItem(keys.refreshToken, newRefreshToken);
        localStorage.setItem(keys.user, JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        const keys = getStorageKeys();
        try {
            // Call logout API to log the activity
            // This line assumes 'authAPI' is imported and has a 'logout' method.
            // If not, you'll need to define or import 'authAPI'.
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem(keys.token);
            localStorage.removeItem(keys.refreshToken);
            localStorage.removeItem(keys.user);
            setToken(null);
            setUser(null);
        }
    };

    const updateUser = (updatedUser: User) => {
        const keys = getStorageKeys();
        localStorage.setItem(keys.user, JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
        isLoading,
        isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
        isVendor: user?.role === UserRole.VENDOR,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
