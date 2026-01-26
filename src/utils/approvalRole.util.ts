// UI / Project role (from DB)
export type UserRole = 'PM' | 'PD' | 'PURC';

// Approval workflow role
export type ApprovalRole = 'PM' | 'PD' | 'PURCH';

export const USER_ROLE_TO_APPROVAL_ROLE: Record<UserRole, ApprovalRole> = {
    PM: 'PM',
    PD: 'PD',
    PURC: 'PURCH'
};
