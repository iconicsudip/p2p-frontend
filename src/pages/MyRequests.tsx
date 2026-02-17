import { Button, DatePicker, Dropdown, Form, Image, Input, message, Modal, Select, Space, Spin, Table, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { AlertCircle, AlertTriangle, Check, CheckCircle, Copy, Eye, MoreVertical, QrCode, RotateCcw, Trash2, Upload as UploadIcon, X, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    useCreatedRequests,
    useDeleteRequest,
    usePickedRequests,
    useReportPaymentFailure,
    useRequestDetails,
    useRevertRequest,
    useUploadPaymentSlip,
    useVerifyPayment,
} from '../hooks/useRequests';
import { requestAPI } from '../services/apiService';
import { Request, RequestStatus, RequestType } from '../types';
import { compressImage } from '../utils/imageUtils';


export const MyRequests: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active view based on URL
    const isPickedView = location.pathname.includes('picked-requests');

    const [createdPage, setCreatedPage] = useState(1);
    const [createdLimit, setCreatedLimit] = useState(10);
    const [pickedPage, setPickedPage] = useState(1);
    const [pickedLimit, setPickedLimit] = useState(10);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [bankDetailsModalVisible, setBankDetailsModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [form] = Form.useForm();

    // Filter states
    const queryParams = new URLSearchParams(location.search);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(queryParams.get('status') || undefined);
    const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<string | undefined>(queryParams.get('type') || undefined);

    useEffect(() => {
        const status = queryParams.get('status');
        const type = queryParams.get('type');
        if (status) setStatusFilter(status);
        if (type) setTypeFilter(type);
    }, [location.search]);

    // Only fetch the data needed for the current view
    const { data: createdData, refetch: refetchCreated, isLoading: createdLoading } = useCreatedRequests(createdPage, createdLimit, !isPickedView, {
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        status: statusFilter,
        type: typeFilter
    });
    const { data: pickedRequestsData, refetch: refetchPicked, isLoading: pickedLoading } = usePickedRequests(pickedPage, pickedLimit, isPickedView, {
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        status: statusFilter,
        type: typeFilter
    });
    const { data: detailedRequest, isLoading: isDetailsLoading } = useRequestDetails(selectedRequest?.id || '', !!selectedRequest?.id);



    const uploadMutation = useUploadPaymentSlip();
    const verifyMutation = useVerifyPayment();
    const reportFailureMutation = useReportPaymentFailure();
    const revertRequestMutation = useRevertRequest();
    const deleteRequestMutation = useDeleteRequest();

    const [failureModalVisible, setFailureModalVisible] = useState(false);
    const [revertModalVisible, setRevertModalVisible] = useState(false);
    const [failureReason, setFailureReason] = useState('');

    // Cancel Modal state
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [selectedRequestForCancel, setSelectedRequestForCancel] = useState<Request | null>(null);

    // Image preview state
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // View slip modal state
    const [viewSlipModalVisible, setViewSlipModalVisible] = useState(false);
    const [selectedSlipToView, setSelectedSlipToView] = useState<string | null>(null);
    const [slipLoading, setSlipLoading] = useState(false);

    useEffect(() => {
        if (uploadModalVisible && selectedRequest) {
            form.setFieldsValue({
                amount: (selectedRequest.pendingAmount || selectedRequest.amount || 0).toLocaleString()
            });
        }
    }, [uploadModalVisible, selectedRequest, form]);


    const createdRequests = createdData?.createdRequests?.data || [];
    const createdMeta = createdData?.createdRequests?.meta || { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
    const pickedRequests = pickedRequestsData?.pickedRequests?.data || [];
    const pickedMeta = pickedRequestsData?.pickedRequests?.meta || { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };

    const handleCreatedTableChange = (pagination: any) => {
        setCreatedPage(pagination.current);
        setCreatedLimit(pagination.pageSize);
    };

    const handlePickedTableChange = (pagination: any) => {
        setPickedPage(pagination.current);
        setPickedLimit(pagination.pageSize);
    };

    // Helper function to view payment slip
    const handleViewSlip = async (request: Request) => {
        if (!request.paymentSlips || request.paymentSlips.length === 0) return;

        // Open modal immediately with loading state
        setViewSlipModalVisible(true);
        setSlipLoading(true);
        setSelectedSlipToView(null);

        try {
            // Call API to get the payment slip URL
            const response = await requestAPI.getPaymentSlipUrl(request.id, request.paymentSlips[0].id);
            setSelectedSlipToView(response.data.url);
        } catch (error) {
            console.error('Failed to get payment slip URL:', error);
            message.error('Failed to load payment slip');
            setViewSlipModalVisible(false);
        } finally {
            setSlipLoading(false);
        }
    };

    const handleUploadSlip = async (values: { amount: number; paymentSlip: any }) => {
        if (!selectedRequest) return;

        let file = values.paymentSlip;

        // If it's a fileList array (from getValueFromEvent), take the first item
        if (Array.isArray(file)) {
            file = file[0];
        } else if (file && file.file) {
            // Sometimes standardized onChange gives { file: ..., fileList: ... }
            file = file.file;
        }

        // Handle AntD Upload wrapping structure if needed (usually .file or .originFileObj)
        if (file && file.originFileObj) {
            file = file.originFileObj;
        }

        if (!file) {
            message.error('Please select a file to upload');
            return;
        }

        const hide = message.loading('Processing image...', 0);

        try {
            // Compress image if larger than 1MB
            if (file.size > 1024 * 1024) {
                hide(); // hide previous loading
                message.loading('Compressing image...', 1); // show new temporary loading or just keep one
                try {
                    file = await compressImage(file, 1); // Compress to 1MB
                } catch (compressionError) {
                    console.error('Compression failed, trying original file', compressionError);
                }
            }

            const formData = new FormData();
            formData.append('amount', values.amount.toString());
            formData.append('paymentSlip', file);

            // Show uploading message
            message.destroy(); // Clear all messages
            message.loading('Uploading payment slip...', 0);

            await uploadMutation.mutateAsync({
                requestId: selectedRequest.id,
                formData
            });

            message.destroy();
            message.success('Payment slip uploaded successfully!');
            setUploadModalVisible(false);
            form.resetFields();

            // Refetch lists to update UI
            refetchPicked();
            refetchCreated();
        } catch (error) {
            message.destroy();
            console.error('Failed to upload slip:', error);
        }
    };

    const handleVerifyPayment = async (approved: boolean) => {
        if (!selectedRequest) return;

        await verifyMutation.mutateAsync({
            requestId: selectedRequest.id,
            data: { approved }
        });
        setVerifyModalVisible(false);
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            message.error('Please provide a rejection reason');
            return;
        }

        await verifyMutation.mutateAsync({
            requestId: selectedRequest.id,
            data: {
                approved: false,
                rejectionReason: rejectionReason.trim()
            }
        });
        setRejectModalVisible(false);
        setVerifyModalVisible(false);
        setRejectionReason('');
    };

    const handleVerifyClick = async (record: Request) => {
        setSelectedRequest(record);
        setVerifyModalVisible(true);
    };

    const handleReportFailureClick = (record: Request) => {
        setSelectedRequest(record);
        setFailureModalVisible(true);
    };

    const handleReportFailure = async () => {
        if (!selectedRequest || !failureReason.trim()) {
            message.error('Please provide a reason for payment failure');
            return;
        }

        await reportFailureMutation.mutateAsync({
            requestId: selectedRequest.id,
            reason: failureReason
        });
        setFailureModalVisible(false);
        setFailureReason('');
        setSelectedRequest(null);
    };

    const handleRevertClick = (record: Request) => {
        setSelectedRequest(record);
        // Pre-fill form with existing details if you want, but the modal form will do it via initialValues or useEffect
        form.setFieldsValue({
            bankDetails: record.bankDetails,
            upiId: record.upiId,
            comment: ''
        });
        setRevertModalVisible(true);
    };

    const handleRevert = async (values: any) => {
        if (!selectedRequest) return;

        await revertRequestMutation.mutateAsync({
            requestId: selectedRequest.id,
            data: {
                bankDetails: values.bankDetails,
                upiId: values.upiId,
                comment: values.comment
            }
        });
        setRevertModalVisible(false);
        setSelectedRequest(null);
        form.resetFields();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Copied to clipboard!');
    };

    const copyAllBankDetails = () => {
        if (!selectedRequest) return;

        let formattedText = '';

        if (selectedRequest.bankDetails) {
            formattedText = `Amount: ₹${selectedRequest.amount}\nAccount Number: ${selectedRequest.bankDetails.accountNumber}\nIFSC Code: ${selectedRequest.bankDetails.ifscCode}\nBank Name: ${selectedRequest.bankDetails.bankName}\nAccount Holder Name: ${selectedRequest.bankDetails.accountHolderName}`;
        } else if (selectedRequest.upiId) {
            formattedText = `Amount: ₹${selectedRequest.amount}\nUPI ID: ${selectedRequest.upiId}`;
        }

        navigator.clipboard.writeText(formattedText);
        message.success('All details copied to clipboard!');
    };

    const handleCancelRequestClick = (record: Request) => {
        setSelectedRequestForCancel(record);
        setCancelReason('');
        setCancelModalVisible(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedRequestForCancel) return;

        if (!cancelReason.trim()) {
            message.error('Please provide a reason for cancellation');
            return;
        }

        await deleteRequestMutation.mutateAsync({
            requestId: selectedRequestForCancel.id,
            reason: cancelReason
        });

        setCancelModalVisible(false);
        setSelectedRequestForCancel(null);
        setCancelReason('');
    };

    const createdColumns: ColumnsType<Request> = [
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="text-sm font-medium text-gray-900">
                    {dayjs(date).format('DD MMM YYYY, hh:mm A')}
                </span>
            ),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type</span>,
            dataIndex: 'type',
            key: 'type',
            render: (type: RequestType) => getTypeBadge(type),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</span>,
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number, record: Request) => (
                <div className="flex flex-col">
                    <span className="text-base font-bold text-gray-900">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    {record.status === RequestStatus.PAID_PARTIAL && (
                        <span className="text-xs text-slate-500 font-medium mt-0.5">
                            Paid: ₹{record.paidAmount.toLocaleString('en-IN')} | Pending: ₹{record.pendingAmount.toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
            ),
            width: 180,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>,
            dataIndex: 'status',
            key: 'status',
            render: (status: RequestStatus) => getStatusBadge(status),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments</span>,
            key: 'comments',
            render: (_, record: Request) => {
                if (record.status === RequestStatus.REJECTED && record.rejectionReason) {
                    return (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2">
                            <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-red-700 font-medium">{record.rejectionReason}</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.PAID_PARTIAL) {
                    return (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-blue-700 font-medium">Partial payment received</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.PAID_FULL) {
                    return (
                        <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-green-700 font-medium">Payment slip uploaded, pending verification</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.COMPLETED) {
                    return (
                        <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-green-700 font-medium">Payment verified and completed</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.PAYMENT_FAILED && record.paymentFailureReason) {
                    return (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2">
                            <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-red-700">Payment Failed</span>
                                <span className="text-xs text-red-600">{record.paymentFailureReason}</span>
                            </div>
                        </div>
                    );
                }
                return <span className="text-xs text-gray-400">-</span>;
            },
            width: 250,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</span>,
            key: 'actions',
            render: (_, record: Request) => {
                const canVerify = record.status === RequestStatus.PAID_FULL || record.status === RequestStatus.PAID_PARTIAL;
                const canRevert = record.status === RequestStatus.PAYMENT_FAILED;
                const canDelete = record.status === RequestStatus.PENDING && record.type === RequestType.WITHDRAWAL;

                if (!canVerify && !canRevert && !canDelete) return <span className="text-xs text-slate-500 font-medium p-2">NA</span>;

                const items = [];

                if (canVerify) {
                    items.push({
                        key: 'verify',
                        label: 'Verify Payment',
                        icon: <Check size={16} />,
                        onClick: () => handleVerifyClick(record)
                    });
                }

                if (canRevert) {
                    items.push({
                        key: 'revert',
                        label: 'Edit & Revert',
                        icon: <RotateCcw size={16} />,
                        onClick: () => handleRevertClick(record)
                    });
                }

                if (canDelete) {
                    items.push({
                        key: 'delete',
                        label: <span className="text-red-600">Cancel Request</span>,
                        icon: <Trash2 size={16} className="text-red-500" />,
                        danger: true,
                        onClick: () => handleCancelRequestClick(record)
                    });
                }

                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <Button
                            type="text"
                            icon={<MoreVertical className="text-gray-400 text-lg" />}
                            className="hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center"
                        />
                    </Dropdown>
                );
            },
            width: 120,
        },
    ];

    const getStatusBadge = (status: RequestStatus) => {
        const config: Record<RequestStatus, { color: string; bg: string }> = {
            [RequestStatus.PENDING]: { color: 'text-blue-700', bg: 'bg-blue-50' },
            [RequestStatus.PICKED]: { color: 'text-orange-700', bg: 'bg-orange-50' },
            [RequestStatus.PAID_FULL]: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
            [RequestStatus.PAID_PARTIAL]: { color: 'text-purple-700', bg: 'bg-purple-50' },
            [RequestStatus.COMPLETED]: { color: 'text-green-700', bg: 'bg-green-50' },
            [RequestStatus.REJECTED]: { color: 'text-red-700', bg: 'bg-red-50' },
            [RequestStatus.PAYMENT_FAILED]: { color: 'text-red-700', bg: 'bg-red-100' },
        };
        const style = config[status] || { color: 'text-gray-700', bg: 'bg-gray-50' };

        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-transparent ${style.bg} ${style.color}`}>
                {status}
            </div>
        );
    };

    const getTypeBadge = (type: RequestType) => {
        const isDeposit = type === RequestType.DEPOSIT;
        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isDeposit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                {type}
            </div>
        );
    };

    const pickedColumns: ColumnsType<Request> = [
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</span>,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="text-sm font-medium text-gray-900">
                    {dayjs(date).format('DD MMM YYYY, hh:mm A')}
                </span>
            ),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type</span>,
            dataIndex: 'type',
            key: 'type',
            render: (type: RequestType) => {
                const displayType = type === RequestType.WITHDRAWAL ? RequestType.DEPOSIT : RequestType.WITHDRAWAL;
                return getTypeBadge(displayType);
            },
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</span>,
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number, record: Request) => (
                <div className="flex flex-col">
                    <span className="text-base font-bold text-gray-900">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    {record.status === RequestStatus.PAID_PARTIAL && (
                        <span className="text-xs text-slate-500 font-medium mt-0.5">
                            Paid: ₹{record.paidAmount.toLocaleString('en-IN')} | Pending: ₹{record.pendingAmount.toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
            ),
            width: 180,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Details</span>,
            key: 'paymentDetails',
            render: (_, record: Request) => {
                if (record.status !== RequestStatus.PICKED && record.status !== RequestStatus.PAID_PARTIAL) return <span className="text-gray-400">-</span>;

                if (record.bankDetails) {
                    return (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                    A/C: {record.bankDetails.accountNumber}
                                </span>
                                <Eye
                                    className="text-indigo-600 cursor-pointer hover:text-indigo-800"
                                    onClick={() => {
                                        setSelectedRequest(record);
                                        setBankDetailsModalVisible(true);
                                    }}
                                />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{record.bankDetails.bankName}</span>
                        </div>
                    );
                }

                if (record.upiId) {
                    return (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                    UPI: {record.upiId}
                                </span>
                                <Copy
                                    size={16}
                                    className="text-indigo-600 cursor-pointer hover:text-indigo-800"
                                    onClick={() => copyToClipboard(record.upiId!)}
                                />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">UPI Payment</span>
                        </div>
                    );
                }

                if (record.qrCode) {
                    return (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                    QR Code Available
                                </span>
                                <Eye
                                    className="text-indigo-600 cursor-pointer hover:text-indigo-800"
                                    onClick={() => {
                                        setSelectedRequest(record);
                                        setBankDetailsModalVisible(true);
                                    }}
                                />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">Scan to Pay</span>
                        </div>
                    );
                }

                return <span className="text-gray-400">-</span>;
            },
            width: 250,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>,
            dataIndex: 'status',
            key: 'status',
            render: (status: RequestStatus) => getStatusBadge(status),
            width: 150,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments</span>,
            key: 'comments',
            render: (_, record: Request) => {
                if (record.status === RequestStatus.REJECTED && record.rejectionReason) {
                    return (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2">
                            <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-red-700">Payment Rejected</span>
                                <span className="text-xs text-red-600">{record.rejectionReason}</span>
                            </div>
                        </div>
                    );
                }
                if (record.status === RequestStatus.PAID_PARTIAL) {
                    return (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-blue-700 font-medium">Partial payment uploaded, awaiting verification</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.PAID_FULL) {
                    return (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-blue-700 font-medium">Payment slip uploaded, awaiting verification</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.COMPLETED) {
                    return (
                        <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-green-700 font-medium">Payment verified successfully</span>
                        </div>
                    );
                }
                if (record.status === RequestStatus.PICKED) {
                    return (
                        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-lg p-2">
                            <CheckCircle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-yellow-700 font-medium">Awaiting payment slip upload</span>
                        </div>
                    );
                }
                return <span className="text-xs text-gray-400">-</span>;
            },
            width: 280,
        },
        {
            title: <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</span>,
            key: 'actions',
            render: (_, record: Request) => (
                <Space>
                    {(record.status === RequestStatus.PICKED || record.status === RequestStatus.PAID_PARTIAL) && (
                        <>
                            <Button
                                type="primary"
                                icon={<UploadIcon size={18} />}
                                onClick={() => {
                                    setSelectedRequest(record);
                                    setUploadModalVisible(true);
                                }}
                                className="bg-[#5B63E6] hover:bg-[#4c54d6] border-none shadow-sm rounded-lg font-medium px-4 h-9"
                            >
                                Upload Slip
                            </Button>
                            <Dropdown
                                menu={{
                                    items: [
                                        // Show "View Slip" if payment slip exists
                                        ...(record.paymentSlips && record.paymentSlips.length > 0 ? [{
                                            key: 'view-slip',
                                            label: <span className="text-indigo-600 font-medium">View Payment Slip</span>,
                                            icon: <Eye size={16} className="text-indigo-600" />,
                                            onClick: () => handleViewSlip(record),
                                        }] : []),
                                        {
                                            key: 'report-failure',
                                            label: <span className="text-red-500 font-medium">Report Payment Failure</span>,
                                            icon: <AlertTriangle size={16} className="text-red-500" />,
                                            onClick: () => handleReportFailureClick(record),
                                        }
                                    ]
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                            >
                                <Button
                                    type="text"
                                    icon={<MoreVertical size={20} className="text-gray-400" />}
                                    className="hover:bg-slate-100 rounded-full w-9 h-9 flex items-center justify-center"
                                />
                            </Dropdown>
                        </>
                    )}

                    {/* For PAID_FULL and COMPLETED status, show view slip option if slip exists */}
                    {(record.status === RequestStatus.PAID_FULL || record.status === RequestStatus.COMPLETED) &&
                        record.paymentSlips && record.paymentSlips.length > 0 && (
                            <Button
                                type="default"
                                icon={<Eye size={18} />}
                                onClick={() => handleViewSlip(record)}
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm rounded-lg font-medium px-4 h-9"
                            >
                                View Slip
                            </Button>
                        )}
                </Space>
            ),
            width: 180,
        },
    ];

    return (
        <div >
            {/* Header */}
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                            {location.pathname.includes('picked-requests') ? 'Picked Requests' : 'Created Requests'}
                        </h1>
                        <p className="text-slate-600">
                            {location.pathname.includes('picked-requests')
                                ? 'Manage requests you have picked to fulfill'
                                : 'Manage requests you have created'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <Select
                            placeholder="Filter by Status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-40"
                            allowClear
                        >
                            <Select.Option value={RequestStatus.PENDING}>Pending</Select.Option>
                            <Select.Option value={RequestStatus.PICKED}>Picked</Select.Option>
                            <Select.Option value={RequestStatus.PAID_FULL}>Paid Full</Select.Option>
                            <Select.Option value={RequestStatus.PAID_PARTIAL}>Paid Partial</Select.Option>
                            <Select.Option value={RequestStatus.COMPLETED}>Completed</Select.Option>
                            <Select.Option value={RequestStatus.REJECTED}>Rejected</Select.Option>
                            <Select.Option value={RequestStatus.PAYMENT_FAILED}>Payment Failed</Select.Option>
                        </Select>

                        <DatePicker.RangePicker
                            onChange={(dates) => {
                                if (dates && dates[0] && dates[1]) {
                                    setDateRange([
                                        dates[0].startOf('day').toISOString(),
                                        dates[1].endOf('day').toISOString()
                                    ]);
                                } else {
                                    setDateRange(undefined);
                                }
                            }}
                            className="w-60"
                        />

                        {!location.pathname.includes('picked-requests') && (
                            <Button
                                type="primary"
                                icon={<UploadIcon size={18} />}
                                onClick={() => navigate('/vendor/create-request')}
                                className="bg-indigo-600 hover:bg-indigo-700 h-10 px-4 rounded-lg font-semibold shadow-sm border-none flex items-center gap-2"
                            >
                                Create Request
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content based on URL */}
            {location.pathname.includes('picked-requests') ? (
                <Table
                    columns={pickedColumns}
                    dataSource={pickedRequests}
                    rowKey="id"
                    loading={pickedLoading}
                    onChange={handlePickedTableChange}
                    pagination={{
                        current: pickedMeta.page,
                        pageSize: pickedMeta.limit,
                        total: pickedMeta.total,
                        showTotal: (total) => `Total ${total} requests`,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    className="bg-white rounded-lg border border-slate-200"
                    scroll={{ x: 'max-content' }}
                />
            ) : (
                <Table
                    columns={createdColumns}
                    dataSource={createdRequests}
                    rowKey="id"
                    loading={createdLoading}
                    onChange={handleCreatedTableChange}
                    pagination={{
                        current: createdMeta.page,
                        pageSize: createdMeta.limit,
                        total: createdMeta.total,
                        showTotal: (total) => `Total ${total} requests`,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    className="bg-white rounded-lg border border-slate-200"
                    scroll={{ x: 'max-content' }}
                />
            )}

            {/* Upload Payment Slip Modal */}
            <Modal
                title={<span className="text-lg font-bold text-gray-800">Upload Payment Slip</span>}
                open={uploadModalVisible}
                onCancel={() => {
                    setUploadModalVisible(false);
                    form.resetFields();
                    setPreviewImage(null);
                }}
                footer={null}
                width="min(480px, 95vw)"
                styles={{ content: { borderRadius: '20px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
                centered
            >
                <div className="mt-6">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUploadSlip}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="amount"
                            label={<span className="font-medium text-gray-700">Amount Paid</span>}
                            initialValue={selectedRequest?.pendingAmount || selectedRequest?.amount || 0}
                            className="mb-6"
                        >
                            <Input
                                className="!w-full h-11 py-1 rounded-lg border-gray-200 bg-gray-50 text-gray-500 font-semibold"
                                prefix={<span className="text-gray-400 mr-2">₹</span>}
                                readOnly
                                value={(selectedRequest?.pendingAmount || selectedRequest?.amount || 0).toLocaleString()}
                            />
                        </Form.Item>

                        <Form.Item
                            name="paymentSlip"
                            label={<span className="font-medium text-gray-700"><span className="text-red-500 mr-1">*</span>Payment Slip</span>}
                            rules={[{ required: true, message: 'Please upload payment slip!' }]}
                            className="mb-8"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                    return e;
                                }
                                return e?.fileList;
                            }}
                        >
                            <Upload.Dragger
                                beforeUpload={() => false}
                                maxCount={1}
                                multiple={false}
                                className="bg-slate-50 border-dashed border-2 border-indigo-100 rounded-xl hover:border-indigo-400 transition-colors !w-full contents"
                                onChange={(info) => {
                                    // If file list is empty (file was removed), clear preview
                                    if (info.fileList.length === 0) {
                                        setPreviewImage(null);
                                        return;
                                    }

                                    const file = info.file.originFileObj || info.file;
                                    if (file && (file as File).type?.startsWith('image/')) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            setPreviewImage(e.target?.result as string);
                                        };
                                        reader.readAsDataURL(file as File);
                                    } else {
                                        setPreviewImage(null);
                                    }
                                }}
                                onRemove={() => {
                                    setPreviewImage(null);
                                }}
                            >
                                <div className="p-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500">
                                        <UploadIcon className="text-lg" />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-bold text-indigo-600">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        PNG, JPG or PDF (Max. 5MB)
                                    </p>
                                </div>
                            </Upload.Dragger>
                        </Form.Item>

                        {/* Image Preview */}
                        {previewImage && (
                            <div className="mb-6 -mt-2">
                                <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                    <Image
                                        src={previewImage}
                                        alt="Payment slip preview"
                                        className="w-full"
                                        style={{ maxHeight: '150px', objectFit: 'contain' }}
                                        preview={{
                                            mask: <div className="text-xs">Click to enlarge</div>
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                onClick={() => setUploadModalVisible(false)}
                                disabled={uploadMutation.isPending}
                                className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600 font-medium hover:text-gray-800 hover:border-gray-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={uploadMutation.isPending}
                                disabled={uploadMutation.isPending}
                                className="flex-1 h-11 rounded-xl bg-[#5B63E6] hover:bg-[#4c54d6] border-none font-medium text-white shadow-lg shadow-indigo-100"
                            >
                                Upload
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal>

            {/* Cancel Request Modal */}
            <Modal
                title={<span className="text-lg font-bold text-gray-800">Cancel Request</span>}
                open={cancelModalVisible}
                onCancel={() => {
                    setCancelModalVisible(false);
                    setCancelReason('');
                    setSelectedRequestForCancel(null);
                }}
                width="min(500px, 95vw)"
                centered
                footer={
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            onClick={() => {
                                setCancelModalVisible(false);
                                setCancelReason('');
                                setSelectedRequestForCancel(null);
                            }}
                            className="rounded-lg font-medium"
                        >
                            Back
                        </Button>
                        <Button
                            danger
                            type="primary"
                            onClick={handleConfirmCancel}
                            loading={deleteRequestMutation.isPending}
                            className="rounded-lg font-medium bg-red-500 hover:bg-red-600 border-none"
                        >
                            Confirm Cancellation
                        </Button>
                    </div>
                }
                styles={{ content: { borderRadius: '16px', padding: '24px' } }}
            >
                <div className="mt-4">
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg mb-4 border border-red-100">
                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-700 m-0">
                            Are you sure you want to cancel this request? This action cannot be undone.
                        </p>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Cancellation <span className="text-red-500">*</span>
                    </label>
                    <Input.TextArea
                        rows={4}
                        placeholder="Please modify the amount..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="rounded-lg border-gray-300 resize-none hover:border-indigo-400 focus:border-indigo-500"
                    />
                </div>
            </Modal>

            {/* Verify Payment Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <CheckCircle className="!text-[#5B63E6] text-xl" />
                        <span className="text-xl font-bold text-gray-900">Verify Payment</span>
                    </div>
                }
                open={verifyModalVisible}
                onCancel={() => setVerifyModalVisible(false)}
                footer={() => {
                    return (
                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <Button
                                type="primary"
                                icon={<Check size={18} />}
                                onClick={() => handleVerifyPayment(true)}
                                loading={verifyMutation.isPending}
                                disabled={verifyMutation.isPending}
                                className="flex-1 h-12 bg-[#5B63E6] hover:bg-[#4c54d6] border-none shadow-lg shadow-indigo-100 rounded-xl font-bold text-base"
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                icon={<XCircle size={18} />}
                                onClick={() => setRejectModalVisible(true)}
                                loading={verifyMutation.isPending}
                                className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-base bg-white"
                            >
                                Reject
                            </Button>
                        </div>
                    )
                }}
                centered
                width={550}
                bodyProps={{
                    className: '!h-[600px] overflow-y-auto'
                }}
                styles={{ content: { borderRadius: '24px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
            >
                {verifyMutation.isPending || (isDetailsLoading && !detailedRequest) ? (
                    <div className="flex justify-center items-center py-20">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="mt-6 flex flex-col gap-6">
                        {/* Payment Summary */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#5B63E6]"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">PAYMENT SUMMARY</span>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="grid grid-cols-2 gap-y-6">
                                    {/* Request Type */}
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">REQUEST TYPE</div>
                                        {(detailedRequest || selectedRequest)?.type && getTypeBadge((detailedRequest || selectedRequest)!.type)}
                                    </div>

                                    {/* User Name (Picker) */}
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">USER NAME</div>
                                        <span className="text-base font-bold text-gray-900">{(detailedRequest || selectedRequest)?.pickedBy?.name || 'Unknown User'}</span>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="col-span-2">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PAYMENT METHOD</div>
                                        <div className="flex items-center gap-2">
                                            {/* We infer method from request data */}
                                            {(detailedRequest || selectedRequest)?.upiId ? (
                                                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    UPI Payment
                                                </span>
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    Bank Transfer
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Amount Paid */}
                        <div className="border border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-6 text-center">
                            <div className="text-xs font-bold text-[#5B63E6] uppercase tracking-wider mb-2">AMOUNT PAID</div>
                            <div className="text-4xl font-bold text-[#5B63E6]">
                                ₹{(detailedRequest || selectedRequest)?.paidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            {(detailedRequest || selectedRequest)?.status === RequestStatus.PAID_PARTIAL && (
                                <div className="text-xs font-medium text-orange-500 mt-2 bg-orange-50 inline-block px-3 py-1 rounded-full">
                                    Pending: ₹{(detailedRequest || selectedRequest)?.pendingAmount?.toLocaleString('en-IN')}
                                </div>
                            )}
                        </div>

                        {/* Payment Slip Proof */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">PAYMENT SLIP PROOF</div>
                            </div>

                            {(detailedRequest || selectedRequest)?.paymentSlips && (detailedRequest || selectedRequest)?.paymentSlips?.length ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {(detailedRequest || selectedRequest)?.paymentSlips?.map((slip: any) => {
                                        return (
                                            <div key={slip.id} className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                                <Image
                                                    src={slip.fileUrl}
                                                    alt="Payment Slip"
                                                    className="object-cover w-full h-48"
                                                    fallback="https://placehold.co/400x300?text=No+Image"
                                                />
                                                <div className="p-3 bg-white border-t border-slate-50 flex justify-between items-center">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        Amount: ₹{slip.amount.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs font-slate-400">
                                                        {new Date(slip.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="h-32 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
                                    No payment slip uploaded
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </Modal>

            {/* Bank Details Modal */}
            <Modal
                title={<span className="text-xl font-bold text-gray-900">Bank Account Details</span>}
                open={bankDetailsModalVisible}
                onCancel={() => setBankDetailsModalVisible(false)}
                footer={null}
                width={480}
                centered
                styles={{ content: { borderRadius: '16px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
            >
                {(selectedRequest?.bankDetails || selectedRequest?.upiId || selectedRequest?.qrCode) && (
                    <div className="mt-6 flex flex-col gap-4">
                        {selectedRequest.bankDetails && (
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Number</div>
                                        <span className="text-base font-bold text-gray-900">{selectedRequest.bankDetails.accountNumber}</span>
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">IFSC Code</div>
                                        <span className="text-base font-bold text-gray-900">{selectedRequest.bankDetails.ifscCode}</span>
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bank Name</div>
                                        <span className="text-base font-bold text-gray-900">{selectedRequest.bankDetails.bankName}</span>
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Holder Name</div>
                                        <span className="text-base font-bold text-gray-900">{selectedRequest.bankDetails.accountHolderName}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedRequest.upiId && (
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">UPI ID</div>
                                <span className="text-base font-bold text-gray-900">{selectedRequest.upiId}</span>
                            </div>
                        )}

                        {selectedRequest.qrCode && (
                            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <QrCode size={16} className="text-teal-600" />
                                    Scan QR to Pay
                                </h3>
                                <div className="flex justify-center bg-white p-3 rounded-xl border border-slate-200 mb-3">
                                    <Image
                                        src={selectedRequest.qrCode}
                                        alt="Payment QR Code"
                                        className="max-w-full max-h-48 object-contain rounded-lg"
                                    />
                                </div>
                                <a
                                    href={selectedRequest.qrCode}
                                    download="payment-qr-code.png"
                                    className="block w-full"
                                >
                                    <Button
                                        block
                                        className="h-9 rounded-lg border-teal-200 text-teal-700 font-semibold hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800"
                                    >
                                        Download QR Code
                                    </Button>
                                </a>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            {selectedRequest && (selectedRequest.bankDetails || selectedRequest.upiId) && (
                                <Button
                                    type="primary"
                                    icon={<Copy size={18} />}
                                    onClick={copyAllBankDetails}
                                    className="flex-1 h-11 bg-[#5B63E6] hover:bg-[#4c54d6] border-none shadow-lg shadow-indigo-100 rounded-xl font-bold"
                                >
                                    Copy All Details
                                </Button>
                            )}
                            <Button
                                onClick={() => setBankDetailsModalVisible(false)}
                                className="px-6 h-11 rounded-xl border-gray-200 text-gray-600 font-medium hover:text-gray-800 hover:border-gray-300"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Rejection Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <XCircle className="!text-red-500 text-xl" />
                        <span className="text-xl font-bold text-gray-900">Reject Payment</span>
                    </div>
                }
                open={rejectModalVisible}
                onCancel={() => {
                    setRejectModalVisible(false);
                    setRejectionReason('');
                }}
                footer={null}
                centered
                width={500}
                styles={{ content: { borderRadius: '24px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
            >
                <div className="mt-6 flex flex-col gap-6">
                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-sm text-red-600">
                            Please provide a clear reason for rejecting this payment. The vendor will be notified with your reason.
                        </p>
                    </div>

                    {/* Rejection Reason Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <Input.TextArea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter the reason for rejection..."
                            rows={4}
                            maxLength={500}
                            showCount
                            className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => {
                                setRejectModalVisible(false);
                                setRejectionReason('');
                            }}
                            disabled={verifyMutation.isPending}
                            className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600 font-medium hover:text-gray-800 hover:border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            danger
                            type="primary"
                            icon={<XCircle size={18} />}
                            onClick={handleReject}
                            loading={verifyMutation.isPending}
                            disabled={verifyMutation.isPending || !rejectionReason.trim()}
                            className="flex-1 h-11 rounded-xl font-bold"
                        >
                            Reject Payment
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Report Payment Failure Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="!text-red-500 text-xl" />
                        <span className="text-xl font-bold text-gray-900">Report Payment Failure</span>
                    </div>
                }
                open={failureModalVisible}
                onCancel={() => {
                    setFailureModalVisible(false);
                    setFailureReason('');
                }}
                footer={null}
                centered
                width={480}
                styles={{ content: { borderRadius: '24px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
            >
                <div className="mt-6">
                    <p className="text-gray-600 mb-4">
                        Please provide a reason why the payment could not be completed. The vendor will be notified and can revert the request to edit details.
                    </p>
                    <Input.TextArea
                        placeholder="e.g., Bank server down, Invalid account number, etc."
                        rows={4}
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        className="mb-6 rounded-xl border-slate-200 focus:border-red-500 focus:ring-0"
                    />
                    <div className="flex gap-4 mt-4">
                        <Button
                            onClick={() => setFailureModalVisible(false)}
                            className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600 font-medium hover:text-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            danger
                            type="primary"
                            onClick={handleReportFailure}
                            loading={reportFailureMutation.isPending}
                            disabled={!failureReason.trim()}
                            className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 border-none font-medium text-white shadow-lg shadow-red-100"
                        >
                            Report Failure
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <RotateCcw className="!text-[#5B63E6] text-xl" />
                        <span className="text-xl font-bold text-gray-900">Edit & Revert Request</span>
                    </div>
                }
                open={revertModalVisible}
                onCancel={() => {
                    setRevertModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                centered
                width={550}
                styles={{ content: { borderRadius: '24px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
            >
                <div className="mt-6">
                    <p className="text-gray-600 mb-6">
                        Update your payment details if needed and add a comment. The request will be moved back to Pending status.
                    </p>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleRevert}
                        initialValues={{
                            bankDetails: selectedRequest?.bankDetails,
                            upiId: selectedRequest?.upiId,
                        }}
                    >
                        {selectedRequest?.type === RequestType.DEPOSIT ? (
                            // For Deposit (Admin paying User), User provides bank details. 
                            // Wait, logic check:
                            // If TYPE is DEPOSIT, Creator is Vendor? No.
                            // RequestType.DEPOSIT means User wants to Deposit? Or Admin deposits to User?
                            // Usually "Deposit" in this system context seems to be "Vendor Requesting Deposit" (Vendor giving money to Admin?) or "Vendor Requesting Withdrawal" (Admin giving money to Vendor).
                            // Let's check `CreateRequest.tsx` to see what fields are available for what type.
                            // Actually `selectedRequest` has `bankDetails` or `upiId`.
                            // If it has `bankDetails`, show bank form. If `upiId`, show UPI form.
                            // Or just show fields based on what is present or allow switching?
                            // Since we are "Editing", we should probably allow editing what was there.
                            // Let's assume structure based on data presence.
                            <>
                                {selectedRequest?.bankDetails && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item
                                                name={['bankDetails', 'accountNumber']}
                                                label="Account Number"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                            <Form.Item
                                                name={['bankDetails', 'ifscCode']}
                                                label="IFSC Code"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item
                                                name={['bankDetails', 'bankName']}
                                                label="Bank Name"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                            <Form.Item
                                                name={['bankDetails', 'accountHolderName']}
                                                label="Account Holder Name"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                        </div>
                                    </>
                                )}
                                {selectedRequest?.upiId && (
                                    <Form.Item
                                        name="upiId"
                                        label="UPI ID"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input className="h-10 rounded-lg" />
                                    </Form.Item>
                                )}
                            </>
                        ) : (
                            // Withdrawal - same logic really, just showing bank details if present.
                            // Simplification: Just show fields if initial values exist.
                            <>
                                {selectedRequest?.bankDetails && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item
                                                name={['bankDetails', 'accountNumber']}
                                                label="Account Number"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                            <Form.Item
                                                name={['bankDetails', 'ifscCode']}
                                                label="IFSC Code"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item
                                                name={['bankDetails', 'bankName']}
                                                label="Bank Name"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                            <Form.Item
                                                name={['bankDetails', 'accountHolderName']}
                                                label="Account Holder Name"
                                                rules={[{ required: true, message: 'Required' }]}
                                            >
                                                <Input className="h-10 rounded-lg" />
                                            </Form.Item>
                                        </div>
                                    </>
                                )}
                                {selectedRequest?.upiId && (
                                    <Form.Item
                                        name="upiId"
                                        label="UPI ID"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input className="h-10 rounded-lg" />
                                    </Form.Item>
                                )}
                            </>
                        )}

                        <Form.Item
                            name="comment"
                            label="Comment (Optional)"
                        >
                            <Input.TextArea
                                rows={3}
                                className="rounded-xl"
                                placeholder="Add a note about what you changed..."
                            />
                        </Form.Item>

                        <div className="flex gap-4 pt-4">
                            <Button
                                onClick={() => setRevertModalVisible(false)}
                                className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600 font-medium hover:text-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={revertRequestMutation.isPending}
                                className="flex-1 h-11 rounded-xl bg-[#5B63E6] hover:bg-[#4c54d6] border-none font-medium text-white shadow-lg shadow-indigo-100"
                            >
                                Revert Request
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal>

            {/* View Payment Slip Modal */}
            <Modal
                title={<span className="text-lg font-bold text-gray-800">Payment Slip</span>}
                open={viewSlipModalVisible}
                onCancel={() => {
                    setViewSlipModalVisible(false);
                    setSelectedSlipToView(null);
                    setSlipLoading(false);
                }}
                footer={null}
                width="min(600px, 95vw)"
                styles={{ content: { borderRadius: '20px', padding: '24px' } }}
                closeIcon={<X className="text-gray-400 text-lg" />}
                centered
            >
                {slipLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Spin size="large" tip="Loading payment slip..." />
                    </div>
                ) : selectedSlipToView ? (
                    <div className="mt-4">
                        <Image
                            src={selectedSlipToView}
                            alt="Payment slip"
                            className="w-full rounded-xl"
                            style={{ maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};
