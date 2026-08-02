export type UserRole = 'admin' | 'citizen';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
};
