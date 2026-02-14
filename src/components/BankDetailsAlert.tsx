import React, { useState, useEffect } from 'react';
import { Alert } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminBankDetails } from '../hooks/useRequests';

const DISMISS_KEY = 'bank-details-alert-dismissed';

export const BankDetailsAlert: React.FC = () => {
    const { data: adminDetails, isLoading } = useAdminBankDetails();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
        setDismissed(isDismissed);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, 'true');
        setDismissed(true);
    };

    // Check if bank details are missing
    const hasBankDetails = adminDetails?.bankDetails && (
        adminDetails.bankDetails.accountNumber ||
        adminDetails.bankDetails.ifscCode ||
        adminDetails.bankDetails.bankName ||
        adminDetails.bankDetails.accountHolderName
    );
    const hasUpiId = adminDetails?.upiId;
    const hasQrCode = adminDetails?.qrCode;

    const isMissing = !hasBankDetails && !hasUpiId && !hasQrCode;

    if (isLoading || !isMissing || dismissed) {
        return null;
    }

    return (
        <Alert
            message={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-amber-600" />
                        <div>
                            <span className="font-semibold">Bank Details Missing</span>
                            <span className="ml-2 text-slate-600">
                                Please add your bank account details or UPI ID to enable deposit fallback for vendors.
                            </span>
                        </div>
                    </div>
                    <Link
                        to="/admin/settings"
                        className="ml-4 text-indigo-600 hover:text-indigo-700 font-semibold whitespace-nowrap"
                    >
                        Complete Now →
                    </Link>
                </div>
            }
            type="warning"
            closable
            onClose={handleDismiss}
            className="mb-6 border-amber-200 bg-amber-50"
        />
    );
};
