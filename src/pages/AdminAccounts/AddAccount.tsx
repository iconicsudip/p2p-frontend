import { Button, Card, Form, Input, message, Upload } from 'antd';
import { ArrowLeft, Building2, CreditCard, Image as ImageIcon, Save, Upload as UploadIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBankDetails, useUpdateAdminBankDetails } from '../../hooks/useRequests';
import { compressImage } from '../../utils/imageUtils';

import { v4 as uuidv4 } from 'uuid';

export const AddAccount: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { data: adminDetails } = useAdminBankDetails();
    const updateMutation = useUpdateAdminBankDetails();
    const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
    const [accountType, setAccountType] = useState<'BANK_ACCOUNT' | 'UPI' | 'QR_CODE'>('BANK_ACCOUNT');

    const handleQrCodeUpload = async (file: File) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
            return Upload.LIST_IGNORE;
        }

        try {
            message.loading({ content: 'Compressing image...', key: 'compression' });
            const compressedFile = await compressImage(file, 1); // Compress to 1MB

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setQrCodePreview(result);
                form.setFieldValue('qrCode', result);
                message.success({ content: 'Image ready', key: 'compression' });
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Compression error:', error);
            message.error({ content: 'Failed to process image', key: 'compression' });
        }

        return false; // Prevent auto upload
    };

    const onFinish = async (values: any) => {
        try {
            const newAccount: any = {
                id: uuidv4(),
                isActive: true, // Default active
                type: accountType,
            };

            if (accountType === 'BANK_ACCOUNT') {
                newAccount.accountNumber = values.accountNumber;
                newAccount.ifscCode = values.ifscCode.toUpperCase();
                newAccount.bankName = values.bankName;
                newAccount.accountHolderName = values.accountHolderName;
            } else if (accountType === 'UPI') {
                newAccount.upiId = values.upiId;
            } else if (accountType === 'QR_CODE') {
                newAccount.qrCode = qrCodePreview || undefined;
            }
            // For backward compatibility or flexible display, we might want to store a display name or label
            // But for now, we stick to the schema.

            const existingAccounts = Array.isArray(adminDetails?.bankDetails)
                ? adminDetails.bankDetails
                : (adminDetails?.bankDetails ? [{ ...adminDetails.bankDetails, id: 'default', isActive: true, type: 'BANK_ACCOUNT' }] : []);

            const updatedAccounts = [...existingAccounts, newAccount];

            await updateMutation.mutateAsync({
                bankDetails: updatedAccounts,
                upiId: adminDetails?.upiId, // Keep global for backward compatibility for now
                qrCode: adminDetails?.qrCode,
                maxWithdrawalLimit: adminDetails?.maxWithdrawalLimit,
            });

            message.success('Account added successfully');
            navigate('/admin/accounts/list');
        } catch (error) {
            message.error('Failed to add account');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate('/admin/accounts/list')}
                    type="text"
                />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Add Account</h1>
                    <p className="text-slate-500">Enter details for the new account</p>
                </div>
            </div>

            <Card className="shadow-sm border-slate-100 rounded-xl mb-6">
                <div className="flex flex-col gap-4">
                    <span className="font-semibold text-slate-700">Select Account Type</span>
                    <div className="flex gap-4">
                        <Button
                            type={accountType === 'BANK_ACCOUNT' ? 'primary' : 'default'}
                            onClick={() => setAccountType('BANK_ACCOUNT')}
                            icon={<Building2 size={18} />}
                            className={accountType === 'BANK_ACCOUNT' ? 'bg-indigo-600' : ''}
                        >
                            Bank Account
                        </Button>
                        <Button
                            type={accountType === 'UPI' ? 'primary' : 'default'}
                            onClick={() => setAccountType('UPI')}
                            icon={<CreditCard size={18} />}
                            className={accountType === 'UPI' ? 'bg-purple-600' : ''}
                        >
                            UPI ID
                        </Button>
                        <Button
                            type={accountType === 'QR_CODE' ? 'primary' : 'default'}
                            onClick={() => setAccountType('QR_CODE')}
                            icon={<ImageIcon size={18} />}
                            className={accountType === 'QR_CODE' ? 'bg-teal-600' : ''}
                        >
                            QR Code
                        </Button>
                    </div>
                </div>
            </Card>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className="space-y-6"
            >
                {accountType === 'BANK_ACCOUNT' && (
                    <Card className="shadow-sm border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Account Details</h2>
                                <p className="text-sm text-slate-500">Bank account information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                label="Account Holder Name"
                                name="accountHolderName"
                                rules={[{ required: true, message: 'Please enter account holder name' }]}
                            >
                                <Input size="large" className="rounded-xl" placeholder="e.g. John Doe" />
                            </Form.Item>

                            <Form.Item
                                label="Bank Name"
                                name="bankName"
                                rules={[{ required: true, message: 'Please enter bank name' }]}
                            >
                                <Input size="large" className="rounded-xl" placeholder="e.g. HDFC Bank" />
                            </Form.Item>

                            <Form.Item
                                label="Account Number"
                                name="accountNumber"
                                rules={[{ required: true, message: 'Please enter account number' }]}
                            >
                                <Input size="large" className="rounded-xl" placeholder="Enter account number" />
                            </Form.Item>

                            <Form.Item
                                label="IFSC Code"
                                name="ifscCode"
                                rules={[{ required: true, message: 'Please enter IFSC code' }]}
                            >
                                <Input
                                    size="large"
                                    className="rounded-xl uppercase"
                                    placeholder="Enter IFSC code"
                                    onChange={(e) => {
                                        form.setFieldValue('ifscCode', e.target.value.toUpperCase());
                                    }}
                                />
                            </Form.Item>
                        </div>
                    </Card>
                )}

                {accountType === 'UPI' && (
                    <Card className="shadow-sm border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">UPI Details</h2>
                                <p className="text-sm text-slate-500">UPI ID for payments</p>
                            </div>
                        </div>

                        <Form.Item
                            label="UPI ID"
                            name="upiId"
                            rules={[{ required: true, message: 'Please enter UPI ID' }]}
                        >
                            <Input size="large" className="rounded-xl" placeholder="Enter UPI ID (e.g., user@paytm)" />
                        </Form.Item>
                    </Card>
                )}

                {accountType === 'QR_CODE' && (
                    <Card className="shadow-sm border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">QR Code</h2>
                                <p className="text-sm text-slate-500">Payment QR Code</p>
                            </div>
                        </div>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold">Upload QR Code</span>}
                            name="qrCode"
                            rules={[{ required: true, message: 'Please upload a QR code' }]}
                        >
                            <Upload
                                beforeUpload={handleQrCodeUpload}
                                showUploadList={false}
                                accept="image/jpeg,image/png"
                                maxCount={1}
                            >
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-teal-500 hover:bg-slate-50 transition-all w-full md:w-96 mx-auto">
                                    {qrCodePreview ? (
                                        <div className="relative">
                                            <img src={qrCodePreview} alt="QR Code Preview" className="max-h-48 rounded-lg" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity text-white font-medium">
                                                Click to Change
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-teal-50 text-teal-600 rounded-full mb-3">
                                                <UploadIcon size={24} />
                                            </div>
                                            <p className="text-slate-700 font-semibold mb-1">Click to Upload QR Code</p>
                                            <p className="text-slate-400 text-xs">Supports JPG, PNG (Max 2MB)</p>
                                        </>
                                    )}
                                </div>
                            </Upload>
                        </Form.Item>
                    </Card>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <Button size="large" onClick={() => navigate('/admin/accounts/list')}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<Save size={18} />}
                        size="large"
                        loading={updateMutation.isPending}
                        className="bg-indigo-600"
                    >
                        Save Account
                    </Button>
                </div>
            </Form>
        </div>
    );
};
