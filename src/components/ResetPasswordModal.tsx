import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { Lock } from 'lucide-react';
import { authAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordModalProps {
    visible: boolean;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ visible }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { updateUser } = useAuth();

    const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('New passwords do not match');
            return;
        }

        if (values.newPassword.length < 8) {
            message.error('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            // For first-time reset, we don't need current password
            // The backend will handle this differently for mustResetPassword users
            const response = await authAPI.resetPassword('', values.newPassword);
            message.success('Password reset successfully!');

            // Update user context with new mustResetPassword flag
            updateUser(response.data.user);

            form.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={visible}
            title={
                <div className="flex items-center gap-2">
                    <Lock size={20} className="text-indigo-600" />
                    <span className="text-lg font-bold">Reset Your Password</span>
                </div>
            }
            centered
            closable={false}
            maskClosable={false}
            footer={null}
            width={500}
        >
            <div className="mb-4">
                <p className="text-slate-600">
                    For security reasons, you must reset your password before accessing the dashboard.
                </p>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                <Form.Item
                    label="New Password"
                    name="newPassword"
                    rules={[
                        { required: true, message: 'Please enter your new password' },
                        { min: 8, message: 'Password must be at least 8 characters long' }
                    ]}
                >
                    <Input.Password
                        size="large"
                        placeholder="Enter new password (min 8 characters)"
                        className="rounded-lg"
                    />
                </Form.Item>

                <Form.Item
                    label="Confirm New Password"
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
                        size="large"
                        placeholder="Re-enter new password"
                        className="rounded-lg"
                    />
                </Form.Item>

                <Form.Item className="mb-0">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-lg font-semibold"
                    >
                        Reset Password
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};
