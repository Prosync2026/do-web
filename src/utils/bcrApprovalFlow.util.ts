export const ROLE_ORDER = ['QS', 'CM', 'SITE', 'PD', 'MGM'];

export type FlowStep = {
    role: string;
    status: 'approved' | 'pending' | 'waiting' | 'rejected';
};

export function buildApprovalFlow(recommendations: any[], reviews: any[]): FlowStep[] {
    return ROLE_ORDER.map((role, index) => {
        const rec = recommendations.find((r) => r.Department?.toLowerCase() === role.toLowerCase());
        const rev = reviews.find((r) => r.ApprovalLevel === role);

        const action = rec || rev;

        if (action?.RecommendationType || action?.ReviewType) {
            const type = (action.RecommendationType || action.ReviewType || '').toString();
            const lower = type.toLowerCase();

            // Treatas rejected if contains reject
            if (lower.includes('reject')) {
                return { role, status: 'rejected' };
            }

            return { role, status: 'approved' };
        }

        // determine pending
        const firstIncomplete = ROLE_ORDER.findIndex((r) => {
            const recCheck = recommendations.find((x) => x.Department?.toLowerCase() === r.toLowerCase());
            const revCheck = reviews.find((x) => x.ApprovalLevel === r);

            return !(recCheck?.RecommendationType || revCheck?.ReviewType);
        });

        if (index === firstIncomplete) {
            return { role, status: 'pending' };
        }

        return { role, status: 'waiting' };
    });
}
