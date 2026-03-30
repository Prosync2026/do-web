/**
 * Smart Scan Service — calls the AI extract-pdf endpoint.
 *
 * Token is hardcoded for now; can be moved to user settings (DB) later.
 * Only SSA role should be able to change it from the admin panel.
 */

// In dev: proxied through Vite (/ai-api → https://ai-api-dev.qubit-it.com.my/api) to bypass CORS.
// In production: route through backend instead.
const SMART_SCAN_API_URL = '/ai-api/extract-pdf';

// TODO: move to DB / user settings (SSA-managed)
const SMART_SCAN_TOKEN = 'rcp_220PbLHcagDht8COyx0Sg_adC5rTXSfR6zONZib2FpCqm0CVuMz-TtIK-55xdHda';

export interface SmartScanItem {
    itemCode: string;
    description: string;
    qty: number;
    uom: string;
    remarks: string;
}

export interface SmartScanResult {
    soNo: string;
    doNo: string;
    supplierName: string;
    deliveryDate: string;
    plateNo: string;
    items: SmartScanItem[];
}

/**
 * Parse a delivery order object from the AI API response.
 *
 * Actual structure (from real API):
 * {
 *   header: { do_number, po_number, so_or_invoice_number, date, company_name, customer_name },
 *   vehicle: { plate_no, ... } | null | string,
 *   materials: [{ item_code, description, quantity, unit, remarks }],
 *   delivery: { ... }
 * }
 */
function parseDeliveryOrder(raw: any): SmartScanResult {
    const header = raw.header ?? {};

    // SO number: prefer so_or_invoice_number, fall back to po_number / reference_number
    const soNo =
        header.so_or_invoice_number ??
        header.so_number ??
        header.po_number ??
        header.reference_number ??
        raw.so_number ??
        raw.so_no ??
        '';

    // DO number
    const doNo =
        header.do_number ??
        raw.do_number ??
        raw.delivery_order_number ??
        '';

    // Supplier / company
    const supplierName =
        header.company_name ??
        header.supplier_name ??
        raw.supplier_name ??
        raw.supplier ??
        '';

    // Delivery date — trim to date portion only
    const rawDate: string =
        header.date ??
        raw.delivery_date ??
        raw.date ??
        '';
    const deliveryDate = rawDate ? rawDate.split('T')[0] : '';

    // Lorry / vehicle plate
    const vehicle = raw.vehicle ?? {};
    const plateNo =
        (typeof vehicle === 'string' ? vehicle : null) ??
        vehicle?.vehicle_number ??
        vehicle?.plate_no ??
        vehicle?.plate_number ??
        vehicle?.vehicle_no ??
        vehicle?.lorry_plate ??
        '';

    // Line items 
    const rawItems: any[] =
        raw.materials ??
        raw.items ??
        raw.line_items ??
        raw.delivery_items ??
        [];

    const items: SmartScanItem[] = rawItems.map((i: any) => ({
        itemCode: i.item_code ?? i.itemCode ?? i.code ?? '',
        description: i.description ?? i.name ?? i.item_name ?? '',
        qty: Number(i.quantity ?? i.qty ?? i.amount ?? 0),
        uom: i.unit ?? i.uom ?? i.uom_code ?? '',
        remarks: i.remarks ?? i.remark ?? i.note ?? ''
    }));

    return { soNo, doNo, supplierName, deliveryDate, plateNo, items };
}

export async function extractDeliveryOrder(file: File): Promise<SmartScanResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'delivery_order');
    formData.append('model_name', 'gpt-5-mini');
    formData.append('temperature', '0');
    formData.append('dpi', '200');

    let response: Response;
    try {
        response = await fetch(SMART_SCAN_API_URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${SMART_SCAN_TOKEN}`
            },
            body: formData
        });
    } catch (networkErr: any) {
        // Likely a CORS or network error
        throw new Error(`Network error - could not reach AI API: ${networkErr?.message ?? networkErr}`);
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Top-level: { delivery_orders: [...], receipts: [], ... }
    const orders: any[] = data.delivery_orders ?? data.results ?? data.data ?? [];

    if (Array.isArray(orders) && orders.length > 0) {
        return parseDeliveryOrder(orders[0]);
    }

    // Fallback: top-level IS the delivery order 
    if (data.header || data.materials || data.items) {
        return parseDeliveryOrder(data);
    }

    throw new Error('No delivery order data found in the AI response.');
}
