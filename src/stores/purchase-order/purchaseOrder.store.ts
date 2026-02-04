import { purchaseService } from '@/services/purchaseOrder.service';
import type { CreatePurchaseOrderPayload, PurchaseOrder, PurchaseOrderResponse, PurchaseOrderView } from '@/types/purchase.type';
import { showError } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const usePurchaseOrderStore = defineStore('purchaseOrder', () => {
    const purchaseOrders = ref<PurchaseOrder[]>([]);
    const selectedPurchaseOrder = ref<PurchaseOrderView | null>(null);
    const loading = ref(false);

    const filters = reactive({
        status: '',
        search: '',
        startDate: '',
        endDate: ''
    });

    const pagination = reactive({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const sortField = ref('CreatedAt');
    const sortOrder = ref<'asc' | 'desc'>('desc');

    const sorting = reactive({
        sortBy: 'CreatedAt',
        sortOrder: 'desc' as 'asc' | 'desc'
    });

    const status = ref<string>(''); // Created, Ongoing, Completed, Cancelled

    const formatDate = (dateString: string | null): string => {
        if (!dateString || dateString === '1970-01-01T00:00:00.000Z') {
            return 'N/A';
        }
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    async function fetchPurchaseOrders() {
        loading.value = true;
        try {
            const params = {
                search: filters.search || undefined,
                status: status.value || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                page: pagination.page,
                pageSize: pagination.pageSize,
                sortBy: sorting.sortBy,
                sortOrder: sorting.sortOrder
            };

            const response: PurchaseOrderResponse = await purchaseService.getPurchaseOrders(params);

            if (!response.success) {
                showError(response.message || 'Failed to fetch purchase orders');
                return;
            }

            purchaseOrders.value = response.data.map((output: any) => {
                const items = output.purchaseorderitems || output.PurchaseOrderItems || [];

                return {
                    ...output,
                    poNumber: output.DocNo,
                    totalAmount: output.TotalAmount || 0,
                    supplierName: output.SupplierId?.toString() || '',
                    status: output.Status,
                    poDate: formatDate(output.PoDate),
                    PurchaseOrderItems: items.map((item: any) => ({
                        ...item,
                        qty: Number(item.Quantity),
                        code: item.ItemCode,
                        description: item.Name,
                        uom: item.Uom || '',
                        price: item.Price || 0,
                        amount: Number(item.Quantity) * (item.Price || 0),
                        deliveryDate: item.DeliveryDate || null,
                        note: item.RoDocNo || '',
                        status: item.Status || 'Pending',
                        totalAmount: item.TotalAmount || 0
                    }))
                };
            });

            if (response.pagination) {
                pagination.total = response.pagination.total;
                pagination.totalPages = response.pagination.totalPages;
                pagination.page = response.pagination.page;
                pagination.pageSize = response.pagination.pageSize;
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                showError(error.message, 'Failed to fetch purchase orders');
            } else {
                showError('An unexpected error occurred', 'Failed to fetch purchase orders');
            }
        } finally {
            loading.value = false;
        }
    }

    async function fetchPurchaseOrderById(id: string): Promise<PurchaseOrderView | null> {
        loading.value = true;
        try {
            const response = await purchaseService.getPurchaseOrderById(id);
            if (!response) {
                showError('Invalid response from server');
                return null;
            }

            const wrappedResponse = response as any;
            const o = wrappedResponse.data as PurchaseOrder;

            const rawItems = o.purchase_order_items ?? o.PurchaseOrderItems ?? o.purchaseorderitems ?? [];

            const mappedItems = rawItems.map((item: any) => ({
                Id: item.Id,
                PurchaseOrderId: item.PurchaseOrderId,
                SoDocNo: item.SoDocNo,
                RoDocNo: item.RoDocNo,
                ItemCode: item.ItemCode,
                Name: item.Name,
                Uom: item.Uom || '',
                Quantity: item.Quantity,
                Price: item.Price || 0,
                Discount: item.Discount ?? 0,
                DeliveryDate: item.DeliveryDate,
                CreatedAt: item.CreatedAt,
                CreatedBy: item.CreatedBy,
                UpdatedAt: item.UpdatedAt,
                UpdatedBy: item.UpdatedBy,

                code: item.ItemCode,
                description: item.Name,
                uom: item.Uom || '',
                qty: Number(item.Quantity),
                price: Number(item.Price) || 0,
                amount: Number(item.Quantity) * (Number(item.Price) || 0),
                deliveryDate: item.DeliveryDate || null,
                note: item.RoDocNo || ''
            }));

            const order: PurchaseOrderView = {
                Id: o.Id,
                SupplierId: o.SupplierId,
                DocNo: o.DocNo,
                Status: o.Status,
                PoDate: o.PoDate,
                TotalAmount: o.TotalAmount || 0,
                GstAmount: o.GstAmount || 0,
                Remark: o.Remark,
                CreatedAt: o.CreatedAt,
                CreatedBy: o.CreatedBy,
                UpdatedAt: o.UpdatedAt,
                UpdatedBy: o.UpdatedBy,

                // Frontend-friendly aliases
                poNumber: o.DocNo,
                poDate: formatDate(o.PoDate),
                items: mappedItems
            };

            selectedPurchaseOrder.value = order;
            return order;
        } catch (error: unknown) {
            if (error instanceof Error) {
                showError(error.message, 'Failed to fetch purchase order details');
            } else {
                showError('An unexpected error occurred', 'Failed to fetch purchase order details');
            }
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function updatePurchaseOrder(id: string, payload: CreatePurchaseOrderPayload, attachments?: File[]) {
        loading.value = true;
        try {
            const response = await purchaseService.updatePurchaseOrder(id, payload, attachments);
            return response;
        } catch (error: unknown) {
            if (error instanceof Error) {
                showError(error.message, 'Failed to update purchase order');
            } else {
                showError('An unexpected error occurred', 'Failed to update purchase order');
            }
            throw error;
        } finally {
            loading.value = false;
        }
    }

    function clearFilters() {
        filters.status = '';
        filters.search = '';
        filters.startDate = '';
        filters.endDate = '';

        sorting.sortBy = 'CreatedAt';
        sorting.sortOrder = 'desc';
        sortField.value = 'CreatedAt';
        sortOrder.value = 'desc';

        pagination.page = 1;
        fetchPurchaseOrders();
    }

    function setPage(page: number) {
        pagination.page = page;
        fetchPurchaseOrders();
    }

    function setPageSize(pageSize: number) {
        pagination.pageSize = pageSize;
        pagination.page = 1;
        fetchPurchaseOrders();
    }

    function handleSearch(value: string) {
        filters.search = value;
        pagination.page = 1;
    }

    function setSorting(sortBy: string, order: 'asc' | 'desc' | '') {
        if (!sortBy || !order) {
            sorting.sortBy = 'CreatedAt';
            sorting.sortOrder = 'desc';
            sortField.value = 'CreatedAt';
            sortOrder.value = 'desc';
        } else {
            sorting.sortBy = sortBy;
            sorting.sortOrder = order;
            sortField.value = sortBy;
            sortOrder.value = order;
        }

        pagination.page = 1;
    }

    function setStatus(value: string) {
        status.value = value;
        pagination.page = 1;
        fetchPurchaseOrders();
    }

    return {
        purchaseOrders,
        selectedPurchaseOrder,
        loading,
        filters,
        pagination,
        sorting,
        sortField,
        sortOrder,
        status,

        fetchPurchaseOrders,
        fetchPurchaseOrderById,
        updatePurchaseOrder,
        setStatus,

        clearFilters,
        setPage,
        setPageSize,
        handleSearch,
        setSorting
    };
});
