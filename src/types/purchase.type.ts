export interface PurchaseOrderItem {
    Id: number;
    PurchaseOrderId: number;
    SoDocNo?: string;
    RoDocNo?: string;
    ItemCode: string;
    Name: string;
    Uom?: string;
    Quantity: string | number;
    Price?: number;
    Discount?: number;
    DeliveryDate?: string;
    CreatedAt?: string;
    CreatedBy?: string;
    UpdatedAt?: string | null;
    UpdatedBy?: string | null;
    requestOrderId?: number | null;

    // Frontend-friendly aliases
    id?: number;
    code?: string;
    description?: string;
    qty?: number;
    purchaseorderitems?: PurchaseOrderItem[];
    status?: string;
}

export interface PurchaseOrder {
    Id: number;
    SupplierId: number;
    DocNo: string;
    Status: string;
    PoDate: string;
    TotalAmount?: number | null;
    GstAmount?: number | null;
    Remark?: string | null;
    CreatedAt?: string;
    CreatedBy?: string;
    UpdatedAt?: string | null;
    UpdatedBy?: string | null;
    PurchaseOrderItems: PurchaseOrderItem[];
    purchaseorderitems?: PurchaseOrderItem[];
    purchase_order_items?: PurchaseOrderItem[];

    // Frontend-friendly aliases
    id?: number;
    poNumber?: string;
    poDate?: string;
    items?: PurchaseOrderItem[];
}

export interface PurchaseOrderResponse {
    success: boolean;
    data: PurchaseOrder[];
    pagination: Pagination;
    message?: string;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface CreatePurchaseOrderPayload {
    DocNo?: string;
    PoDate: string;
    Remark?: string;
    PurchaseOrderItems: {
        ItemCode: string;
        Name: string;
        Uom?: string;
        Quantity: number | string;
        Price?: number;
        Discount?: number;
        DeliveryDate?: string;
    }[];
}

export interface CreatePurchaseOrderResponse {
    success: boolean;
    data?: PurchaseOrder;
    message?: string;
}

export interface GetPurchaseOrderParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
}

export interface PurchaseOrderWithStatus extends PurchaseOrder {
    poNumber: string;
    supplier: string;
    totalAmount: number;
    status: string;
}

export interface PurchaseOrderItemView extends PurchaseOrderItem {
    code: string;
    description: string;
    uom: string;
    qty: number;
    price: number;
    amount: number;
    deliveryDate: string | null;
    note: string;
}

export interface PurchaseOrderView extends Omit<PurchaseOrder, 'PurchaseOrderItems' | 'purchaseorderitems'> {
    poNumber: string; // frontend convenience alias for DocNo
    poDate: string; // frontend convenience alias for PoDate
    items: PurchaseOrderItemView[];
}
