export const ROLE_ORDER = ['QS', 'CM', 'SITE', 'PD', 'MGM', 'PURC'];

export type FlowStep = {
    role: string;
    status: 'approved' | 'pending' | 'waiting' | 'rejected' | 'acknowledged';
};

export function buildApprovalFlow(recommendations: any[], reviews: any[]): FlowStep[] {
    return ROLE_ORDER.map((role, index) => {
        const rec = recommendations.find((r) => r.Department?.toLowerCase().startsWith(role.toLowerCase()));
        const rev = reviews.find((r) => {
            const level = (r.ApprovalLevel || '').toLowerCase();
            const roleLower = role.toLowerCase();

            if (roleLower === 'purc') {
                return level === 'purc' || level === 'purch';
            }

            return level.startsWith(roleLower);
        });

        const action = rec || rev;

        if (action?.RecommendationType || action?.ReviewType) {
            const type = (action.RecommendationType || action.ReviewType || '').toString();
            const lower = type.toLowerCase();

            // Treat as rejected if contains reject
            if (lower.includes('reject')) {
                return { role, status: 'rejected' };
            }

            // Treat as acknowledged if contains acknowledge
            if (lower.includes('acknowledge')) {
                return { role, status: 'acknowledged' };
            }

            return { role, status: 'approved' };
        }

        // determine pending
        const firstIncomplete = ROLE_ORDER.findIndex((r) => {
            const recCheck = recommendations.find((x) => x.Department?.toLowerCase().startsWith(r.toLowerCase()));
            const revCheck = reviews.find((x) => {
                const level = (x.ApprovalLevel || '').toLowerCase();

                if (r === 'PURC') {
                    return level === 'purc' || level === 'purch';
                }

                return level === r.toLowerCase();
            });

            return !(recCheck?.RecommendationType || revCheck?.ReviewType);
        });

        if (index === firstIncomplete) {
            return { role, status: 'pending' };
        }

        return { role, status: 'waiting' };
    });
}
