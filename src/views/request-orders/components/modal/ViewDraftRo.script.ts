import { requestOrderService } from '@/services/requestOrder.service';
import type { DraftRO } from '@/types/request-order.type';
import { showError } from '@/utils/showNotification.utils';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'ViewDraftRo',
    components: { Dialog, Button, DataTable, Column, InputText, Badge },
    props: { visible: { type: Boolean, required: true } },
    emits: ['update:visible', 'update:count'],
    setup(props, { emit }) {
        const router = useRouter();
        const toast = useToast();
        const confirm = useConfirm();

        const searchQuery = ref('');
        const localVisible = ref(props.visible);
        const drafts = ref<DraftRO[]>([]);
        const loading = ref(false);

        // Mock project data ( later be replaced with API or store)
        const companyProjects = [
            {
                company: 'Alunan Asas',
                projects: [
                    { ProjectId: 1, name: 'MKT', status: 'Active', budget: 'RM 50,000' },
                    { ProjectId: 2, name: 'AR469', status: 'Inactive', budget: 'RM 20,000' },
                    { ProjectId: 3, name: 'BKT2CH', status: 'Active', budget: 'RM 75,000' }
                ]
            },
            {
                company: 'Metrio',
                projects: [
                    { ProjectId: 4, name: 'MK3-B', status: 'Active', budget: 'RM 100,000' },
                    { ProjectId: 5, name: 'Forum 2', status: 'Inactive', budget: 'RM 10,000' }
                ]
            }
        ];

        const fetchDrafts = async () => {
            loading.value = true;
            try {
                const res = await requestOrderService.getRequestOrders({ status: 'Draft' });
                const data = res.data || [];

                drafts.value = data.map((output: any): DraftRO => {
                    let projectName = '';
                    for (const company of companyProjects) {
                        const project = company.projects.find((p) => p.ProjectId === output.ProjectId);
                        if (project) {
                            projectName = project.name;
                            break;
                        }
                    }

                    return {
                        id: output.Id,
                        draftId: output.DocNo || '',
                        project: projectName || '',
                        budgetType: output.PrType || '',
                        requestedBy: output.CreatedBy || '',
                        itemsCount: output.RequestOrderItems?.length || 0,
                        lastModified: output.UpdatedAt || output.CreatedAt || '',
                        roNumber: output.DocNo || '',
                        roDate: output.RequestOrderDate || '',
                        items: (output.RequestOrderItems || []).map((item: any) => ({
                            itemCode: item.ItemCode || '',
                            description: item.Description || '',
                            location: item.Location || '',
                            uom: item.Uom || '',
                            quantity: item.Quantity || '',
                            price: item.Rate || '',
                            deliveryDate: item.DeliveryDate || '',
                            notes: item.Notes || '',
                            remark: item.Remark || ''
                        })),
                        overallRemark: output.Remark || '',
                        attachments: output.Attachment ? JSON.parse(output.Attachment) : []
                    };
                });
            } catch (error) {
                showError(error, 'Failed to fetch draft request orders.');
            } finally {
                loading.value = false;
            }
        };

        onMounted(fetchDrafts);

        const filteredDrafts = computed(() => {
            if (!searchQuery.value.trim()) return drafts.value;
            const query = searchQuery.value.toLowerCase();
            return drafts.value.filter((draft) => draft.draftId.toLowerCase().includes(query) || draft.requestedBy.toLowerCase().includes(query) || draft.project.toLowerCase().includes(query) || draft.budgetType.toLowerCase().includes(query));
        });

        const draftCount = computed(() => drafts.value.length);

        watch(
            () => drafts.value.length,
            (newCount) => emit('update:count', newCount),
            { immediate: true }
        );

        watch(
            () => props.visible,
            (newVal) => {
                localVisible.value = newVal;
                if (newVal) fetchDrafts(); // refetch when reopened
            }
        );

        watch(localVisible, (val) => emit('update:visible', val));

        const handleClose = () => {
            localVisible.value = false;
        };

        const handleContinue = (draft: DraftRO) => {
            router.push({
                path: '/request-orders/create',
                query: { draftId: draft.id?.toString() ?? '', mode: 'edit-draft' }
            });

            toast.add({
                severity: 'info',
                summary: 'Draft Loaded',
                detail: `Continuing draft ${draft.roNumber}`,
                life: 3000
            });

            handleClose();
        };

        const handleDelete = (draft: DraftRO) => {
            confirm.require({
                message: `Are you sure you want to delete draft ${draft.draftId}?`,
                header: 'Confirm Delete',
                icon: 'pi pi-exclamation-triangle',
                acceptClass: 'p-button-danger',
                rejectClass: 'p-button-secondary',
                acceptLabel: 'Yes, Delete',
                rejectLabel: 'Cancel',
                accept: async () => {
                    try {
                        await requestOrderService.deleteRequestOrder(Number(draft.draftId));

                        toast.add({
                            severity: 'success',
                            summary: 'Draft Deleted',
                            detail: `Draft ${draft.draftId} deleted successfully.`,
                            life: 3000
                        });
                        await fetchDrafts(); // refresh list
                    } catch (error) {
                        showError(error, `Failed to delete draft ${draft.draftId}.`);
                    }
                },
                reject: () => {
                    toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Draft deletion cancelled.', life: 2500 });
                }
            });
        };

        const formatDate = (dateString: string): string => {
            if (!dateString) return ' ';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
        };

        return {
            searchQuery,
            drafts,
            filteredDrafts,
            handleClose,
            handleContinue,
            handleDelete,
            formatDate,
            localVisible,
            draftCount,
            loading
        };
    }
});
