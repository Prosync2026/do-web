export interface Item {
    itemCode: string;
    itemType: string;
    description: string;
    location: string;
    location1?: string;
    location2?: string;
    uom: string;
    qty: number;
    price?: number;
    deliveryDate: string | Date | null;
    notes?: string;
    remark?: string;
    showNotes?: boolean;
    showRemark?: boolean;
    isBudgeted: boolean;
    budgetItemId?: number | null;
    nonBudgetItemId?: number | null;
    StockItemId?: number | null;
    stockItemId?: number;
}

export interface ItemOption {
    label: string;
    value: string;
    description: string;
    location: string;
    uom: string;
}

export interface BudgetOption {
    label: string;
    value: string;
}

export interface BudgetItem {
    id: number;
    itemCode: string;
    description: string;
    location: string;
    location1?: string;
    location2?: string;
    category: string;
    element: string;
    itemType: string;
    uom: string;
    qty: number;
    price: number;
    rate?: number;
    deliveryDate?: string | null;
}

export interface FilterOption {
    label: string;
    value: string;
    category?: string;
    element?: string;
    subElement?: string;
}

export interface OrderItem {
    code: string;
    description: string;
    uom: string;
    qty: number;
    deliveryDate: string | Date | null;
    note: string;
    notes?: string;
    budgetItemId?: number | null;
    nonBudgetItemId?: number | null;
    remark?: string;
    reason?: string;
    rate?: number;
}

export interface RequestOrderItemDetail {
    Id: number;
    RequestOrderId: number;
    BudgetItemId: number | null;
    NonBudgetItemId: number | null;
    Description: string;
    Unit: string;
    Quantity: number | string;
    Notes?: string | null;
    Remark?: string | null;
    DeliveryDate: string | Date | null;
    ItemCode: string;
    ItemType: string;
}

export interface Order {
    id: number;
    roNumber: string;
    requestedBy: string;
    location?: string;
    roDate: string;
    deliveryDate: string | Date | null;
    totalAmount: string;
    budgetType: string;
    status: 'Approved' | 'Processing' | 'Rejected' | 'Submitted';
    requestedAt: string;
    items: OrderItem[];
    RequestOrderItems?: RequestOrderItemDetail[];
    debtorId?: number;
    remark?: string;
    terms?: string;
    refDoc?: string;
    currency?: string;
    attachments?: AttachmentItem[];
    isUrgent?: boolean;
    // approval
    currentApprovalStage?: 'PM' | 'PD' | 'PURC' | 'PURCH';
    approvalFlowType?: 'HIGH_VALUE' | 'NORMAL';
    approvalProgress?: {
        level: 'PM' | 'PD' | 'PURC' | 'PURCH';
        status: 'Approved' | 'Rejected' | 'Pending';
    }[];
}

export interface PreviewItem {
    itemCode: string;
    itemType?: string;
    description: string;
    uom: string;
    qty: string | number;
    price: number;
    deliveryDate: Date | null;
    location: string;
    notes?: string;
    remark?: string;
}

export interface PreviewSummary {
    totalItems: number;
    totalAmount: number;
    budgetType: string;
    project: string;
    roDate: string;
    globalDeliveryDate: string;
    roNumber: string;
    requestedBy: string;
    items: PreviewItem[];
    overallRemark?: string;
    attachmentsCount: number;
    remark?: string;
    reason?: string;
    subcon?: string;
}

export interface CreateRequestOrderItem {
    BudgetItemId: number | null;
    NonBudgetItemId: number | null;
    StockItemId: number | null;
    Description: string;
    Uom: string;
    Quantity: number;
    OrgBgtQty: number;
    BgtBalQty: number;
    TotalPOQty: number;
    Rate?: number;
    Notes: string;
    Reason: string;
    DeliveryDate: string | null;
    ItemCode: string;
    ItemType: string;
    Note?: string;
}

export interface CreateRequestOrderPayload {
    ProjectId?: number;
    DocNo: string;
    DebtorId: number;
    TotalAmount: number;
    CreatedBy: string;
    RequestOrderDate: string;
    Terms: string;
    RefDoc: string;
    Status: 'Approved' | 'Processing' | 'Rejected' | 'Submitted';
    BudgetType: 'Budgeted' | 'NonBudgeted';
    Type: string;
    Remark: string;
    Reason?: string;
    Currency: string;
    Items: CreateRequestOrderItem[];
    PrType?: string;
    Attachment?: string | null;
    request_order_items?: RequestOrderItemResponse[];
    Location1?: string;
    Location2?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface CreateRequestOrderResponse {
    success: boolean;
    data?: CreateRequestOrderPayload;
    message?: string;
}

export interface EditFormItem {
    code?: string;
    budgetItemId?: number | null;
    nonBudgetItemId?: number | null;
    description: string;
    uom: string;
    qty: number;
    deliveryDate: string | Date | null;
    notes?: string;
    remark?: string;
    reason?: string;
    rate?: number;
}

export interface EditForm {
    roNumber: string;
    requestedBy: string;
    roDate: Date | null;
    deliveryDate: Date | null;
    totalAmount: number;
    budgetType: string;
    remark?: string;
    terms?: string;
    refDoc?: string;
    currency?: string;
    items: EditFormItem[];
    attachments: (File | AttachmentItem)[];
}

export interface DraftRO {
    id: number;
    draftId: string;
    project: string;
    budgetType: string;
    requestedBy: string;
    itemsCount: number;
    lastModified: string;
    roNumber: string;
    roDate: string;
    items: Item[];
    overallRemark?: string;
    attachments?: File[];
}

// Attachment interface
export interface AttachmentItem {
    filename: string;
    path: string;
    size?: number;
    type?: string;
}

export interface RequestOrdersCounts {
    pending: number;
    approved: number;
    rejected: number;
    totalValue: number;
}

export interface PaginationInfo {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export interface GetRequestOrdersResponse {
    success: boolean;
    data: CreateRequestOrderPayload[];
    pagination: PaginationInfo;
    counts?: RequestOrdersCounts;
}

export interface GetRequestOrdersParams {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    budgetType?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Define the API response types
export interface RequestOrderItemResponse {
    Id: number;
    BudgetItemId: number | null;
    NonBudgetItemId: number | null;
    ItemCode: string;
    ItemType: string;
    Description: string;
    Location: string;
    Unit?: string;
    Uom?: string;
    Quantity: number | string;
    DeliveryDate: string | Date | null;
    Notes?: string;
    Remark?: string;
    Reason?: string;
    Location1?: string;
    Location2?: string;
    Rate?: number;
    request_order_items?: RequestOrderItemResponse[];
}

export interface RequestOrderResponse {
    Id: number;
    DocNo: string;
    CreatedBy: string;
    RequestOrderDate: string | Date;
    TotalAmount: number | string;
    PrType: string;
    Status: 'Approved' | 'Processing' | 'Rejected' | 'Submitted';
    CreatedAt: string | Date;
    DebtorId?: number | null;
    Remark?: string | null;
    Terms?: string | null;
    RefDoc?: string | null;
    Currency?: string | null;
    Attachment?: string | null;
    RequestOrderItems?: RequestOrderItemResponse[];
    request_order_items?: RequestOrderItemResponse[];
    approvalProgress?: ApprovalProgress[];
    approvalFlowType?: 'NORMAL' | 'HIGH_VALUE';
    CurrentApprovalStage?: string;
}

export interface UpdateRequestOrderPayload {
    DocNo: string;
    DebtorId: number;
    TotalAmount: number;
    RequestOrderDate: string;
    Terms: string;
    RefDoc: string;
    Status: 'Approved' | 'Processing' | 'Rejected' | 'Submitted';
    BudgetType: 'Budgeted' | 'NonBudgeted';
    Type: string;
    Remark: string;
    Currency: string;
    Items: Array<{
        BudgetItemId: number | null;
        NonBudgetItemId: number | null;
        Description: string;
        Uom: string;
        Quantity: number;
        Notes: string;
        Reason: string;
        DeliveryDate: string;
        ItemCode: string;
        ItemType: string;
    }>;
}

// Define the type for parsed attachments
export interface DraftAttachment {
    filename: string;
    path: string;
    size?: number;
    type?: string;
}

// filtering
export interface RequestOrdersFilters {
    status?: string;
    budgetType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

// action type
export type ActionType = 'view' | 'edit' | 'delete' | 'approve' | 'reject';

// approval type
export interface ApprovalProgress {
    code: string;
    label: string;
    order: number;
    status: 'Pending' | 'Approved' | 'Rejected';
}
