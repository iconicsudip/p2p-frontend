import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { Building2, CreditCard, Save, Lock } from 'lucide-react';
import { useAdminBankDetails, useUpdateAdminBankDetails } from '../hooks/useRequests';
import { authAPI } from '../services/apiService';

export const AdminSettings: React.FC = () => {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const { data: adminDetails, isLoading } = useAdminBankDetails();
    const updateMutation = useUpdateAdminBankDetails();
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Pre-populate form with existing details
    useEffect(() => {
        if (adminDetails) {
            form.setFieldsValue({
                accountNumber: adminDetails.bankDetails?.accountNumber || '',
                ifscCode: adminDetails.bankDetails?.ifscCode || '',
                bankName: adminDetails.bankDetails?.bankName || '',
                accountHolderName: adminDetails.bankDetails?.accountHolderName || '',
                upiId: adminDetails.upiId || '',
            });
        }
    }, [adminDetails, form]);

    const onFinish = async (values: any) => {
        const { accountNumber, ifscCode, bankName, accountHolderName, upiId } = values;

        const bankDetails = (accountNumber || ifscCode || bankName || accountHolderName) ? {
            accountNumber,
            ifscCode: ifscCode?.toUpperCase(),
            bankName,
            accountHolderName,
        } : undefined;

        await updateMutation.mutateAsync({
            bankDetails,
            upiId: upiId || undefined,
        });
    };

    const onPasswordChange = async (values: { newPassword: string; confirmPassword: string }) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('New passwords do not match');
            return;
        }

        if (values.newPassword.length < 8) {
            message.error('Password must be at least 8 characters long');
            return;
        }

        setPasswordLoading(true);
        try {
            await authAPI.resetPassword('', values.newPassword);
            message.success('Password changed successfully!');
            passwordForm.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                    Settings
                </h1>
                <p className="text-slate-600">
                    Manage your account settings, bank details, and security
                </p>
            </div>

            {/* Security Section */}
            <div className="mb-12">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide text-sm">Security</h2>
                    <div className="h-1 w-16 bg-rose-500 rounded-full mt-1"></div>
                </div>

                {/* Password Change Card */}
                <Card
                    bordered={false}
                    className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
                            <p className="text-sm text-slate-500">Update your account password</p>
                        </div>
                    </div>

                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={onPasswordChange}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item
                                label={<span className="text-slate-700 font-semibold">New Password</span>}
                                name="newPassword"
                                rules={[
                                    { required: true, message: 'Please enter your new password' },
                                    { min: 8, message: 'Password must be at least 8 characters' }
                                ]}
                            >
                                <Input.Password
                                    placeholder="Enter new password"
                                    className="h-11 rounded-xl border-slate-300 hover:border-rose-400 focus:border-rose-500"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="text-slate-700 font-semibold">Confirm Password</span>}
                                name="confirmPassword"
                                rules={[
                                    { required: true, message: 'Please confirm your new password' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Passwords do not match'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    placeholder="Re-enter new password"
                                    className="h-11 rounded-xl border-slate-300 hover:border-rose-400 focus:border-rose-500"
                                    size="large"
                                />
                            </Form.Item>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={passwordLoading}
                                icon={<Lock size={18} />}
                                className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all"
                            >
                                Change Password
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            {/* Financial Information Section */}
            <div>
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide text-sm">Financial Information</h2>
                    <div className="h-1 w-16 bg-indigo-500 rounded-full mt-1"></div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="space-y-6"
                >
                    {/* Bank Details Card */}
                    <Card
                        bordered={false}
                        className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden"
                    >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Bank Account Details</h2>
                                <p className="text-sm text-slate-500">Add your bank account information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item
                                label={<span className="text-slate-700 font-semibold">Account Holder Name</span>}
                                name="accountHolderName"
                                rules={[{ required: false }]}
                            >
                                <Input
                                    placeholder="Enter account holder name"
                                    className="h-11 rounded-xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="text-slate-700 font-semibold">Account Number</span>}
                                name="accountNumber"
                                rules={[{ required: false }]}
                            >
                                <Input
                                    placeholder="Enter account number"
                                    className="h-11 rounded-xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="text-slate-700 font-semibold">IFSC Code</span>}
                                name="ifscCode"
                                rules={[{ required: false }]}
                            >
                                <Input
                                    placeholder="Enter IFSC code"
                                    className="h-11 rounded-xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500 uppercase"
                                    size="large"
                                    onChange={(e) => {
                                        form.setFieldValue('ifscCode', e.target.value.toUpperCase());
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="text-slate-700 font-semibold">Bank Name</span>}
                                name="bankName"
                                rules={[{ required: false }]}
                            >
                                <Input
                                    placeholder="Enter bank name"
                                    className="h-11 rounded-xl border-slate-300 hover:border-indigo-400 focus:border-indigo-500"
                                    size="large"
                                />
                            </Form.Item>
                        </div>
                    </Card>

                    {/* UPI Details Card */}
                    <Card
                        bordered={false}
                        className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden !mt-6"
                    >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">UPI Details</h2>
                                <p className="text-sm text-slate-500">Add your UPI ID for quick payments</p>
                            </div>
                        </div>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold">UPI ID</span>}
                            name="upiId"
                            rules={[{ required: false }]}
                        >
                            <Input
                                placeholder="Enter UPI ID (e.g., user@paytm)"
                                className="h-11 rounded-xl border-slate-300 hover:border-purple-400 focus:border-purple-500"
                                size="large"
                            />
                        </Form.Item>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={updateMutation.isPending || isLoading}
                            icon={<Save size={18} />}
                            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-base shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all"
                            size="large"
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

