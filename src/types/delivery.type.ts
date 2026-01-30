export interface DeliveryOrderItem {
    Id: number;
    DeliveryOrderId: number;
    PurchaseOrderItemId: number;
    ItemCode: string;
    Name: string;
    Uom: string;
    Quantity: string;
    DeliveryDate: string | null;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt?: string | null;
    UpdatedBy?: string | null;
}

export interface DeliveryOrder {
    Id: number;
    PurchaseOrderId: number;
    DocNo: string;
    Date: string;
    TotalAmount?: number | null;
    GstAmount?: number | null;
    Terms?: string | null;
    RefDoc?: string | null;
    Posting?: string | null;
    Currency?: string | null;
    Gst?: string | null;
    PlateNo?: string | null;
    Remark?: string | null;
    Attachment?: string | null;
    Attachment2?: string | null;
    Status: 'Pending' | 'Completed' | string;
    CreatedAt: string;
    CreatedBy: string;
    UpdatedAt?: string | null;
    UpdatedBy?: string | null;
    ProjectId: number;
    // BE return lowercase
    deliveryorderitems?: DeliveryOrderItem[];

    // optional: keep both casing for safety
    DeliveryOrderItems?: DeliveryOrderItem[];
    delivery_order_items?: DeliveryOrderItem[];
}

export interface Pagination {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export interface DeliveryOrderResponse {
    success: boolean;
    message: string;
    data: DeliveryOrder[];
    pagination?: Pagination;
}

export interface SingleDeliveryOrderResponse {
    success: boolean;
    message: string;
    data: DeliveryOrder;
}

export interface VerifyPurchaseOrderItem {
    id: number;
    name: string;
    order: string;
    status: string;
    location: string;
    purchaseOrderId: number;
    requestOrderId: number;
    category: string;
    type: string;
    delivered: number;
    total: number;
}

export interface PurchaseOrderItem {
    id: number;
    itemCode: string;
    name: string;
    quantity: number;
    uom: string;
    price?: number;
    [key: string]: unknown;
}

export interface Step1SelectPO {
    id: number;
    DocNo: string;
    poNumber?: string;
    purchaseOrderId: number;
    PurchaseOrderItems: PurchaseOrderItem[];

    items?: PurchaseOrderItem[];
}

export interface Step2VerifyItem {
    purchaseOrderItemId: number;
    requestOrderId: number;
    quantity: number;
}

export interface Step3DeliveryInfo {
    PlateNo: string;
    Date: string;
    Remarks?: string;
    attachments?: File[];
    attachments2?: File[];
}

export interface DeliveryFlow {
    deliveryInfo: Step3DeliveryInfo;
    selectPO: Step1SelectPO;
    verifyItem: Step2VerifyItem[];
}

export interface FormValues {
    driverPlate: string;
    deliveryDate: Date | null;
    remarks?: string;
}

export interface UploadFile {
    name: string;
    size: number;
    type?: string;
    raw: File;
    preview?: string;
}

export interface PurchaseOrderCard {
    id: string;
    title: string;
    content: string;
    badges: string[];
    icon: string;
}
