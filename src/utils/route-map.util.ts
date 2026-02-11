export type DocumentType = 'RO' | 'BCR' | 'DO' | 'PO';

export const DOCUMENT_ROUTE_MAP: Record<DocumentType, string> = {
    RO: '/request-orders',
    BCR: '/budget-change-requests',
    DO: '/delivery-orders',
    PO: '/purchase-orders'
};

export function getRouteByDocumentType(type?: string): string | null {
    if (!type) return null;
    return DOCUMENT_ROUTE_MAP[type as DocumentType] || null;
}
