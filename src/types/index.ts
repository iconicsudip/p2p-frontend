export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  VENDOR = "VENDOR",
}

export enum RequestType {
  WITHDRAWAL = "WITHDRAWAL",
  DEPOSIT = "DEPOSIT",
}

export enum RequestStatus {
  PENDING = "PENDING",
  PICKED = "PICKED",
  PAID_FULL = "PAID_FULL",
  PAID_PARTIAL = "PAID_PARTIAL",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
}

export enum TransactionType {
  WITHDRAWAL = "WITHDRAWAL",
  DEPOSIT = "DEPOSIT",
}

export enum NotificationType {
  REQUEST_PICKED = "REQUEST_PICKED",
  PAYMENT_UPLOADED = "PAYMENT_UPLOADED",
  PAYMENT_APPROVED = "PAYMENT_APPROVED",
  PAYMENT_REJECTED = "PAYMENT_REJECTED",
  ADMIN_ALERT = "ADMIN_ALERT",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REQUEST_CANCELLED = "REQUEST_CANCELLED",
}

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: UserRole;
  bankDetails?: BankDetails | BankDetails[];
  upiId?: string;
  qrCode?: string;
  mustResetPassword?: boolean;
  maxWithdrawalLimit?: number;
  withdrawalLimitConfig?: WithdrawalLimitConfig;
  createdAt?: string;
}

export interface BankDetails {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
  id?: string;
  isActive?: boolean;
  upiId?: string;
  qrCode?: string;
  type?: "BANK_ACCOUNT" | "UPI" | "QR_CODE";
}

export interface Request {
  id: string;
  type: RequestType;
  amount: number;
  status: RequestStatus;
  bankDetails?: BankDetails;
  upiId?: string;
  qrCode?: string;
  paidAmount: number;
  pendingAmount: number;
  rejectionReason?: string;
  paymentFailureReason?: string;
  createdBy: User;
  createdById: string;
  pickedBy?: User;
  pickedById?: string;
  paymentSlips?: PaymentSlip[];
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  cancelledByAdmin?: boolean;
  deletedAt?: string;
  displayType?: RequestType;
  originalType?: RequestType;
}

export interface Transaction {
  id: string;
  requestId: string;
  vendorId: string;
  type: TransactionType;
  amount: number;
  status: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  requestId?: string;
  request?: Request;
  createdAt: string;
}

export interface PaymentSlip {
  id: string;
  requestId: string;
  uploadedById: string;
  fileUrl: string;
  amount: number;
  createdAt: string;
}

export interface VendorStats {
  totalWithdrawal: number;
  totalDeposit: number;
  netBalance: number;
  rejectedDeposits?: { count: number; amount: number };
  pendingWithdrawals?: { count: number; amount: number };
  rejectedWithdrawals?: { count: number; amount: number };
  approvedDeposits?: { count: number; amount: number };
  approvedWithdrawals?: { count: number; amount: number };
}

export interface MonthlyStats {
  month: string;
  withdrawal: number;
  deposit: number;
  netBalance?: number;
  totalVolume?: number;
}

export interface VendorStatsWithUser {
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  totalWithdrawal: number;
  totalDeposit: number;
  netBalance: number;
}

export interface SystemOverview {
  totalWithdrawal: number;
  totalDeposit: number;
  totalVendors: number;
  totalTransactions: number;
  rejectedDeposits?: { count: number; amount: number };
  pendingWithdrawals?: { count: number; amount: number };
  rejectedWithdrawals?: { count: number; amount: number };
  approvedDeposits?: { count: number; amount: number };
  approvedWithdrawals?: { count: number; amount: number };
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export enum WithdrawalLimitConfig {
  GLOBAL = "GLOBAL",
  CUSTOM = "CUSTOM",
  UNLIMITED = "UNLIMITED",
}

export interface CreateVendorRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  bankDetails?: BankDetails;
  upiId?: string;
  qrCode?: string;
  withdrawalLimitConfig?: WithdrawalLimitConfig;
  maxWithdrawalLimit?: number;
}

export interface CreateRequestRequest {
  type: RequestType;
  amount: number;
  bankDetails?: BankDetails;
  upiId?: string;
  qrCode?: string;
}

export interface VerifyPaymentRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
