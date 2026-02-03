import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import type { TableColumn } from '@/types/table.type';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'Deliveries',
    components: { Tag },
    setup() {
        const deliveryStore = useDeliveryStore();
        const router = useRouter();
        const toast = useToast();
        const confirm = useConfirm();

        // Tabs
        const tabItems = [
            { value: 'Created', label: 'Pending' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Cancelled', label: 'Cancelled' }
        ];

        const activeTab = ref<'Created' | 'Completed' | 'Cancelled'>('Created');

        const handleTabChange = (status: 'Created' | 'Completed' | 'Cancelled') => {
            activeTab.value = status;
            deliveryStore.setStatus(status);
        };

        // Pagination
        const startingIndex = computed(() => {
            return (deliveryStore.pagination.page - 1) * deliveryStore.pagination.pageSize;
        });

        // Filtered & numbered deliveries
        const filteredDeliveries = computed(() => {
            const list = deliveryStore.list;

            return list.map((item, index) => ({
                ...item,
                rowIndex: startingIndex.value + index + 1
            }));
        });

        // Sorting state
        const currentSortField = computed(() => {
            const reverseMap: Record<string, string> = {
                DocNo: 'DocNo',
                PlateNo: 'PlateNo',
                Status: 'Status',
                CreatedAt: 'CreatedAt'
            };
            return reverseMap[deliveryStore.sorting.sortBy] || '';
        });

        const currentSortOrder = computed(() => {
            if (!deliveryStore.sorting.sortBy) return 0;
            return deliveryStore.sorting.sortOrder === 'asc' ? 1 : -1;
        });

        // Columns
        const deliveryListColumn: TableColumn[] = [
            { field: 'rowIndex', header: '#', sortable: false },
            { field: 'DocNo', header: 'DO Number', sortable: true },
            { field: 'PlateNo', header: 'Plate No', sortable: true },
            { field: 'Remark', header: 'Remark', sortable: false },
            { field: 'Status', header: 'Status', sortable: true, bodySlot: 'status' },
            { header: 'Action', action: true, actions: ['view'] }
        ];

        const loadData = async () => {
            try {
                await deliveryStore.fetchDeliveryOrders();
            } catch (error) {
                console.error('Failed to load delivery orders:', error);
            }
        };

        const handleSearch = (value: string) => {
            deliveryStore.handleSearch(value);
            loadData();
        };

        const handleSortChange = ({ field, order }: { field: string; order: number }) => {
            if (!field || order === 0) {
                // Reset sorting
                deliveryStore.setSorting('', '');
                loadData();
                return;
            }

            const mapFieldToApi: Record<string, string> = {
                DocNo: 'DocNo',
                PlateNo: 'PlateNo',
                Status: 'Status'
            };

            const sortOrder = order === 1 ? 'asc' : 'desc';
            deliveryStore.setSorting(mapFieldToApi[field] || 'CreatedAt', sortOrder);
            loadData();
        };

        // Pagination & filter handlers
        function handlePageChange(page: number): void {
            deliveryStore.setPage(page);
        }

        function handlePageSizeChange(pageSize: number): void {
            deliveryStore.setPageSize(pageSize);
        }

        function handleFilterChange(filters: Record<string, any>): void {
            deliveryStore.filters.search = filters.search ?? '';
            deliveryStore.pagination.page = 1;
            loadData();
        }

        function handleAction(type: 'view', row: any) {
            if (type === 'view') {
                router.push(`/deliveries/viewDelivery/${row.Id}`);
            }
        }

        onMounted(() => {
            deliveryStore.setStatus('Created'); // default = Pending
        });

        const getStatusSeverity = (status: string) => {
            switch (status) {
                case 'Completed':
                    return 'success';
                case 'Cancelled':
                    return 'danger';
                case 'Created':
                default:
                    return 'warn';
            }
        };

        return {
            activeTab,
            tabItems,
            filteredDeliveries,
            deliveryListColumn,
            handleAction,
            handleSearch,
            handleSortChange,
            handleTabChange,
            deliveryStore,
            handlePageChange,
            handlePageSizeChange,
            handleFilterChange,
            currentSortField,
            currentSortOrder,
            getStatusSeverity
        };
    }
});
