import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Building2, QrCode, Search, User, ArrowDown } from 'lucide-react';
import { useCreateRequest, useAvailableRequests, usePickRequest, useAdminBankDetails } from '../hooks/useRequests';
import { requestAPI } from '../services/apiService';
import { RequestType, CreateRequestRequest, UserRole } from '../types';

enum PaymentMethod {
    BANK = 'bank',
    UPI = 'upi'
}

export const CreateRequest: React.FC = () => {
    const [form] = Form.useForm();
    const [requestType, setRequestType] = useState<RequestType>(RequestType.WITHDRAWAL);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);

    // Watch the amount field for real-time smart pick logic
    const currentAmount = Form.useWatch('amount', form);

    // Modal state for smart pick
    const [isPickModalVisible, setIsPickModalVisible] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
    const [pickAmount, setPickAmount] = useState<number | null>(null);

    // Modal state for bulk upload
    const [isBulkUploadModalVisible, setIsBulkUploadModalVisible] = useState(false);
    const [bulkUploadText, setBulkUploadText] = useState('');

    // Modal state for bank details after pick
    const [isBankDetailsModalVisible, setIsBankDetailsModalVisible] = useState(false);
    const [pickedRequestDetails, setPickedRequestDetails] = useState<any>(null);

    const navigate = useNavigate();

    const createRequestMutation = useCreateRequest();
    const pickRequestMutation = usePickRequest();

    // Query for available withdrawals matching the amount (only active when searching for Deposit)
    const { data: availableData, isLoading: isSearching } = useAvailableRequests({
        page: 1,
        limit: 50,
        // Removed amount filter to show all requests as per user requirement
        // amount: searchAmount, 
        type: RequestType.WITHDRAWAL // To Deposit, we look for Withdrawals
    }, {
        enabled: requestType === RequestType.DEPOSIT // Enable whenever in DEPOSIT mode, logic handles display
    });

    // Fetch admin bank details for fallback
    const { data: adminDetails } = useAdminBankDetails();

    const onFinish = async (values: any) => {
        if (requestType === RequestType.DEPOSIT) {
            // No action needed for DEPOSIT as the list is live and filtering is removed
            return;
        }

        try {
            // Ensure amount is number and clean up unused payment fields
            const payload: CreateRequestRequest = {
                type: requestType,
                amount: Number(values.amount),
                bankDetails: paymentMethod === PaymentMethod.BANK ? values.bankDetails : undefined,
                upiId: paymentMethod === PaymentMethod.UPI ? values.upiId : undefined,
            };

            await createRequestMutation.mutateAsync(payload);
            form.resetFields();
            // Stay on the same page after creating request
        } catch (error) {
            console.error('Failed to create request:', error);
        }
    };

    const openPickModal = (req: any) => {
        setSelectedWithdrawal(req);
        // Default logic:
        // If My Amount (from input) >= Req.amount -> Pick Req.amount (Full)
        // If My Amount < Req.amount -> Pick My Amount (Partial)
        // If My Amount is empty, default to Req.amount

        const myDepositAmount = Number(currentAmount);
        const hasAmount = !isNaN(myDepositAmount) && myDepositAmount > 0;

        const defaultPick = hasAmount
            ? Math.min(myDepositAmount, req.amount)
            : req.amount;

        setPickAmount(defaultPick);
        setIsPickModalVisible(true);
    };

    const handleSmartPick = async () => {
        if (!selectedWithdrawal || !pickAmount) return;

        try {
            let requestIdToPick = selectedWithdrawal.id;

            // If this is an admin fallback (no real ID yet), create the admin withdrawal request first
            if (selectedWithdrawal.id === 'admin-fallback') {
                setIsCreatingAdminRequest(true);
                try {
                    const response = await requestAPI.createAdminWithdrawal(Number(currentAmount));
                    requestIdToPick = response.data.request.id;
                    message.info('Admin withdrawal request created');
                } catch (error) {
                    console.error('Failed to create admin withdrawal request:', error);
                    message.error('Failed to create admin withdrawal request');
                    setIsCreatingAdminRequest(false);
                    return;
                } finally {
                    setIsCreatingAdminRequest(false);
                }
            }

            // Pick the request normally (works for both vendor and admin requests)
            await pickRequestMutation.mutateAsync({
                requestId: requestIdToPick,
                amount: pickAmount
            });
            message.success(`Successfully picked request for ₹${pickAmount.toLocaleString()}`);
            setIsPickModalVisible(false);

            // Show bank details modal instead of redirecting
            // For admin withdrawal requests, use admin's bank details
            // Check if it's admin fallback (ID = 'admin-fallback') or created by admin
            const isAdminWithdrawal = selectedWithdrawal?.id === 'admin-fallback' ||
                (selectedWithdrawal?.type === RequestType.WITHDRAWAL &&
                    selectedWithdrawal?.createdBy?.role === UserRole.SUPER_ADMIN);

            console.log('Admin withdrawal check:', {
                requestId: selectedWithdrawal?.id,
                isAdminWithdrawal,
                hasAdminBankDetails: !!adminDetails?.bankDetails,
                adminDetails: adminDetails
            });

            setPickedRequestDetails({
                ...selectedWithdrawal,
                pickedAmount: pickAmount,
                // If it's an admin withdrawal, use admin's bank details
                bankDetails: isAdminWithdrawal && adminDetails?.bankDetails
                    ? adminDetails.bankDetails
                    : selectedWithdrawal?.bankDetails,
                upiId: isAdminWithdrawal && adminDetails?.upiId
                    ? adminDetails.upiId
                    : selectedWithdrawal?.upiId
            });
            setIsBankDetailsModalVisible(true);
        } catch (error) {
            console.error('Failed to pick request:', error);
        }
    };

    const handleBulkUpload = () => {
        if (!bulkUploadText.trim()) {
            message.error('Please enter bank details');
            return;
        }

        try {
            // Regex patterns to extract bank details
            const accountNumberMatch = bulkUploadText.match(/Account Number:\s*(.+)/i);
            const ifscCodeMatch = bulkUploadText.match(/IFSC Code:\s*(.+)/i);
            const bankNameMatch = bulkUploadText.match(/Bank Name:\s*(.+)/i);
            const accountHolderNameMatch = bulkUploadText.match(/Account Holder Name:\s*(.+)/i);

            // Extract and trim values
            const accountNumber = accountNumberMatch?.[1]?.trim();
            const ifscCode = ifscCodeMatch?.[1]?.trim();
            const bankName = bankNameMatch?.[1]?.trim();
            const accountHolderName = accountHolderNameMatch?.[1]?.trim();

            // Validate that all fields are present
            if (!accountNumber || !ifscCode || !bankName || !accountHolderName) {
                message.error('Missing required fields. Please check the format and try again.');
                return;
            }

            // Populate form fields
            form.setFieldsValue({
                bankDetails: {
                    accountNumber,
                    ifscCode: ifscCode.toUpperCase(),
                    bankName,
                    accountHolderName
                }
            });

            message.success('Bank details populated successfully!');
            setIsBulkUploadModalVisible(false);
            setBulkUploadText('');
        } catch (error) {
            message.error('Failed to parse bank details. Please check the format.');
            console.error('Bulk upload error:', error);
        }
    };

    // Filtered requests to show
    const matchingRequests = availableData?.requests?.data || [];

    // Determine if we should show admin fallback
    // Show admin if: 1) no withdrawal requests available, OR 2) deposit amount > max available request amount
    const shouldShowAdminFallback = requestType === RequestType.DEPOSIT && adminDetails && currentAmount && (
        matchingRequests.length === 0 || // No requests available
        Math.max(...matchingRequests.map((r: any) => r.amount)) < Number(currentAmount) // Amount too large
    );

    // State to track if admin request is being created
    const [isCreatingAdminRequest, setIsCreatingAdminRequest] = useState(false);


    return (
        <div className="mx-auto min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                        {requestType === RequestType.WITHDRAWAL ? 'Create Withdrawal Request' : 'Find Deposit Request'}
                    </h1>
                    <p className="text-slate-500">
                        {requestType === RequestType.WITHDRAWAL
                            ? 'Request a withdrawal from your wallet'
                            : 'Find pending withdrawal requests to deposit funds'}
                    </p>
                </div>
            </div>

            <Card bordered={false} className="shadow-lg shadow-slate-200/50 rounded-[20px] overflow-hidden mb-8">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ type: RequestType.WITHDRAWAL }}
                    className="p-2"
                >
                    {/* Request Type */}
                    <Form.Item label={<span className="font-semibold text-slate-700">Transaction Type</span>}>
                        <div className="flex bg-slate-50 p-1 rounded-xl w-64 border border-slate-100">
                            <button
                                type="button"
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${requestType === RequestType.WITHDRAWAL
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => {
                                    setRequestType(RequestType.WITHDRAWAL);
                                    form.resetFields();
                                }}
                            >
                                Withdrawal
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${requestType === RequestType.DEPOSIT
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => {
                                    setRequestType(RequestType.DEPOSIT);
                                    form.resetFields();
                                }}
                            >
                                Deposit
                            </button>
                        </div>
                    </Form.Item>

                    {/* Amount & Search (Horizontal layout only for DEPOSIT) */}
                    {requestType === RequestType.DEPOSIT ? (
                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Amount</span>}
                            required
                            className="mb-6"
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                <Form.Item
                                    name="amount"
                                    rules={[{ required: true, message: 'Please enter amount!' }]}
                                    noStyle
                                >
                                    <Input
                                        placeholder="Enter amount"
                                        prefix={<span className="text-slate-400 font-semibold mr-1">₹</span>}
                                        className="h-12 rounded-xl text-base flex-1"
                                        type="number"
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size='large'
                                    loading={isSearching}
                                    icon={<Search size={18} />}
                                    className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 border-none font-semibold text-base w-full md:w-auto"
                                >
                                    Generate Requests
                                </Button>
                            </div>
                        </Form.Item>
                    ) : (
                        // Standard Vertical Layout for WITHDRAWAL
                        <Form.Item
                            name="amount"
                            label={<span className="font-semibold text-slate-700">Amount</span>}
                            rules={[
                                { required: true, message: 'Please enter amount!' },
                            ]}
                        >
                            <Input
                                placeholder="Enter amount"
                                prefix={<span className="text-slate-400 font-semibold mr-1">₹</span>}
                                className="h-12 rounded-xl text-base w-full"
                                type="number"
                            />
                        </Form.Item>
                    )}

                    {/* Withdrawal Specific Sections */}
                    {requestType === RequestType.WITHDRAWAL && (
                        <div className="animate-fade-in">
                            <div className="mt-8 mb-6 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 m-0">Payment Details</h3>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {paymentMethod === PaymentMethod.BANK
                                                ? 'Provide your settlement account information'
                                                : 'Select your preferred payment method'}
                                        </p>
                                    </div>
                                    {paymentMethod === PaymentMethod.BANK && (
                                        <Button
                                            type="default"
                                            onClick={() => setIsBulkUploadModalVisible(true)}
                                            className="h-9 px-4 rounded-lg border border-indigo-200 text-indigo-600 font-medium hover:bg-indigo-50"
                                        >
                                            Bulk Upload
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Payment Method Tabs */}
                            <div className="flex border-b border-slate-100 mb-6">
                                <button
                                    type="button"
                                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-all border-b-2 ${paymentMethod === PaymentMethod.BANK
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setPaymentMethod(PaymentMethod.BANK)}
                                >
                                    <Building2 className="text-lg" />
                                    Bank Details
                                </button>
                                <button
                                    type="button"
                                    className={`flex items-center gap-2 pb-3 px-1 ml-6 text-sm font-semibold transition-all border-b-2 ${paymentMethod === PaymentMethod.UPI
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setPaymentMethod(PaymentMethod.UPI)}
                                >
                                    <QrCode className="text-lg" />
                                    UPI ID
                                </button>
                            </div>

                            {/* Bank Details Grid */}
                            {paymentMethod === PaymentMethod.BANK && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 animate-fade-in">
                                    <Form.Item
                                        label={<span className="font-medium text-slate-600">Bank Account Number</span>}
                                        name={['bankDetails', 'accountNumber']}
                                        rules={[
                                            { required: true, message: 'Please enter account number' },
                                            { pattern: /^\d{9,18}$/, message: 'Enter a valid account number (9-18 digits)' }
                                        ]}
                                    >
                                        <Input placeholder="Enter account number" className="h-11 rounded-lg" maxLength={18} />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="font-medium text-slate-600">IFSC Code</span>}
                                        name={['bankDetails', 'ifscCode']}
                                        rules={[
                                            { required: true, message: 'Please enter IFSC code' },
                                            { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Enter a valid IFSC code (e.g., SBIN0123456)' }
                                        ]}
                                    >
                                        <Input
                                            placeholder="Enter IFSC code"
                                            className="h-11 rounded-lg"
                                            maxLength={11}
                                            onChange={(e) => {
                                                const { value } = e.target;
                                                form.setFieldValue(['bankDetails', 'ifscCode'], value.toUpperCase());
                                            }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="font-medium text-slate-600">Bank Name</span>}
                                        name={['bankDetails', 'bankName']}
                                        rules={[
                                            { required: true, message: 'Please enter bank name' },
                                            { pattern: /^[a-zA-Z\s]+$/, message: 'Bank name should only contain letters' }
                                        ]}
                                    >
                                        <Input placeholder="Enter bank name" className="h-11 rounded-lg" />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="font-medium text-slate-600">Account Holder Name</span>}
                                        name={['bankDetails', 'accountHolderName']}
                                        rules={[
                                            { required: true, message: 'Please enter account holder name' },
                                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name should only contain letters' }
                                        ]}
                                    >
                                        <Input placeholder="Enter account holder name" className="h-11 rounded-lg" />
                                    </Form.Item>
                                </div>
                            )}

                            {/* UPI ID Field */}
                            {paymentMethod === PaymentMethod.UPI && (
                                <div className="animate-fade-in">
                                    <Form.Item
                                        label={<span className="font-medium text-slate-600">UPI ID</span>}
                                        name="upiId"
                                        rules={[
                                            { required: true, message: 'Please enter UPI ID' },
                                            { pattern: /^[\w.-]+@[\w.-]+$/, message: 'Enter a valid UPI ID (e.g., username@upi)' }
                                        ]}
                                    >
                                        <Input
                                            placeholder="username@upi"
                                            prefix={<span className="text-slate-400 text-lg mr-1">@</span>}
                                            className="h-11 rounded-lg"
                                        />
                                    </Form.Item>
                                    <p className="text-slate-400 text-xs mt-1">
                                        Ensure the UPI ID is linked to your account for faster processing.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 mt-8">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={createRequestMutation.isPending}
                                    className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 border-none font-semibold text-base"
                                >
                                    Create Request
                                </Button>
                                <Button
                                    onClick={() => navigate('/vendor/my-requests')}
                                    className="h-11 px-8 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:text-slate-700 text-base"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </Card>

            {/* Matching Requests List for Deposit Mode - Show if DEPOSIT mode is selected */}
            {requestType === RequestType.DEPOSIT && (
                <div className="animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3 mt-4">
                        Available Withdrawals
                        {/* Removed specific amount text since we show all */}
                        {!isSearching && (
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                {matchingRequests.length} {matchingRequests.length === 1 ? 'result' : 'results'}
                            </span>
                        )}
                    </h3>

                    <div className="space-y-4">
                        {isSearching ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                <p className="text-slate-500">Searching for requests...</p>
                            </div>
                        ) : matchingRequests.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
                                <Building2 size={48} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-slate-500 font-medium">No active withdrawal requests found</p>
                                <p className="text-slate-400 text-sm">Check back later for new requests</p>
                            </div>
                        ) : (
                            matchingRequests.map((req: any) => (
                                <Card key={req.id} bordered={false} className="shadow-sm border border-slate-100 rounded-xl hover:shadow-md transition-shadow !mt-4">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                                <ArrowDown size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">₹{req.amount.toLocaleString()}</span>
                                                    <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full uppercase">WITHDRAWAL</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="text-sm text-slate-600 font-medium">{req.createdBy?.name}</span>
                                                    <span className="text-xs text-slate-400 border-l border-slate-200 pl-2 ml-1">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="primary"
                                            onClick={() => openPickModal(req)}
                                            loading={pickRequestMutation.isPending && pickRequestMutation.variables?.requestId === req.id}
                                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-lg font-medium"
                                        >
                                            Pick Request
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}

                        {/* Admin Fallback Card - Shows as a pickable request */}
                        {shouldShowAdminFallback && (
                            <Card bordered={false} className="shadow-sm border-2 border-purple-200 rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-purple-50 to-indigo-50 !mt-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                            <ArrowDown size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">₹{Number(currentAmount).toLocaleString()}</span>
                                                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full uppercase">ADMIN WITHDRAWAL</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-600 font-medium">{adminDetails?.name || 'Admin'}</span>
                                                <span className="text-xs text-purple-600 border-l border-purple-200 pl-2 ml-1">
                                                    Always Available
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="primary"
                                        onClick={() => openPickModal({
                                            id: 'admin-fallback',
                                            amount: Number(currentAmount),
                                            createdBy: adminDetails,
                                            type: RequestType.WITHDRAWAL,
                                            status: 'PENDING'
                                        })}
                                        className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 h-10 px-6 rounded-lg font-medium"
                                        loading={isCreatingAdminRequest}
                                    >
                                        Pick Request
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )
            }

            {/* Smart Pick Modal */}
            <Modal
                title={<span className="text-lg font-bold">Confirm Pick Amount</span>}
                open={isPickModalVisible}
                onCancel={() => setIsPickModalVisible(false)}
                footer={null}
                centered
            >
                {selectedWithdrawal && (
                    <div className="pt-4">
                        <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-3 border border-slate-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Available Withdrawal:</span>
                                <span className="font-bold text-slate-700">₹{selectedWithdrawal.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Your Deposit Amount:</span>
                                <span className="font-bold text-indigo-600">
                                    {Number(currentAmount) > 0 ? `₹${Number(currentAmount).toLocaleString()}` : 'Not specified'}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Amount to Pick
                            </label>
                            <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-indigo-600">
                                    ₹{pickAmount?.toLocaleString()}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                {pickAmount && pickAmount < selectedWithdrawal.amount
                                    ? `You will pick ₹${pickAmount.toLocaleString()}. A new request of ₹${(selectedWithdrawal.amount - pickAmount).toLocaleString()} will be created for the remaining balance.`
                                    : 'You are picking the full amount of this request.'}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                className="flex-1 h-11 rounded-xl"
                                onClick={() => setIsPickModalVisible(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleSmartPick}
                                loading={pickRequestMutation.isPending}
                                disabled={!pickAmount || pickAmount <= 0 || pickAmount > selectedWithdrawal.amount}
                            >
                                Confirm & Pick
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal
                title={<span className="text-lg font-bold">Bulk Upload Bank Details</span>}
                open={isBulkUploadModalVisible}
                onCancel={() => {
                    setIsBulkUploadModalVisible(false);
                    setBulkUploadText('');
                }}
                footer={null}
                centered
                width={600}
            >
                <div className="pt-4">
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Paste Bank Details
                        </label>
                        <Input.TextArea
                            value={bulkUploadText}
                            onChange={(e) => setBulkUploadText(e.target.value)}
                            placeholder="Paste your bank details here..."
                            rows={6}
                            className="rounded-xl text-sm"
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600 uppercase">Example Format</span>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => setBulkUploadText(`Account Number: 12132444244
IFSC Code: SBIN0000000
Bank Name: SBI
Account Holder Name: Test`)}
                                className="text-xs h-6 p-0 text-indigo-600"
                            >
                                Use Example
                            </Button>
                        </div>
                        <pre className="text-xs text-slate-600 font-mono bg-white p-3 rounded-lg border border-slate-200 m-0">
                            {`Account Number: 12132444244
IFSC Code: SBIN0000000
Bank Name: SBI
Account Holder Name: Test`}
                        </pre>
                        <p className="text-xs text-slate-500 mt-2 mb-0">
                            Copy the above format and replace with your actual bank details.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            className="flex-1 h-11 rounded-xl"
                            onClick={() => {
                                setIsBulkUploadModalVisible(false);
                                setBulkUploadText('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleBulkUpload}
                            disabled={!bulkUploadText.trim()}
                        >
                            Parse & Fill
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Bank Details Modal - Show after picking a request */}
            <Modal
                open={isBankDetailsModalVisible}
                onCancel={() => {
                    setIsBankDetailsModalVisible(false);
                    setPickedRequestDetails(null);
                }}
                footer={null}
                width={600}
                centered
            >
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="text-green-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Picked Successfully!</h2>
                        <p className="text-slate-600">
                            Amount: <span className="font-bold text-green-600">₹{pickedRequestDetails?.pickedAmount?.toLocaleString()}</span>
                        </p>
                    </div>

                    {pickedRequestDetails?.bankDetails && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Building2 size={20} className="text-indigo-600" />
                                Bank Account Details
                            </h3>

                            <div className="space-y-3">
                                {/* Amount */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                                        <code className="text-slate-800 font-mono text-sm">₹{pickedRequestDetails.pickedAmount?.toLocaleString()}</code>
                                    </div>
                                </div>

                                {/* Account Holder Name */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account Holder Name</p>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                                        <code className="text-slate-800 font-mono text-sm">{pickedRequestDetails.bankDetails.accountHolderName}</code>
                                    </div>
                                </div>

                                {/* Account Number */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account Number</p>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                                        <code className="text-slate-800 font-mono text-sm">{pickedRequestDetails.bankDetails.accountNumber}</code>
                                    </div>
                                </div>

                                {/* IFSC Code */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">IFSC Code</p>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                                        <code className="text-slate-800 font-mono text-sm">{pickedRequestDetails.bankDetails.ifscCode}</code>
                                    </div>
                                </div>

                                {/* Bank Name */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Name</p>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                                        <code className="text-slate-800 font-mono text-sm">{pickedRequestDetails.bankDetails.bankName}</code>
                                    </div>
                                </div>
                            </div>

                            {/* Copy All Button */}
                            <Button
                                type="primary"
                                block
                                size="large"
                                onClick={() => {
                                    const bankDetails = pickedRequestDetails.bankDetails;
                                    const copyText = `Amount: ₹${pickedRequestDetails.pickedAmount?.toLocaleString()}
Account Holder Name: ${bankDetails.accountHolderName}
Account Number: ${bankDetails.accountNumber}
IFSC Code: ${bankDetails.ifscCode}
Bank Name: ${bankDetails.bankName}`;
                                    navigator.clipboard.writeText(copyText);
                                    message.success('All bank details copied!');
                                }}
                                className="mt-4 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold"
                            >
                                Copy All Details
                            </Button>
                        </div>
                    )}

                    {pickedRequestDetails?.upiId && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 mt-4">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <QrCode size={20} className="text-purple-600" />
                                UPI Details
                            </h3>

                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">UPI ID</p>
                                <div className="bg-white rounded-xl p-3 border border-slate-200">
                                    <code className="text-slate-800 font-mono text-sm">{pickedRequestDetails.upiId}</code>
                                </div>
                            </div>

                            {/* Copy UPI Button */}
                            <Button
                                type="primary"
                                block
                                size="large"
                                onClick={() => {
                                    const copyText = `Amount: ₹${pickedRequestDetails.pickedAmount?.toLocaleString()}
UPI ID: ${pickedRequestDetails.upiId}`;
                                    navigator.clipboard.writeText(copyText);
                                    message.success('UPI details copied!');
                                }}
                                className="mt-4 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold"
                            >
                                Copy UPI Details
                            </Button>
                        </div>
                    )}

                    <div className="mt-6">
                        <Button
                            block
                            size="large"
                            onClick={() => {
                                setIsBankDetailsModalVisible(false);
                                setPickedRequestDetails(null);
                            }}
                            className="h-12 rounded-xl font-semibold"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};
