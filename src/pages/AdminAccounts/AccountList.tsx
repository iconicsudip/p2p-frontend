import { Button, Card, message, Modal, Popconfirm, Space, Switch, Table } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBankDetails, useUpdateAdminBankDetails } from '../../hooks/useRequests';
import { BankDetails } from '../../types';

interface BankAccount extends BankDetails {
    id: string;
    isActive: boolean;
}

export const AccountList: React.FC = () => {
    const navigate = useNavigate();
    const { data: adminDetails, isLoading, refetch } = useAdminBankDetails();
    const updateMutation = useUpdateAdminBankDetails();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);

    useEffect(() => {
        if (adminDetails?.bankDetails) {
            // Handle both legacy single object and new array format
            if (Array.isArray(adminDetails.bankDetails)) {
                setAccounts(adminDetails.bankDetails);
            } else if (Object.keys(adminDetails.bankDetails).length > 0) {
                // Migrate single object to array
                setAccounts([{
                    ...adminDetails.bankDetails,
                    id: 'default',
                    isActive: true
                }]);
            }
        }
    }, [adminDetails]);

    const handleToggleActive = async (id: string, checked: boolean) => {
        const updatedAccounts = accounts.map(acc =>
            acc.id === id ? { ...acc, isActive: checked } : acc
        );

        // Optimistic update
        setAccounts(updatedAccounts);

        try {
            await updateMutation.mutateAsync({
                bankDetails: updatedAccounts,
                upiId: adminDetails?.upiId,
                qrCode: adminDetails?.qrCode,
                maxWithdrawalLimit: adminDetails?.maxWithdrawalLimit
            });
            message.success(`Account ${checked ? 'activated' : 'deactivated'}`);
        } catch (error) {
            message.error('Failed to update status');
            refetch(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        const updatedAccounts = accounts.filter(acc => acc.id !== id);

        setAccounts(updatedAccounts);

        try {
            await updateMutation.mutateAsync({
                bankDetails: updatedAccounts,
                upiId: adminDetails?.upiId,
                qrCode: adminDetails?.qrCode,
                maxWithdrawalLimit: adminDetails?.maxWithdrawalLimit
            });
            message.success('Account deleted successfully');
        } catch (error) {
            message.error('Failed to delete account');
            refetch();
        }
    };

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${type === 'BANK_ACCOUNT' ? 'bg-indigo-100 text-indigo-700' :
                        type === 'UPI' ? 'bg-purple-100 text-purple-700' :
                            'bg-teal-100 text-teal-700'}`}>
                    {type ? type.replace('_', ' ') : 'BANK ACCOUNT'}
                </span>
            )
        },
        {
            title: 'Details',
            key: 'details',
            render: (_: any, record: BankAccount) => {
                if (record.type === 'UPI') {
                    return <span>{record.upiId}</span>;
                } else if (record.type === 'QR_CODE') {
                    return (
                        record.qrCode ?
                            <img
                                src={record.qrCode}
                                alt="QR Code"
                                className="w-12 h-12 object-cover rounded cursor-pointer border border-slate-200 hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewImage(record.qrCode || null)}
                            /> :
                            <span className="text-slate-400">No Image</span>
                    );
                }
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{record.bankName}</span>
                        <span className="text-xs text-slate-500">{record.accountNumber}</span>
                    </div>
                );
            }
        },
        {
            title: 'Account Holder',
            dataIndex: 'accountHolderName',
            key: 'accountHolderName',
            render: (text: string, record: BankAccount) => record.type === 'BANK_ACCOUNT' ? text : '-'
        },
        {
            title: 'IFSC / Info',
            key: 'info',
            render: (_: any, record: BankAccount) => record.type === 'BANK_ACCOUNT' ? record.ifscCode : '-'
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: BankAccount) => (
                <Switch
                    checked={record.isActive}
                    onChange={(checked) => handleToggleActive(record.id as string, checked)}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: BankAccount) => (
                <Space>
                    <Popconfirm
                        title="Delete account"
                        description="Are you sure you want to delete this account?"
                        onConfirm={() => handleDelete(record.id as string)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            danger
                            type="text"
                            icon={<Trash2 size={16} />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bank Accounts</h1>
                    <p className="text-slate-500">Manage your connected bank accounts</p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={18} />}
                    onClick={() => navigate('/admin/accounts/add')}
                    className="bg-indigo-600"
                >
                    Add Account
                </Button>
            </div>

            <Card className="shadow-sm border-slate-100 rounded-xl">
                <Table
                    columns={columns}
                    dataSource={accounts}
                    rowKey="id"
                    loading={isLoading}
                    pagination={false}
                    locale={{ emptyText: 'No bank accounts added' }}
                />
            </Card>

            <Modal
                open={!!previewImage}
                footer={null}
                onCancel={() => setPreviewImage(null)}
                centered
                width={400}
                className="p-0 bg-transparent"
                styles={{ content: { padding: 0, overflow: 'hidden', borderRadius: '1rem' } }}
            >
                {previewImage && (
                    <div className="flex flex-col items-center">
                        <div className="w-full bg-slate-900 p-4 flex justify-between items-center">
                            <h3 className="text-white font-medium">QR Code Preview</h3>
                        </div>
                        <img
                            src={previewImage}
                            alt="QR Code"
                            className="w-full h-auto max-h-[500px] object-contain bg-white"
                        />
                        <div className="p-4 w-full bg-white text-center">
                            <Button onClick={() => setPreviewImage(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
