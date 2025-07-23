export interface EmailProps {
  name: string;
  email: string;
}

export interface WelcomeEmailProps extends EmailProps {}

export interface ResetPasswordEmailProps extends EmailProps {
  resetLink: string;
}

export interface NotificationEmailProps extends EmailProps {
  title: string;
  message: string;
}

export interface OTPEmailProps extends EmailProps {
  otpCode: string;
  expiresIn?: string;
}

export interface WhatsNewEmailProps extends EmailProps {
  features: Feature[];
  version?: string;
}

export interface SecurityEmailProps extends EmailProps {
  deviceInfo: DeviceInfo;
  location?: string;
  timestamp: string;
}

export interface DailyDigestEmailProps extends EmailProps {
  date: string;
  balanceSummary: BalanceSummary;
  transactions: Transaction[];
  insights: Insight[];
}

export interface LowBalanceAlertEmailProps extends EmailProps {
  accountName: string;
  currentBalance: number;
  threshold: number;
  currency?: string;
}

export interface Feature {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface DeviceInfo {
  deviceType: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
}

export interface BalanceSummary {
  totalBalance: number;
  previousBalance: number;
  change: number;
  currency: string;
  accounts: AccountBalance[];
}

export interface AccountBalance {
  name: string;
  balance: number;
  type: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account: string;
}

export interface Insight {
  type: 'spending' | 'saving' | 'income' | 'warning';
  title: string;
  message: string;
  value?: number;
}

export interface EmailResponse {
  template: string;
  html: string;
  subject: string;
}