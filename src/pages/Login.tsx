import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { User, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLogin } from '../hooks/useAuth';
import { UserRole } from '../types';

const { Text } = Typography;

export const Login: React.FC = () => {
    const { login, user } = useAuth();
    const loginMutation = useLogin();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            if (user.role === UserRole.SUPER_ADMIN) {
                navigate('/admin/dashboard');
            } else {
                navigate('/vendor/dashboard');
            }
        }
    }, [user, navigate]);

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            const data = await loginMutation.mutateAsync(values);
            login(data.token, data.user);
            message.success('Login successful!');

            // Navigation is handled by the useEffect watching 'user'
        } catch (error) {
            // Error is handled by axios interceptor or mutation onError
            console.error('Login error:', error);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
        }}>
            <Card
                style={{
                    width: '100%',
                    maxWidth: 450,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    borderRadius: 16,
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <img src="/logo.png" alt="IndigoPay" style={{ height: '60px', marginBottom: '10px' }} />
                    </div>

                    <Form
                        name="login"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' },
                            ]}
                        >
                            <Input
                                prefix={<User size={16} />}
                                placeholder="Email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password
                                prefix={<Lock size={16} />}
                                placeholder="Password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loginMutation.isPending}
                                block
                                icon={<LogIn size={18} />}
                                style={{
                                    height: 48,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Contact your administrator for login credentials
                    </Text>
                </Space>
            </Card>
        </div>
    );
};
