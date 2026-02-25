import { budgetService } from '@/services/budget.service';
import { Budget, BudgetItem, BudgetVersion, GetBudgetItemsParams, Pagination } from '@/types/newBudget.type';
import { getCurrentProjectId } from '@/utils/contextHelper';
import { formatDate } from '@/utils/dateHelper';
import { showError } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const mapPagination = (p: any): Pagination => ({
    total: p?.total ?? p?.totalBudgetItems ?? 0,
    totalPages: p?.totalPages ?? 1,
    page: p?.page ?? 1,
    pageSize: 10 //set as default 10
});

export const useBudgetStore = defineStore('budget', () => {
    const budgets = ref<Budget[]>([]);
    const budgetItems = ref<BudgetItem[]>([]);
    const pagination = ref<Pagination>({ total: 0, totalPages: 1, page: 1, pageSize: 10 });
    const loading = ref(false);

    const sortField = ref('CreatedAt');
    const sortOrder = ref<'asc' | 'desc'>('desc');

    const sorting = ref({
        sortBy: 'CreatedAt',
        sortOrder: 'desc' as 'asc' | 'desc'
    });

    const applyPagination = (p: any) => {
        const mapped = mapPagination(p);

        pagination.value.total = mapped.total;
        pagination.value.totalPages = mapped.totalPages;
        pagination.value.page = mapped.page;
        pagination.value.pageSize = mapped.pageSize;
    };

    async function fetchBudgetVersion(): Promise<BudgetVersion[]> {
        loading.value = true;
        try {
            const response = await budgetService.getBudgetVersion({ projectId: getCurrentProjectId() });
            if (!response.success) return [];
            return response.data.map((v: any) => ({
                id: v.Id,
                versionCode: v.VersionCode,
                name: v.BudgetName,
                createdAt: formatDate(v.CreatedAt)
            }));
        } catch (error) {
            showError(error, 'Failed to fetch budget versions.');
            return [];
        } finally {
            loading.value = false;
        }
    }

    async function fetchBudgets(version = 1, page = pagination.value.page, pageSize = pagination.value.pageSize) {
        loading.value = true;
        try {
            const response = await budgetService.getBudgets({
                projectId: getCurrentProjectId(),
                version,
                page,
                pageSize
            });

            budgets.value = response.data.map((b: any) => ({
                id: b.Id,
                name: b.BudgetName,
                docNo: b.DocNo,
                totalAmount: b.TotalAmount,
                status: b.Status,
                date: formatDate(b.Date),
                createdBy: b.CreatedBy,
                createdAt: formatDate(b.CreatedAt),
                items: b.budgetitems || []
            }));

            applyPagination(response.pagination);
        } catch (error) {
            showError(error, 'Failed to fetch budgets.');
        } finally {
            loading.value = false;
        }
    }

    async function fetchBudgetItems(filters: GetBudgetItemsParams) {
        loading.value = true;

        try {
            // Build query params object - only include defined values
            const queryParams: GetBudgetItemsParams = {
                projectId: getCurrentProjectId(),
                budgetId: filters.budgetId,
                page: filters.page ?? pagination.value.page,
                pageSize: filters.pageSize ?? 10,
                sortBy: sorting.value.sortBy,
                sortOrder: sorting.value.sortOrder
            };

            // Add optional filters only if they have values
            if (filters.search) queryParams.search = filters.search;
            if (filters.category) queryParams.category = filters.category;
            if (filters.element) queryParams.element = filters.element;
            if (filters.subElement) queryParams.subElement = filters.subElement;
            if (filters.location1) queryParams.location1 = filters.location1;
            if (filters.location2) queryParams.location2 = filters.location2;
            if (filters.itemCode) queryParams.itemCode = filters.itemCode;
            if (filters.status) queryParams.status = filters.status;

            const response = await budgetService.getBudgetItems(queryParams);

            if (!response.success || !response.data) {
                budgetItems.value = [];
                return;
            }

            // Map response data to BudgetItem format
            const mappedItems: any[] = response.data.map((item: any, index: number) => {
                const stats = item.statistics || {};

                // statistics
                const budgetQty = Number(stats.budgetQty ?? item.Quantity ?? 0);
                const totalOrderedQty = Number(stats.totalOrderedQty ?? 0);
                const totalRequestedQty = Number(stats.totalRequestedQty ?? 0);
                const totalDeliveredQty = Number(stats.totalDeliveredQty ?? 0);

                return {
                    id: item.Id,
                    budgetId: item.BudgetId,
                    itemCode: item.ItemCode,
                    itemType: item.ItemType || '',
                    itemClass: item.ItemClass || '',
                    description: item.Description,
                    description2: item.Description2,
                    location: `${item.Location1}${item.Location2 ? ' > ' + item.Location2 : ''}`,
                    location1: item.Location1,
                    location2: item.Location2,
                    category: item.Category,
                    element: `${item.Category} > ${item.Element} > ${item.SubElement}`,
                    elementCode: item.Element,
                    subElement: item.SubElement,
                    subSubElement: item.SubSubElement,
                    uom: item.Unit,
                    qty: Number(item.Quantity),
                    price: Number(item.Rate),
                    total: Number(item.Quantity) * Number(item.Rate),
                    unit: item.Unit,
                    remark: item.Remark,
                    rate: Number(item.Rate) || 0,
                    amount: (Number(item.Quantity) || 0) * (Number(item.Rate) || 0),
                    wastage: Number(item.Wastage) || 0,
                    status: item.Status,
                    createdAt: formatDate(item.CreatedAt),
                    createdBy: item.CreatedBy,
                    updatedAt: item.UpdatedAt ? formatDate(item.UpdatedAt) : null,
                    updatedBy: item.UpdatedBy,

                    // statistics
                    budgetQty,
                    totalOrderedQty,
                    totalRequestedQty,
                    totalDeliveredQty,

                    totalRemainingQty: budgetQty - totalOrderedQty,
                    totalRemainingToDeliverQty: totalOrderedQty - totalDeliveredQty,

                    // utilization
                    utilizationRequested: budgetQty > 0 ? (totalRequestedQty / budgetQty) * 100 : 0,

                    utilizationOrdered: budgetQty > 0 ? (totalOrderedQty / budgetQty) * 100 : 0,

                    utilizationDelivered: budgetQty > 0 ? (totalDeliveredQty / budgetQty) * 100 : 0,

                    // Add rowIndex here in the store to prevent computed mutation
                    rowIndex: ((queryParams.page ?? 1) - 1) * (queryParams.pageSize ?? 10) + index + 1
                };
            });

            budgetItems.value = mappedItems;
            applyPagination(response.pagination);
        } catch (error) {
            console.error('Budget items fetch error:', error);
            showError(error, 'Failed to fetch budget items.');
            budgetItems.value = [];
        } finally {
            loading.value = false;
        }
    }

    async function fetchHierarchyBudgetItems(budgetId: number, page = pagination.value.page, pageSize = pagination.value.pageSize) {
        loading.value = true;
        try {
            const response = await budgetService.getHierarchyBudgetItem({ budgetId, page, pageSize });

            return response;
        } catch (error) {
            showError(error, 'Failed to fetch hierarchy budget items.');
        } finally {
            loading.value = false;
        }
    }

    async function fetchHierarchyBudgetLocation(budgetId: number, page = pagination.value.page, pageSize = pagination.value.pageSize) {
        loading.value = true;
        try {
            const response = await budgetService.getHierarchyBudgetLocation({ budgetId, page, pageSize });

            return response;
        } catch (error) {
            showError(error, 'Failed to fetch hierarchy budget items.');
        } finally {
            loading.value = false;
        }
    }

    function setSorting(sortBy: string, order: 'asc' | 'desc' | '') {
        if (!sortBy || !order) {
            sorting.value.sortBy = 'CreatedAt';
            sorting.value.sortOrder = 'desc';
            sortField.value = 'CreatedAt';
            sortOrder.value = 'desc';
        } else {
            sorting.value.sortBy = sortBy;
            sorting.value.sortOrder = order;
            sortField.value = sortBy;
            sortOrder.value = order;
        }

        pagination.value.page = 1;
    }

    return { budgets, budgetItems, pagination, loading, fetchBudgets, fetchBudgetItems, fetchBudgetVersion, fetchHierarchyBudgetItems, fetchHierarchyBudgetLocation, sorting, sortField, sortOrder, setSorting };
});
