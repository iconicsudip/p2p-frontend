import React, { createContext, useContext, ReactNode } from 'react';
import { App } from 'antd';

// Infer types from App.useApp
type UseAppReturnType = ReturnType<typeof App.useApp>;

// Create a context to hold the App instances
interface GlobalNotificationContextType {
    message: UseAppReturnType['message'];
    notification: UseAppReturnType['notification'];
    modal: UseAppReturnType['modal'];
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | null>(null);

// Custom hook to use the App instances
export const useGlobalNotification = () => {
    const context = useContext(GlobalNotificationContext);
    if (!context) {
        throw new Error('useGlobalNotification must be used within a GlobalNotificationProvider');
    }
    return context;
};

// Component that extracts the App instances and provides them via context
const ContextBridge: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { message, notification, modal } = App.useApp();

    return (
        <GlobalNotificationContext.Provider value={{ message, notification, modal }}>
            {children}
        </GlobalNotificationContext.Provider>
    );
};

// Main wrapper component
export const GlobalNotification: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <App>
            <ContextBridge>
                {children}
            </ContextBridge>
        </App>
    );
};
