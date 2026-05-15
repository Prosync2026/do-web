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
    ProjectName?: string;
    SupplierName?: string;
    supplier?: {
        CompanyName?: string;
    };
    purchase_order?: {
        DocNo?: string;
        supplier?: {
            CompanyName?: string;
        };
    };
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

export interface DeliveryItemSplit {
    _id?: string;
    delivered: number;
    received: number;
    location: string;
    remarks: string;
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
    splits: DeliveryItemSplit[];
    total: number;
    uom: string;
    price: number;
    roDocNo: string;
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
    supplier?: { CompanyName?: string; [key: string]: any };

    items?: PurchaseOrderItem[];
}

export interface Step2VerifyItem {
    purchaseOrderItemId: number;
    requestOrderId: number;
    splits: DeliveryItemSplit[];
}

export interface Step2VerifyItemPayload {
    items: Step2VerifyItem[];
    doNumber?: string;
    deliveryDate?: string;
    driverPlate?: string;
    remarks?: string;
}

export interface Step3DeliveryInfo {
    attachments?: File[];
    attachments2?: File[];
}

export interface DeliveryFlow {
    deliveryInfo: Step3DeliveryInfo;
    selectPO: Step1SelectPO;
    verifyItem: Step2VerifyItemPayload;
}

export interface FormValues {
    driverPlate: string;
    deliveryDate: Date | null;
    doNumber?: string;
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
