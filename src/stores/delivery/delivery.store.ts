import { deliveryOrderService } from '@/services/deliveryOrder.service';
import type { DeliveryOrder } from '@/types/delivery.type';
import { showError, showSuccess } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useDeliveryStore = defineStore('deliveryStore', () => {
    // ------------------------------
    // STATE
    // ------------------------------
    const loading = ref(false);
    const incompletedList = ref<DeliveryOrder[]>([]);
    const completedList = ref<DeliveryOrder[]>([]);
    const search = ref('');
    const projectId = ref(0);
    const singleDelivery = ref<DeliveryOrder | null>(null);

    const filters = reactive({
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

    // ------------------------------
    // ACTIONS
    // ------------------------------
    async function fetchDeliveryOrders() {
        loading.value = true;
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: filters.search || search.value || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined
            };

            const response = await deliveryOrderService.getDeliveryOrders(params);

            if (!response.success) {
                showError('Failed to fetch delivery orders.');
                return;
            }

            const allOrders = response.data || [];
            // TODO: Switch to server-side filtering once API supports &status=Pending
            incompletedList.value = allOrders.filter((order) => order.Status !== 'Completed');
            completedList.value = allOrders.filter((order) => order.Status === 'Completed');

            if (response.pagination) {
                pagination.total = response.pagination.total;
                pagination.totalPages = response.pagination.totalPages;
                pagination.page = response.pagination.page;
                pagination.pageSize = response.pagination.pageSize;
            }
        } catch (error) {
            showError(error, 'Failed to fetch delivery orders.');
        } finally {
            loading.value = false;
        }
    }

    async function handleSearch(value: string) {
        search.value = value;
        pagination.page = 1; //Reset to first page when searching
        await fetchDeliveryOrders();
    }

    async function createDeliveryOrder(formData: FormData) {
        loading.value = true;
        try {
            const response = await deliveryOrderService.createDeliveryOrder(formData);

            if (!response.success) {
                showError(response.message || 'Failed to create delivery order.');
                return false;
            }

            showSuccess(response.message || 'Delivery order created successfully.');
            await fetchDeliveryOrders();
            return true;
        } catch (error: unknown) {
            if (error instanceof Error) {
                showError(error.message, 'Failed to create delivery order.');
            } else {
                showError('An unexpected error occurred.', 'Failed to create delivery order.');
            }
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function getSingleDeliveryOrder(deliveryId: number) {
        loading.value = true;
        try {
            const response = await deliveryOrderService.getSingleDeliveryOrder(deliveryId);

            if (!response.success || !response.data) {
                showError('Delivery order not found.');
                singleDelivery.value = null;
                return;
            }

            singleDelivery.value = response.data;
        } catch (error) {
            showError(error, 'Failed to fetch delivery order.');
            singleDelivery.value = null;
        } finally {
            loading.value = false;
        }
    }

    function clearFilters() {
        filters.search = '';
        filters.startDate = '';
        filters.endDate = '';
        pagination.page = 1;
        fetchDeliveryOrders();
    }

    function setPage(page: number) {
        pagination.page = page;
        fetchDeliveryOrders();
    }

    function setPageSize(pageSize: number) {
        pagination.pageSize = pageSize;
        pagination.page = 1;
        fetchDeliveryOrders();
    }

    // ------------------------------
    // RETURN
    // ------------------------------
    return {
        // state
        loading,
        incompletedList,
        completedList,
        search,
        projectId,
        singleDelivery,
        filters,
        pagination,
        // actions
        fetchDeliveryOrders,
        handleSearch,
        createDeliveryOrder,
        getSingleDeliveryOrder,
        clearFilters,
        setPage,
        setPageSize
    };
});
