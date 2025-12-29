export interface FilterVersion {
    label: string;
    value: string;
    latest?: boolean;
    id?: number;
}

export interface BudgetVersion {
    id: number;
    versionCode: number;
    name: string;
    createdAt: string;
}

export interface BudgetItem {
    Id: number;
    BudgetId: number;
    Category: string;
    Element: string;
    SubElement: string;
    SubSubElement: string;
    ItemClass: string;
    ItemType: string;
    ItemCode: string;
    Description: string;
    Description2?: string;
    Location1?: string;
    Location2?: string;
    Unit: string;
    Quantity: number | string;
    Rate?: number | string;
    Amount: number | string;
    Wastage?: number | string;
    Status: string;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt?: string | null;
    UpdatedBy?: string | null;
}

export interface Budget {
    Id: number;
    ProjectId: number;
    BudgetName: string;
    VersionCode: number | string;
    DocNo: string;
    Date: string;
    TotalAmount: number;
    GstAmount: number;
    Terms?: string;
    RefDoc?: string;
    Posting: string;
    Currency: string;
    Gst: string;
    Remark?: string;
    Status: string;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt?: string | null;
    UpdatedBy?: string | null;
    ApprovedBy?: string | null;
    ApproveAt?: string | null;
    RejectedBy?: string | null;
    RejectedAt?: string | null;
    budgetitems: BudgetItem[];
}

export interface Pagination {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export interface BudgetResponse {
    success: boolean;
    message?: string;
    data?: Budget[];
    pagination?: Pagination;
    versions?: {
        VersionCode: string | number;
        isLatest?: boolean;
    }[];
}

export interface BudgetStatisticsResponse {
    budgetItemId: number;
    budgetId: number;
    itemCode: string;
    description: string;
    unit: string;
    budgetQty: number;
    budgetAmount: number;
    totalRequested: number;
    totalOrdered: number;
    totalDelivered: number;
    totalBalance: number;
    totalRequestedQty: number;
    totalOrderedQty: number;
    totalDeliveredQty: number;
    utilization: {
        requestedPercent: number;
        orderedPercent: number;
        deliveredPercent: number;
    };
}

export interface GetBudgetItemsParams {
    projectId?: number;
    budgetId?: number;
    category?: string;
    element?: string;
    subElement?: string;
    location1?: string;
    location2?: string;
    itemCode?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}
