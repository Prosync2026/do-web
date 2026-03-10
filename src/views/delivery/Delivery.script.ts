import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import { useProjectStore } from '@/stores/project/project.store';
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
        const projectStore = useProjectStore();
        const router = useRouter();
        const toast = useToast();
        const confirm = useConfirm();

        // User role
        type UserRole = 'PM' | 'PD' | 'PURC';
        const getUserRole = (): UserRole | null => {
            const user = localStorage.getItem('user');
            if (!user) return null;
            try {
                const parsed = JSON.parse(user);
                const role = parsed.user_project_role_code;
                if (role === 'PM' || role === 'PD' || role === 'PURC') {
                    return role;
                }
                return null;
            } catch {
                return null;
            }
        };

        const userRole = getUserRole();
        const isPurchasingRole = userRole === 'PURC';

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
        const deliveryListColumn = computed<TableColumn[]>(() => {
            const cols: TableColumn[] = [
                { field: 'rowIndex', header: '#', sortable: false },
                { field: 'DocNo', header: 'DO Number', sortable: true },
            ];

            if (isPurchasingRole) {
                cols.push({ field: 'ProjectName', header: 'Project', sortable: true });
            }

            cols.push(
                { field: 'PlateNo', header: 'Plate No', sortable: true },
                { field: 'Remark', header: 'Remark', sortable: false },
                { field: 'Status', header: 'Status', sortable: true, bodySlot: 'status' },
                { header: 'Action', action: true, actions: ['view'] }
            );

            return cols;
        });

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
            deliveryStore.filters.projectId = filters.projectId ?? '';
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
            projectStore.fetchProjects();
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

        const tableFilters = computed(() => {
            const filters: any[] = [];

            if (isPurchasingRole) {
                filters.push({
                    type: 'select',
                    field: 'projectId',
                    placeholder: 'Project',
                    options: [{ label: 'All Projects', value: '' }, ...projectStore.projectOptions],
                    model: deliveryStore.filters.projectId
                });
            }

            return filters;
        });

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
            getStatusSeverity,
            tableFilters
        };
    }
});
