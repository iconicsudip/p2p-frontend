import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { User, Lock, CheckCircle, XCircle } from 'lucide-react';
import { authAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export const VendorSettings: React.FC = () => {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const { user, updateUser } = useAuth();
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    // Pre-populate form with existing details
    useEffect(() => {
        if (user) {
            profileForm.setFieldsValue({
                name: user.name || '',
                username: user.username || '',
            });
        }
    }, [user, profileForm]);

    // Check username availability with debounce
    const checkUsernameAvailability = async (username: string) => {
        if (!username || username === user?.username) {
            setUsernameAvailable(null);
            return;
        }

        setCheckingUsername(true);
        try {
            const response = await authAPI.checkUsernameAvailability(username);
            setUsernameAvailable(response.data.available);
        } catch (error) {
            console.error('Failed to check username:', error);
        } finally {
            setCheckingUsername(false);
        }
    };

    const onProfileUpdate = async (values: { name: string; username: string }) => {
        setProfileLoading(true);
        try {
            const response = await authAPI.updateProfile(values);
            message.success('Profile updated successfully!');
            // Update user context
            if (updateUser && response.data.user) {
                updateUser(response.data.user);
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const onPasswordChange = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
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
            await authAPI.resetPassword(values.currentPassword, values.newPassword);
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
                    Manage your profile and security settings
                </p>
            </div>

            {/* Profile Section */}
            <div className="mb-12">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide text-sm">Profile</h2>
                    <div className="h-1 w-16 bg-indigo-500 rounded-full mt-1"></div>
                </div>

                <Card
                    bordered={false}
                    className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Profile Information</h2>
                            <p className="text-sm text-slate-500">Update your name and username</p>
                        </div>
                    </div>

                    <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={onProfileUpdate}
                        className="space-y-4"
                        initialValues={{
                            name: user?.name || '',
                            username: user?.username || '',
                        }}
                    >
                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Name</span>}
                            name="name"
                            rules={[{ required: true, message: 'Please enter your name' }]}
                        >
                            <Input
                                size="large"
                                placeholder="Enter your name"
                                className="rounded-xl"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Username</span>}
                            name="username"
                            rules={[
                                { required: true, message: 'Please enter a username' },
                                { min: 3, message: 'Username must be at least 3 characters' }
                            ]}
                            validateStatus={
                                checkingUsername ? 'validating' :
                                    usernameAvailable === true ? 'success' :
                                        usernameAvailable === false ? 'error' : ''
                            }
                            hasFeedback={usernameAvailable !== null}
                        >
                            <Input
                                size="large"
                                placeholder="Enter username"
                                className="rounded-xl"
                                onChange={(e) => {
                                    const username = e.target.value;
                                    // Debounce the check
                                    const timeoutId = setTimeout(() => {
                                        checkUsernameAvailability(username);
                                    }, 500);
                                    return () => clearTimeout(timeoutId);
                                }}
                                suffix={
                                    usernameAvailable === true ? (
                                        <CheckCircle size={18} className="text-green-500" />
                                    ) : usernameAvailable === false ? (
                                        <XCircle size={18} className="text-red-500" />
                                    ) : null
                                }
                            />
                        </Form.Item>

                        {usernameAvailable === false && (
                            <div className="text-sm text-red-600 -mt-2 mb-2">
                                This username is already taken
                            </div>
                        )}

                        <Form.Item className="mb-0 pt-4">
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={profileLoading}
                                disabled={usernameAvailable === false}
                                className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-semibold"
                            >
                                Save Changes
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>

            {/* Security Section */}
            <div className="mb-12">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide text-sm">Security</h2>
                    <div className="h-1 w-16 bg-rose-500 rounded-full mt-1"></div>
                </div>

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
                        className="space-y-4"
                    >
                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Current Password</span>}
                            name="currentPassword"
                            rules={[{ required: true, message: 'Please enter your current password' }]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Enter current password"
                                className="rounded-xl"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">New Password</span>}
                            name="newPassword"
                            rules={[
                                { required: true, message: 'Please enter a new password' },
                                { min: 8, message: 'Password must be at least 8 characters' }
                            ]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Enter new password"
                                className="rounded-xl"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-slate-700">Confirm New Password</span>}
                            name="confirmPassword"
                            rules={[{ required: true, message: 'Please confirm your new password' }]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Confirm new password"
                                className="rounded-xl"
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 pt-4">
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={passwordLoading}
                                className="bg-rose-600 hover:bg-rose-700 h-11 px-8 rounded-xl font-semibold"
                            >
                                Change Password
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
};
