
import React, { useState } from 'react';
import { Form, Input, Button, message, Modal, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    Copy,
    CheckCircle,
    Info,
    UserPlus,
    Eye,
    EyeOff
} from 'lucide-react';
import { useCreateVendor } from '../hooks/useAuth';
import { CreateVendorRequest } from '../types';

export const CreateVendor: React.FC = () => {
    const [form] = Form.useForm();
    const createVendorMutation = useCreateVendor();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);
    const navigate = useNavigate();

    const onFinish = async (values: CreateVendorRequest) => {
        try {
            await createVendorMutation.mutateAsync(values);
            // message.success handled in hook
            setCreatedCredentials({
                email: values.email,
                password: values.password
            });
            setIsModalOpen(true);
            form.resetFields();
        } catch (error) {
            console.error('Failed to create vendor:', error);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        navigate('/admin/vendors');
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} copied to clipboard`);
    };

    return (
        <div className="mx-auto min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Create Vendor</h1>
                <p className="text-slate-500">
                    Add a new strategic partner to your financial network.
                </p>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                    requiredMark="optional"
                >
                    {/* Primary Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-2">
                        <Form.Item
                            name="name"
                            label={<span className="font-bold text-slate-700 text-sm">Vendor Name <span className="text-rose-500">*</span></span>}
                            rules={[{ required: true, message: 'Please enter vendor name!' }]}
                        >
                            <Input
                                placeholder="Enter full vendor name"
                                className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<span className="font-bold text-slate-700 text-sm">Email Address <span className="text-rose-500">*</span></span>}
                            rules={[
                                { required: true, message: 'Please enter email!' },
                                { type: 'email', message: 'Please enter a valid email!' },
                            ]}
                        >
                            <Input
                                placeholder="vendor@company.com"
                                className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="password"
                        label={<span className="font-bold text-slate-700 text-sm">Password <span className="text-rose-500">*</span></span>}
                        rules={[
                            { required: true, message: 'Please enter password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' },
                        ]}
                    >
                        <Input.Password
                            placeholder="••••••••"
                            iconRender={(visible) => (visible ? <Eye size={18} /> : <EyeOff size={18} className="text-slate-400" />)}
                            className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                        />
                    </Form.Item>

                    {/* Banking Header */}
                    <div className="mt-8 mb-6 border-b border-indigo-50 pb-2">
                        <span className="text-xs font-bold text-indigo-500 tracking-wider uppercase">Banking Information</span>
                    </div>

                    {/* Banking Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <Form.Item
                            label={<span className="font-bold text-slate-700 text-sm">Account Number</span>}
                            name={['bankDetails', 'accountNumber']}
                        >
                            <Input
                                placeholder="Enter account number"
                                className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-bold text-slate-700 text-sm">Routing Number / IFSC</span>}
                            name={['bankDetails', 'ifscCode']}
                        >
                            <Input
                                placeholder="Branch code"
                                className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-bold text-slate-700 text-sm">Bank Name</span>}
                            name={['bankDetails', 'bankName']}
                        >
                            <Input
                                placeholder="Financial Institution"
                                className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-bold text-slate-700 text-sm">Account Holder Name</span>}
                            name={['bankDetails', 'accountHolderName']}
                        >
                            <Input
                                placeholder="Official account name"
                                className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label={<span className="font-bold text-slate-700 text-sm">UPI ID</span>}
                        name="upiId"
                        className="mt-2"
                    >
                        <Input
                            placeholder="username@upi"
                            className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3"
                        />
                    </Form.Item>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 mt-12 mb-2">
                        <Button
                            type="text"
                            onClick={() => navigate('/admin/vendors')}
                            className="text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-700 h-12 px-6 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createVendorMutation.isPending}
                            icon={<UserPlus size={20} />}
                            className="bg-indigo-electric hover:!bg-indigo-600 border-none h-12 px-8 rounded-xl font-bold text-base shadow-lg shadow-indigo-500/25 transition-all hover:translate-y-[-1px]"
                        >
                            Create Vendor Account
                        </Button>
                    </div>
                </Form>
            </div>

            {/* Process Note Info Box */}
            <div className="mt-8 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-6 flex gap-4 items-start">
                <Info className="text-indigo-400 w-5 h-5 mt-1" />
                <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-bold text-slate-800">Process Note:</span> A secure invitation link will be dispatched to the provided email address. Vendors will be prompted to verify their identity and finalize their profile setup upon initial login.
                </p>
            </div>

            {/* Success Modal */}
            <Modal
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={[
                    <Button key="done" type="primary" onClick={handleModalClose} className="bg-indigo-electric h-10 px-8 rounded-lg">
                        Done
                    </Button>
                ]}
                centered
                width={480}
                className="rounded-2xl overflow-hidden"
            >
                <div className="text-center mb-6 pt-4">
                    <CheckCircle className="w-12 h-12 !text-green-600 mb-3 block mx-auto" />
                    <h3 className="text-xl font-bold text-slate-900">Vendor Created Successfully!</h3>
                    <p className="text-slate-500 mt-1">Please ensure you share these credentials securely.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="mb-4">
                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Address</p>
                        <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border border-slate-200 shadow-sm">
                            <code className="text-slate-800 font-mono text-base">{createdCredentials?.email}</code>
                            <Tooltip title="Copy Email">
                                <Button
                                    type="text"
                                    icon={<Copy className="text-slate-400 hover:text-indigo-electric w-4 h-4" />}
                                    onClick={() => createdCredentials && copyToClipboard(createdCredentials.email, 'Email')}
                                />
                            </Tooltip>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Password</p>
                        <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border border-slate-200 shadow-sm">
                            <code className="text-slate-800 font-mono text-base">{createdCredentials?.password}</code>
                            <Tooltip title="Copy Password">
                                <Button
                                    type="text"
                                    icon={<Copy className="text-slate-400 hover:text-indigo-electric w-4 h-4" />}
                                    onClick={() => createdCredentials && copyToClipboard(createdCredentials.password, 'Password')}
                                />
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 items-start">
                    <Info className="mt-0.5 text-amber-500 w-4 h-4" />
                    <p>Make sure to copy these credentials now. You can also view them later from the Vendors List credentials action.</p>
                </div>
            </Modal>
        </div>
    );
};
