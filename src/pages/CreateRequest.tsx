import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Modal, InputNumber } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Building2, QrCode, Search, User, ArrowDown } from 'lucide-react';
import { useCreateRequest, useAvailableRequests, usePickRequest } from '../hooks/useRequests';
import { RequestType, CreateRequestRequest } from '../types';

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

    const navigate = useNavigate();

    const createRequestMutation = useCreateRequest();
    const pickRequestMutation = usePickRequest();

    // Query for available withdrawals matching the amount (only active when searching for Deposit)
    const { data: availableData, isLoading: isSearching, isFetched } = useAvailableRequests({
        page: 1,
        limit: 50,
        // Removed amount filter to show all requests as per user requirement
        // amount: searchAmount, 
        type: RequestType.WITHDRAWAL // To Deposit, we look for Withdrawals
    }, {
        enabled: requestType === RequestType.DEPOSIT // Enable whenever in DEPOSIT mode, logic handles display
    });

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
            navigate('/vendor/my-requests');
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
            await pickRequestMutation.mutateAsync({
                requestId: selectedWithdrawal.id,
                amount: pickAmount
            });
            message.success(`Successfully picked request for ₹${pickAmount.toLocaleString()}`);
            setIsPickModalVisible(false);
            navigate('/vendor/my-requests?tab=picked');
        } catch (error) {
            console.error('Failed to pick request:', error);
        }
    };

    // Filtered requests to show
    const matchingRequests = availableData?.requests?.data || [];

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
                                <h3 className="text-lg font-bold text-slate-800 m-0">Payment Details</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    {paymentMethod === PaymentMethod.BANK
                                        ? 'Provide your settlement account information'
                                        : 'Select your preferred payment method'}
                                </p>
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
                                <Card key={req.id} bordered={false} className="shadow-sm border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
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
                    </div>
                </div>
            )}

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
                            <InputNumber
                                style={{ width: '100%' }}
                                size="large"
                                value={pickAmount}
                                onChange={(val) => setPickAmount(val)}
                                max={selectedWithdrawal.amount}
                                min={1}
                                prefix="₹"
                                className="w-full rounded-xl"
                            />
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
        </div>
    );
};
