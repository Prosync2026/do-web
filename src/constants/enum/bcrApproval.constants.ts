import { BcrReasonEnum, BcrRecommendationEnum, BcrRoleEnum } from './bcrApproval.enum';

export interface BcrRoleConfig {
    reasons?: { value: BcrReasonEnum; label: string }[];
    recommendations: { value: BcrRecommendationEnum; label: string }[];
}

const PM_REASONS = [
    { value: BcrReasonEnum.PM_VO_AI_EI_SI, label: 'VO: AI/EI or Site Instruction (SI) to be attached' },
    { value: BcrReasonEnum.PM_THEFT_DAMAGE, label: 'Theft case / material damages (police report or photo to be attached)' },
    { value: BcrReasonEnum.PM_MOCKUP_BUDGET, label: 'Mock up budget: request of material budget revision based on completed mock up unit' },
    { value: BcrReasonEnum.PM_INACCURATE_BUDGET, label: 'Inaccurate budget' },
    { value: BcrReasonEnum.OTHERS_REASON, label: 'Others (please specify)' }
];

const QS_REASONS = [
    { value: BcrReasonEnum.QS_OVERALL_REMEASUREMENT, label: 'Overall remeasurement (please attached revised budgetory sheet)' },
    { value: BcrReasonEnum.QS_MOCKUP_BUDGET, label: 'Mock up budget: revise of material budget revision based on completed mock up unit' },
    { value: BcrReasonEnum.QS_BUDGET_ADJUSTMENT, label: 'Budget adjustment/refinement; ie. BQ quantity insufficient etc.' },
    { value: BcrReasonEnum.QS_VO_CHANGES, label: 'VO and changes (could be own initiation etc)' },
    { value: BcrReasonEnum.OTHERS_REASON, label: 'Others (please specify)' }
];
export const BCR_ROLE_CONFIG: Record<BcrRoleEnum, BcrRoleConfig> = {
    QS: {
        reasons: QS_REASONS,
        recommendations: [
            { value: BcrRecommendationEnum.Specific_Quantity, label: 'Please change Budget Quantity' },
            { value: BcrRecommendationEnum.Keep_Original, label: 'Remain original budget' }
        ]
    },
    CM: {
        recommendations: [
            { value: BcrRecommendationEnum.ACCEPT_CHANGE_QS, label: 'Accept Budget Qty according to QS recommendation' },
            { value: BcrRecommendationEnum.REJECT_CHANGE_QS, label: 'Reject Budget Qty according to QS recommendation' }
        ]
    },
    SITE: {
        reasons: PM_REASONS,
        recommendations: [
            { value: BcrRecommendationEnum.Specific_Quantity, label: 'Please change Budget Quantity' },
            { value: BcrRecommendationEnum.Keep_Original, label: 'Remain original budget' }
        ]
    },
    PD: {
        recommendations: [
            { value: BcrRecommendationEnum.APPROVE_QS_CHANGE, label: 'Please change Budget Qty according to QS recommendation' },
            { value: BcrRecommendationEnum.APPROVE_SITE_CHANGE, label: 'Please change Budget Qty according to Site recommendation' },
            { value: BcrRecommendationEnum.Specific_Quantity, label: 'Please change Budget Qty to' }
        ]
    },
    MNGM: {
        recommendations: [
            { value: BcrRecommendationEnum.APPROVE_QS_CHANGE, label: 'Please change Budget Qty according to QS recommendation' },
            { value: BcrRecommendationEnum.APPROVE_SITE_CHANGE, label: 'Please change Budget Qty according to Site recommendation' },
            { value: BcrRecommendationEnum.APPROVE_PD_CHANGE, label: 'Please change Budget Qty according to Project Director recommendation' },
            { value: BcrRecommendationEnum.Specific_Quantity, label: 'Please change Budget Qty to' }
        ]
    }
};
