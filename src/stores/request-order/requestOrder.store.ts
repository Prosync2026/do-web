import { requestOrderService } from '@/services/requestOrder.service';
import type { AttachmentItem, CreateRequestOrderPayload, GetRequestOrdersResponse, Order, OrderItem, RequestOrderItemResponse, RequestOrderResponse } from '@/types/request-order.type';
import { formatDate, formatDateTime } from '@/utils/dateHelper';
import { showError } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useRequestOrderStore = defineStore('requestOrder', () => {
    const orders = ref<Order[]>([]);
    const selectedOrder = ref<Order | null>(null);
    const loading = ref(false);

    const sortField = ref('CreatedAt');
    const sortOrder = ref<'asc' | 'desc'>('desc');

    const filters = reactive({
        status: '',
        budgetType: '',
        search: '',
        startDate: '',
        endDate: ''
    });

    const sorting = reactive({
        sortBy: 'CreatedAt',
        sortOrder: 'desc' as 'asc' | 'desc'
    });

    const pagination = reactive({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const totalCounts = ref({
        pending: 0,
        approved: 0,
        rejected: 0,
        totalValue: 0
    });

    async function fetchOrders() {
        loading.value = true;
        try {
            const params = {
                status: filters.status || undefined,
                budgetType: filters.budgetType || undefined,
                search: filters.search || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                page: pagination.page,
                pageSize: pagination.pageSize,
                sortBy: sorting.sortBy,
                sortOrder: sorting.sortOrder
            };

            const response: GetRequestOrdersResponse = await requestOrderService.getRequestOrders(params);

            orders.value = response.data.map((output): Order => {
                const apiOutput = output as unknown as RequestOrderResponse;

                return {
                    id: apiOutput.Id,
                    roNumber: apiOutput.DocNo,
                    requestedBy: apiOutput.CreatedBy,
                    roDate: formatDate(apiOutput.RequestOrderDate),
                    deliveryDate: formatDate(apiOutput.RequestOrderItems?.[0]?.DeliveryDate || ''),
                    totalAmount: String(apiOutput.TotalAmount),
                    budgetType: apiOutput.PrType,
                    status: apiOutput.Status,
                    requestedAt: formatDateTime(apiOutput.CreatedAt),

                    approvalProgress: apiOutput.approvalProgress || [],
                    approvalFlowType: apiOutput.approvalFlowType,
                    currentApprovalStage: apiOutput.CurrentApprovalStage,

                    items: (apiOutput.RequestOrderItems || []).map(
                        (item): OrderItem => ({
                            code: String(item.BudgetItemId || item.NonBudgetItemId || ''),
                            description: item.Description,
                            uom: item.Uom || item.Unit || '',
                            qty: Number(item.Quantity),
                            deliveryDate: formatDate(item.DeliveryDate),
                            note: item.Notes || '',
                            notes: item.Notes,
                            budgetItemId: item.BudgetItemId,
                            nonBudgetItemId: item.NonBudgetItemId,
                            remark: item.Remark
                        })
                    )
                };
            });

            if (response.pagination) {
                pagination.total = response.pagination.total;
                pagination.totalPages = response.pagination.totalPages;
                pagination.page = response.pagination.page;
                pagination.pageSize = response.pagination.pageSize;
            }

            totalCounts.value = response.counts || {
                pending: 0,
                approved: 0,
                rejected: 0,
                totalValue: 0
            };
        } catch (error) {
            showError(error, 'Failed to fetch request orders');
        } finally {
            loading.value = false;
        }
    }

    async function fetchOrderById(id: string): Promise<Order | null> {
        loading.value = true;
        try {
            const response = await requestOrderService.getRequestOrderById(id);
            if (!response) return null;

            const o = response.data as unknown as RequestOrderResponse;

            let parsedAttachments: AttachmentItem[] = [];
            if (o.Attachment) {
                try {
                    parsedAttachments = JSON.parse(o.Attachment) as AttachmentItem[];
                } catch (error) {
                    console.error('Failed to parse attachments:', error);
                    parsedAttachments = [];
                }
            }

            const order: Order = {
                id: o.Id,
                roNumber: o.DocNo,
                requestedBy: o.CreatedBy,
                status: o.Status,
                roDate: formatDate(o.RequestOrderDate),
                deliveryDate: formatDate(o.request_order_items?.[0]?.DeliveryDate || o.RequestOrderItems?.[0]?.DeliveryDate),
                totalAmount: String(o.TotalAmount),
                requestedAt: formatDateTime(o.CreatedAt),
                items: ((o.request_order_items ?? o.RequestOrderItems ?? []) as RequestOrderItemResponse[]).map((item) => ({
                    code: item.ItemCode || '',
                    description: item.Description,
                    location: item.Location,
                    uom: item.Unit || item.Uom || '',
                    qty: Number(item.Quantity),
                    deliveryDate: formatDate(item.DeliveryDate),
                    note: item.Notes || '',
                    notes: item.Notes,
                    remark: item.Remark,
                    budgetItemId: item.BudgetItemId ?? null,
                    nonBudgetItemId: item.NonBudgetItemId ?? null,
                    reason: item.Reason,
                    rate: item.Rate
                })),

                debtorId: o.DebtorId ?? undefined,
                remark: o.Remark ?? '',
                terms: o.Terms ?? 'Net 30',
                refDoc: o.RefDoc ?? 'RQ-001',
                currency: o.Currency ?? 'MYR',
                attachments: parsedAttachments,
                budgetType: o.PrType === 'Budgeted' ? 'Budgeted' : 'NonBudgeted'
            };

            selectedOrder.value = order;
            return order;
        } catch (error) {
            showError(error, 'Failed to fetch request order details');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function updateOrder(
        id: string,
        payload: CreateRequestOrderPayload, // Changed from UpdateRequestOrderPayload
        attachments?: File[]
    ) {
        loading.value = true;
        try {
            const response = await requestOrderService.updateRequestOrder(id, payload, attachments);
            return response;
        } catch (error) {
            showError(error, 'Failed to update request order');
            throw error;
        } finally {
            loading.value = false;
        }
    }

    function clearFilters() {
        filters.status = '';
        filters.budgetType = '';
        filters.search = '';
        filters.startDate = '';
        filters.endDate = '';
        pagination.page = 1;
        fetchOrders();
    }

    function setPage(page: number) {
        pagination.page = page;
        fetchOrders();
    }

    function setPageSize(pageSize: number) {
        pagination.pageSize = pageSize;
        pagination.page = 1; // Reset to first page when changing page size
        fetchOrders();
    }

    function handleSearch(value: string) {
        filters.search = value;
        pagination.page = 1;
        fetchOrders();
    }

    function handleStatusChange(status: string) {
        filters.status = status;
        pagination.page = 1;
        fetchOrders();
    }

    function setSorting(sortBy: string, order: 'desc' | 'asc' | '') {
        // Handle reset - use default sorting
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
        fetchOrders();
    }

    return {
        orders,
        selectedOrder,
        loading,
        filters,
        pagination,
        totalCounts,
        sorting,
        fetchOrders,
        fetchOrderById,
        clearFilters,
        updateOrder,
        setPage,
        setPageSize,
        handleSearch,
        handleStatusChange,
        setSorting,
        sortField,
        sortOrder
    };
});
