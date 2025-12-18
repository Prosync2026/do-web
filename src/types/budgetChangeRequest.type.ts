export interface TableItem {
    id: number;
    itemCode: string;
    description: string;
    uom: string;
    unitPrice: number;
    budgetQty: number;
    orderedQty: number;
    newOrder: number;
    remark: string;
    location1?: string;
    location2?: string;
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
    ItemCode: string;
    Uom: string | null;
    UnitPrice: string;
    OrderedQty: string;
    NewOrder: string;
    ExceededQty: string;
    Description: string;
    Remark: string;
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

export interface BudgetChangeRequestResponse {
    success: boolean;
    message?: string;
    data?: BudgetChangeRequest[];
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
    Remark: string;
    location?: string;
    element?: string;
}

export interface BudgetChangeRequestPayload {
    ProjectId: number;
    DocNo: string;
    RequestDate: string;
    RequestedBy: string;
    Department: string;
    Remark: string;
    TotalAmount: number;
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
    Department: string;
    PersonInCharge: string;
    RecommendationType: string; // Type of recommendation (e.g., "QS_Recommendation", "Site_Recommendation", "Specific_Quantity")
    RecommendedItems: { BudgetChangeItemId: number; RecommendedQty: number }[];
    SpecificQuantity?: number | null;
    Remark?: string | null;
    files?: string[];
}

export interface BCRRecommendationEditPayload {
    RecommendationType: string; // Type of recommendation (e.g., "QS_Recommendation", "Site_Recommendation", "Specific_Quantity")
    SpecificQuantity?: number | null;
    Remark?: string | null;
    files?: string[];
}
export interface RecommendationList {
    Id: number;
    BudgetChangeId: number;
    Department: string;
    ReviewerName: string;
    RecommendationType: string;
    SpecificQuantity: string;
    Remark: string;
    Attachment: string | null;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt: string;
    UpdatedBy: string | null;
}

export interface RecommendationResponse {
    success: boolean;
    message?: string;
    data?: RecommendationList[];
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

export interface DiscussionItem {
    id: number | null;
    role: string;
    name: string;
    datetime: string;
    selectionType: string;
    quantity: number | null;
    message: string;
    documentUrl: { filename: string; path: string }[];
}

export interface BCRFinalDecisionPayload {
    ReviewerName: string;
    Status: string;
    RecommendationType: string; // Type of recommendation (e.g., "QS_Recommendation", "Site_Recommendation", "Specific_Quantity")
    Remark?: string;
}
