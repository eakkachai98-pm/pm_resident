export type UserRole = 'user' | 'staff' | 'admin';
export type Screen = 'user-dashboard' | 'technician-dashboard' | 'command-center' | 'asset-detail' | 'inventory' | 'personnel' | 'tickets' | 'settings' | 'billing';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  resolution?: string;
  assetId: string;
  reporterId: string;
  assigneeId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  scheduledDate?: string;
  scheduledSlot?: string;
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
}

export interface Personnel {
  id: string;
  name: string;
  username?: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  avatar: string;
  userRole: UserRole;
  joinedDate: string;
  assetCount: number;
  notifyEmail?: boolean;
  notifyInApp?: boolean;
  notifySystem?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ticket' | 'asset' | 'system';
  priority: 'Low' | 'Medium' | 'High';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  spec: string;
  status: 'Active' | 'In Maintenance' | 'Retired';
  serialNumber: string;
  purchaseDate: string;
  location: string;
  department: string;
  assignedPersonnelId?: string;
  assignedUser: {
    name: string;
    role: string;
    avatar: string;
  };
  image: string;
}

export interface Activity {
  id: string;
  assetId: string;
  description: string;
  user: string;
  status: 'Complete' | 'Warning' | 'Error' | 'Queued';
  time: string;
}
