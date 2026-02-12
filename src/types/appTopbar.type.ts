export interface Project {
    id: number;
    ProjectId: number;
    name: string;
    status: 'Active' | 'Inactive';
    budget: string;
    system_company?: {
        name: string;
    };
}

export interface CompanyGroup {
    company: string;
    projects: Project[];
}

export interface NotificationItem {
    id: number;
    roId: number;
    roNo: string;
    message: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    level?: 'PM' | 'PURC' | 'PD';
    unread: boolean;
}
