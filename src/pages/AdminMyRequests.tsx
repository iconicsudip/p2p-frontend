import React from 'react';
import { MyRequests } from './MyRequests';

// Admin My Requests is identical to vendor My Requests
// Admin creates withdrawal requests that vendors pick
// Admin then verifies the payment slips uploaded by vendors
export const AdminMyRequests: React.FC = () => {
    return <MyRequests />;
};
