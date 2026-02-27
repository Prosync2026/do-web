export enum BcrRoleEnum {
    QS = 'QS',
    CM = 'CM',
    SITE = 'SITE',
    PD = 'PD',
    MGM = 'MGM'
}

export enum BcrReasonEnum {
    PM_VO_AI_EI_SI = 'VO: AI/EI or Site Instruction (SI) to be attached',
    PM_THEFT_DAMAGE = 'Theft case / material damages (police report or photo to be attached)',
    PM_MOCKUP_BUDGET = 'Mock up budget: request of material budget revision based on completed mock up unit',
    PM_INACCURATE_BUDGET = 'Inaccurate budget',
    PM_OTHERS = 'Others (please specify)',
    QS_OVERALL_REMEASUREMENT = 'Overall remeasurement (please attached revised budgetory sheet)',
    QS_MOCKUP_BUDGET = 'Mock up budget: revise of material budget revision based on completed mock up unit',
    QS_BUDGET_ADJUSTMENT = 'Budget adjustment/refinement; ie. BQ quantity insufficient etc.',
    QS_VO_CHANGES = 'VO and changes (could be own initiation etc)',
    OTHERS_REASON = 'Others (please specify)'
}

export enum BcrRecommendationEnum {
    Keep_Original = 'Keep_Original',
    Specific_Quantity = 'Specific_Quantity',
    ACCEPT_CHANGE_QS = 'Approve',
    REJECT_CHANGE_QS = 'Reject',
    APPROVE_QS_CHANGE = 'Approve_QS',
    APPROVE_SITE_CHANGE = 'Approve_Site',
    APPROVE_ORIGINAL = 'Approve_As_Requested',
    APPROVE_PD_CHANGE = 'Approve_PD'
}
