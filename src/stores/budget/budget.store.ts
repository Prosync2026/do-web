import { budgetService } from '@/services/budget.service';
import { Budget, BudgetItem, BudgetVersion, Pagination } from '@/types/newBudget.type';
import { getCurrentProjectId } from '@/utils/contextHelper';
import { formatDate } from '@/utils/dateHelper';
import { showError } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const mapPagination = (p: any): Pagination => ({
    total: p?.total ?? p?.totalBudgetItems ?? 0,
    totalPages: p?.totalPages ?? 1,
    page: p?.page ?? 1,
    pageSize: p?.pageSize ?? 10
});

export const useBudgetStore = defineStore('budget', () => {
    const budgets = ref<Budget[]>([]);
    const budgetItems = ref<BudgetItem[]>([]);
    const pagination = ref<Pagination>({ total: 0, totalPages: 0, page: 1, pageSize: 10 });
    const loading = ref(false);

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
            const response = await budgetService.getBudgets({ projectId: getCurrentProjectId(), version, page, pageSize });
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
            pagination.value = mapPagination(response.pagination);
        } catch (error) {
            showError(error, 'Failed to fetch budgets.');
        } finally {
            loading.value = false;
        }
    }

    async function fetchBudgetItems(budgetId: number, page = pagination.value.page, pageSize = pagination.value.pageSize) {
        loading.value = true;
        try {
            const response = await budgetService.getBudgetItems({ projectId: getCurrentProjectId(), budgetId, page, pageSize });
            budgetItems.value = response.data.map((item: any, index: number) => {
                const statistics = item.statistics || {};
                const utilization = statistics.utilization || {};

                return {
                    id: item.Id,
                    budgetId: item.BudgetId,
                    itemCode: item.ItemCode,
                    itemType: item.ItemType,
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
                    rate: Number(item.Rate) || 0,
                    amount: (Number(item.Quantity) || 0) * (Number(item.Rate) || 0),
                    status: item.Status,
                    createdAt: formatDate(item.CreatedAt),
                    updatedAt: formatDate(item.UpdatedAt),
                    rowIndex: (page - 1) * pageSize + index + 1,
                    budget: item.budget || null,
                    statistics: {
                        budgetItemId: statistics.budgetItemId ?? null,
                        budgetId: statistics.budgetId ?? null,
                        itemCode: statistics.itemCode ?? null,
                        description: statistics.description ?? null,
                        unit: statistics.unit ?? null,
                        budgetQty: statistics.budgetQty ?? 0,
                        budgetAmount: statistics.budgetAmount ?? 0,
                        totalRequested: statistics.totalRequested ?? 0,
                        totalOrdered: statistics.totalOrdered ?? 0,
                        totalDelivered: statistics.totalDelivered ?? 0,
                        totalBalance: statistics.totalBalance ?? 0,
                        totalRequestedQty: statistics.totalRequestedQty ?? 0,
                        totalOrderedQty: statistics.totalOrderedQty ?? 0,
                        totalDeliveredQty: statistics.totalDeliveredQty ?? 0,
                        utilization: {
                            requestedPercent: utilization.requestedPercent ?? 0,
                            orderedPercent: utilization.orderedPercent ?? 0,
                            deliveredPercent: utilization.deliveredPercent ?? 0
                        }
                    }
                };
            });

            pagination.value = mapPagination(response.pagination);
        } catch (error) {
            showError(error, 'Failed to fetch budget items.');
        } finally {
            loading.value = false;
        }
    }

    return { budgets, budgetItems, pagination, loading, fetchBudgets, fetchBudgetItems, fetchBudgetVersion };
});
