export interface BCRTableItem {
    id: number;
    itemCode: string;
    description: string;
    uom: string;
    unitPrice: number;
    remark?: string;
    location1?: string;
    location2?: string;
    budgetId?: number;
    category: string;
    element: string;
    subElement: string;
    subsubElement: string;
    wastage: string;
    statistics: {
        budgetQty: number;
        totalOrderedQty: number;
        totalRequestedQty: number;
    };
}

export interface BudgetAttachment {
    filename: string;
    path: string;
    type: string;
    size: number;
}

export interface BudgetChangeItem {
    Id: number;
    BudgetChangeId: number;
    BudgetItemId: number;
    BudgetQty?: string;
    ItemCode: string;
    Uom: string | null;
    UnitPrice: string | number;
    OrderedQty: string;
    NewOrder: string;
    ExceededQty: string;
    Description: string;
    Remark?: string;
    CreatedAt: string;
    CreatedBy: string | null;
    UpdatedAt: string;
    UpdatedBy: string | null;
    location: string;
    element: string;
}

export interface BudgetChangeRequest {
    Id: number;
    ProjectId: number;
    DocNo: string;
    RequestDate: string | Date | null;
    RequestedBy: string;
    Department: string;
    Remark: string;
    TotalAmount: number;
    Reason: string;
    Attachment: string | BudgetAttachment[];
    Status: string;
    CreatedBy: string | null;
    CreatedAt: string;
    UpdatedAt: string;
    UpdatedBy: string | null;
    budget_change_items: BudgetChangeItem[];
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface BudgetChangeRequestResponse {
    success: boolean;
    message?: string;
    data?: BudgetChangeRequest[];
    pagination?: PaginationMeta;
}

export interface SingleBudgetChangeRequestResponse {
    success: boolean;
    message?: string;
    data?: BudgetChangeRequest;
}

export interface BudgetChangeItemPayload {
    ItemCode: string;
    Uom: string | null;
    UnitPrice: number;
    OrderedQty: number;
    NewOrder: number;
    Description: string;
    Remark?: string;
    Location1?: string;
    Location2?: string;
    Category?: string;
    Element?: string;
    SubElement?: string;
    SubSubElement?: string;
    Wastage?: string;
    ExceededQty?: number;
}

export interface BudgetChangeRequestPayload {
    ProjectId: string | number | undefined;
    RequestDate: string;
    RequestedBy: string;
    Department: string;
    Remark: string;
    TotalAmount: number;
    BudgetId?: number;
    Reason: string;
    Type: 'BudgetChangeRequest';
    Items: BudgetChangeItemPayload[];
}

export interface HistoryList {
    Id: number;
    ActionDetails: string;
    ActionType: string;
    CreatedAt: string;
    EntityId: number;
    EntityType: string;
    Metadata: HistoryMetadata;
    NewValue: any | null;
    OldValue: any | null;
    UserId: number | null;
    UserName: string | null;
    UserRole: string | null;
}

export interface HistoryMetadata {
    DocNo: string;
    TotalAmount: number;
    Department: string;
    ItemCount: number;
    Status: string | null;
    IsDraft: boolean;
}

export interface HistoryResponse {
    success: boolean;
    message?: string;
    data?: HistoryList[];
}

export interface BCRRecommendationPayload {
    RecommendationType: string;
    RecommendedItems: { BudgetChangeItemId: number; RecommendedQty: number }[];
    Remark?: string | null;
    files?: string[];
}

export interface CreateRecommendationData {
    Id: number;
    BudgetChangeId: number;
    Department: string;
    ReviewerName: string;
    RecommendationType: string;
    Remark: string;
    CreatedAt: string;
}
export interface CreateRecommendationResponse {
    success: boolean;
    message: string;
    data: CreateRecommendationData;
}

export interface RecommendationResponse {
    success: boolean;
    message?: string;
    data?: RecommendationList[];
}

export interface RecommendationList {
    Id: number;
    BudgetChangeId: number;
    Department: string;
    ReviewerName: string;
    RecommendationType: string;
    Remark: string | null;
    Reason: string | null;
    Attachment: string | null;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt: string;
    UpdatedBy: string | null;
    recommendation_items: RecommendationItem[];
}

export interface RecommendationItem {
    BudgetChangeItemId: number;
    RecommendedQty: string;
    budget_change_item: BudgetChangeItemDetails;
}

export interface BudgetChangeItemDetails {
    Id: number;
    ItemCode: string;
    NewOrder: string;
    OrderedQty: string;
    QsQty?: string | null;
    SiteQty?: string | null;
    Uom: string;
}

export interface DiscussionItem {
    id: number | null;
    role: string;
    name: string;
    datetime: string;
    RecommendationType: string;
    Reason: string | null;
    Remark: string | null;
    recommendationItem: DiscussionRowItem[];
    documentUrl: { filename: string; path: string }[];
}

export interface DiscussionRowItem {
    BudgetChangeItemId: number;
    ItemCode: string;
    NewOrder: string;
    OrderedQty: string;
    RecommendedQty: string;
    Description: string;
    Uom: string;
}
export interface BCRFinalDecisionPayload {
    ReviewType: string;
    ReviewedItems?: { BudgetChangeItemId: number; ApprovedQty: number }[];
    Remark?: string;
}

export interface ReviewList {
    Id: number;
    BudgetChangeId: number;
    ReviewerRole: string;
    ApprovalLevel: string;
    ReviewerName: string;
    ReviewType: string;
    Remark: string | null;
    Status: string | null;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt: string;
    UpdatedBy: string | null;
    review_items: reviewItem[];
}

export interface reviewItem {
    BudgetChangeItemId: number;
    RecommendedQty: string;
}

export interface AttachmentItem {
    filename: string;
    path: string;
    size?: number;
    type?: string;
}

// for state
export interface State {
    loading: boolean;
    budgetChangeRequestList: BudgetChangeRequest[];
    singleBudgetChangeRequest: BudgetChangeRequest | null;
    historyList: HistoryList[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };

    filters: {
        search: string;
        status: string;
        startDate: string;
        endDate: string;
    };

    sorting: {
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    };

    sortField: string;
    sortOrder: 'asc' | 'desc';
}
