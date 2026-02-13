import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Typography, Modal } from 'antd';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
    portalName: string;
    onFinish: (values: any) => Promise<void>;
    isLoading: boolean;
    onForgotPassword: (values: any) => Promise<void>;
    isForgotPasswordLoading: boolean;
    isForgotPasswordModalVisible: boolean;
    setIsForgotPasswordModalVisible: (visible: boolean) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    portalName,
    onFinish,
    isLoading,
    onForgotPassword,
    isForgotPasswordLoading,
    isForgotPasswordModalVisible,
    setIsForgotPasswordModalVisible
}) => {
    const [forgotPasswordForm] = Form.useForm();

    const handleForgotPasswordCancel = () => {
        setIsForgotPasswordModalVisible(false);
        forgotPasswordForm.resetFields();
    };

    return (
        <div className="flex flex-col justify-center items-center p-8 lg:p-16 xl:p-24 relative w-full h-full">
            {/* Logo Area */}
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <img src="/logo.png" alt="IndigoPay" className="h-12 w-auto" />
            </div>

            <div className="w-full max-w-md space-y-8">
                <div className="text-left">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-slate-500 text-lg">
                        Please enter your details to access your <b>{portalName.toLowerCase()}</b>.
                    </p>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                    size="large"
                    className="mt-8"
                >
                    <Form.Item
                        name="username"
                        label={<span className="font-semibold text-slate-700">Username</span>}
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input
                            placeholder="Enter your username"
                            className="h-12 bg-slate-50 border-slate-200 hover:border-indigo-400 focus:border-indigo-500 rounded-lg px-4"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span className="font-semibold text-slate-700">Password</span>}
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password
                            placeholder="••••••••"
                            className="h-12 bg-slate-50 border-slate-200 hover:border-indigo-400 focus:border-indigo-500 rounded-lg px-4"
                            iconRender={(visible) => (visible ? <Eye size={18} /> : <EyeOff size={18} />)}
                        />
                    </Form.Item>

                    <div className="flex items-center justify-between mb-6">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="text-slate-600">Remember Me</Checkbox>
                        </Form.Item>
                        <Typography.Link
                            onClick={() => setIsForgotPasswordModalVisible(true)}
                            className="font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                            Forgot Password?
                        </Typography.Link>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/30 border-none transition-all hover:scale-[1.01]"
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            <Modal
                title="Reset Password"
                open={isForgotPasswordModalVisible}
                onCancel={handleForgotPasswordCancel}
                footer={null}
                centered
            >
                <Form
                    form={forgotPasswordForm}
                    layout="vertical"
                    onFinish={onForgotPassword}
                >
                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input prefix={<User size={16} />} placeholder="Username" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 8, message: 'Password must be at least 8 characters long' }
                        ]}
                    >
                        <Input.Password prefix={<Lock size={16} />} placeholder="New Password" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isForgotPasswordLoading} block>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
