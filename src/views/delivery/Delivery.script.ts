import { extractDeliveryOrder } from '@/services/smartScan.service';
import { useDeliveryStore } from '@/stores/delivery/delivery.store';
import { useProjectStore } from '@/stores/project/project.store';
import type { TableColumn } from '@/types/table.type';
import { useToast } from '@/utils/toastBus';
import { PhArrowsLeftRight, PhCheck, PhCheckCircle, PhDotsThreeVertical, PhEye, PhPlus, PhTrash, PhTruck, PhX, PhXCircle } from '@phosphor-icons/vue';
import { ProButton, ProCard, ProDatePicker, ProInput, ProMenu, ProModal, ProPagination, ProSelect, ProTable, ProTabs, ProTag } from '@prosync_solutions/ui';
import { useConfirm } from 'primevue/useconfirm';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SmartScanModal from './components/smartScan/SmartScanModal.vue';

export default defineComponent({
    name: 'Deliveries',
    components: { ProCard, ProButton, ProTag, ProTable, ProTabs, ProSelect, ProDatePicker, ProInput, ProModal, ProPagination, ProMenu, PhArrowsLeftRight, PhEye, PhPlus, PhCheckCircle, PhXCircle, PhCheck, PhX, PhTruck, PhTrash, PhDotsThreeVertical, SmartScanModal },
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
            { key: 'Created', label: 'Pending' },
            { key: 'Completed', label: 'Completed' },
            { key: 'Cancelled', label: 'Cancelled' }
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
                { key: 'rowIndex', label: '#', sortable: false } as any,
                { key: 'DocNo', label: 'DO Number', sortable: true } as any,
                { key: 'RefDoc', label: 'PO Number', sortable: true } as any,
                { key: 'SupplierName', label: 'Supplier', sortable: false } as any,
                { key: 'Date', label: 'Delivery Date', sortable: true } as any,
            ];

            if (isPurchasingRole) {
                cols.push({ key: 'ProjectName', label: 'Project', sortable: true } as any);
            }

            cols.push(
                { key: 'PlateNo', label: 'Plate No', sortable: true } as any,
                { key: 'Remark', label: 'Remark', sortable: false } as any,
                { key: 'Status', label: 'Status', sortable: true } as any,
                { key: 'actions', label: 'Action', actions: true } as any
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

        const startDate = ref('');
        const endDate = ref('');

        const handleSearch = (value: string) => {
            deliveryStore.filters.startDate = startDate.value;
            deliveryStore.filters.endDate = endDate.value;
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
        const handleUpdatePagination = (newPagination: { page: number; limit: number }) => {
            deliveryStore.setPageSize(newPagination.limit);
            deliveryStore.setPage(newPagination.page);
        };

        function handleFilterChange(filters: Record<string, any>): void {
            deliveryStore.filters.search = filters.search ?? '';
            deliveryStore.filters.projectId = filters.projectId ?? '';
            deliveryStore.pagination.page = 1;
            loadData();
        }

        function handleAction(type: 'view' | 'approve' | 'reject' | 'delete', row: any) {
            if (type === 'view') {
                router.push(`/deliveries/viewDelivery/${row.Id}`);
            } else if (type === 'approve') {
                selectedDeliveryId.value = row.Id;
                selectedDeliveryNo.value = row.DocNo;
                showApproveModal.value = true;
            } else if (type === 'reject') {
                selectedDeliveryId.value = row.Id;
                selectedDeliveryNo.value = row.DocNo;
                showRejectModal.value = true;
            } else if (type === 'delete') {
                const index = deliveryStore.list.findIndex(d => d.Id === row.Id);
                if (index !== -1) {
                    deliveryStore.list.splice(index, 1);
                    toast.add({
                        severity: 'success',
                        summary: 'Deleted',
                        detail: `Delivery order ${row.DocNo} has been deleted.`,
                        life: 3000
                    });
                }
            }
        }

        const showApproveModal = ref(false);
        const showRejectModal = ref(false);
        const selectedDeliveryId = ref<number | null>(null);
        const selectedDeliveryNo = ref<string>('');

        const confirmApprove = async () => {
            if (selectedDeliveryId.value) {
                await deliveryStore.updateDeliveryOrderStatus(selectedDeliveryId.value, 'Approved');
                showApproveModal.value = false;
            }
        };

        const confirmReject = async () => {
            if (selectedDeliveryId.value) {
                await deliveryStore.updateDeliveryOrderStatus(selectedDeliveryId.value, 'Rejected');
                showRejectModal.value = false;
            }
        };

        onMounted(() => {
            deliveryStore.setStatus('Created'); // default = Pending
            projectStore.fetchProjects();
        });

        const getStatusSeverity = (status: string) => {
            switch (status) {
                case 'Completed':
                case 'Reviewed':
                    return 'success';
                case 'Cancelled':
                    return 'danger';
                case 'Failed':
                    return 'danger';
                case 'Processing':
                    return 'info';
                case 'Pending':
                    return 'warning';
                case 'Draft':
                default:
                    return 'secondary';
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

        const formatDate = (dateString?: string | null) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        };

        const showSmartScanModal = ref(false);

        function handleSmartScanManual() {
            showSmartScanModal.value = false;
            router.push('/deliveries/createDelivery');
        }

        async function handleSmartScanStart(file: File) {
            showSmartScanModal.value = false;
            
            // Generate a random ID for the mock
            const mockId = Math.floor(Math.random() * 100000);
            
            const newMockDo = {
                Id: mockId,
                DocNo: `DO-SCAN-${mockId}`,
                RefDoc: '',
                PlateNo: '',
                Date: new Date().toISOString(),
                Status: 'Processing',
                CreatedAt: new Date().toISOString(),
                SupplierName: 'Scanning...',
                _sourceFile: file,
                _aiExtractedItems: []
            };
            
            // Add to store
            deliveryStore.list.unshift(newMockDo as any);
            
            toast.add({
                severity: 'info',
                summary: 'Scanning Document',
                detail: `AI is extracting data in the background...`,
                life: 3000
            });

            try {
                // Call the simulated/real API extraction
                const result = await extractDeliveryOrder(file);
                
                // Once done, update the mock DO
                const docIndex = deliveryStore.list.findIndex(d => d.Id === mockId);
                if (docIndex !== -1) {
                    const doRef = deliveryStore.list[docIndex] as any;
                    doRef.DocNo = result.doNo || doRef.DocNo;
                    doRef.RefDoc = result.soNo;
                    doRef.PlateNo = result.plateNo;
                    doRef.Date = result.deliveryDate || doRef.Date;
                    doRef.SupplierName = result.supplierName; 
                    doRef._aiExtractedItems = result.items;
                    
                    doRef.Status = 'Draft';
                    
                    toast.add({
                        severity: 'success',
                        summary: 'Extraction Complete',
                        detail: `${doRef.DocNo} extraction complete. Ready for review.`,
                        life: 5000
                    });
                }
            } catch (err: any) {
                const docIndex = deliveryStore.list.findIndex(d => d.Id === mockId);
                if (docIndex !== -1) {
                    deliveryStore.list[docIndex].Status = 'Failed';
                }
                toast.add({
                    severity: 'error',
                    summary: 'Extraction Failed',
                    detail: err?.message || 'Failed to extract document.',
                    life: 5000
                });
            }
        }

        const handleActionWithReview = (type: 'view' | 'approve' | 'reject' | 'delete', row: any) => {
            if (type === 'view' && row.Status === 'Draft') {
                // Navigate to Review Delivery
                // We'll pass the mock data via state or store later, but for now just route
                router.push(`/deliveries/reviewDelivery/${row.Id}`);
                return;
            }
            handleAction(type, row);
        };

        return {
            activeTab,
            tabItems,
            filteredDeliveries,
            deliveryListColumn,
            handleAction: handleActionWithReview,
            handleSearch,
            startDate,
            endDate,
            handleSortChange,
            handleTabChange,
            deliveryStore,
            handleFilterChange,
            currentSortField,
            currentSortOrder,
            getStatusSeverity,
            tableFilters,
            handleUpdatePagination,
            projectStore,
            isPurchasingRole,

            showApproveModal,
            showRejectModal,
            selectedDeliveryId,
            selectedDeliveryNo,
            confirmApprove,
            confirmReject,
            formatDate,
            showSmartScanModal,
            handleSmartScanStart,
            handleSmartScanManual
        };
    }
});
