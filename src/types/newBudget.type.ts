// src/types/budget.type.ts

export interface BudgetVersion {
    id: number;
    versionCode: number;
    name: string;
    createdAt: string;
}

export interface BudgetItem {
    id: number;
    budgetId: number;
    itemCode: string;
    itemType?: string;
    itemClass?: string;
    description: string;
    description2?: string;
    location1?: string;
    location2?: string;
    category: string;
    element: string;
    subElement: string;
    subSubElement?: string;
    uom: string;
    qty: number | string;
    rate?: number;
    amount: number;
    wastage?: number;
    status: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
    rowIndex?: number;
}

export interface Budget {
    id: number;
    name: string;
    docNo?: string;
    totalAmount: number;
    status?: string;
    date?: string;
    createdBy?: string;
    createdAt: string;
    items: BudgetItem[];
}

export interface Pagination {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

// API RESPONSE AND PARAMS DATA
export interface GetBudgetsParams {
    projectId?: number;
    version?: number;
    budgetId?: number;
    page?: number;
    pageSize?: number;
}

export interface GetBudgetsResponse<T = any> {
    success: boolean;
    message?: string;
    // IF STABLE DON'T USE T BCS T IS CALL ANY
    data: T[];
    pagination: Pagination;
}

export interface GetBudgetItemsParams {
    projectId?: number;
    budgetId?: number;
    category?: string;
    element?: string;
    subElement?: string;
    subSubElement?: string;
    location1?: string;
    location2?: string;
    itemCode?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}
