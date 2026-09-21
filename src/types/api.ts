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

export type ReportStatus = 'open' | 'in_progress' | 'resolved';

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type Department = {
  id: number;
  name: string;
  contact_email: string;
};

export type ReportStatusHistoryEntry = {
  id: number;
  from_status: ReportStatus | null;
  to_status: ReportStatus;
  note: string | null;
  photo_url: string | null;
  changed_by: string | null;
  created_at: string;
};

export type Report = {
  id: number;
  title: string;
  description: string;
  category: Category;
  department: Department | null;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_url: string;
  status: ReportStatus;
  votes_count: number;
  voted_by_me: boolean | null;
  reported_by: string | null;
  status_history: ReportStatusHistoryEntry[];
  created_at: string;
  updated_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  report_id: number | null;
  read_at: string | null;
  created_at: string;
};

export type Paginated<T> = {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: { current_page: number; last_page: number; total: number };
};
