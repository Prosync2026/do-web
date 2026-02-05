import { budgetService } from '@/services/budget.service';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';
import * as XLSX from 'xlsx';

export default function useImportBudgetDialogLogic(
    props: { visible: boolean },
    emit: {
        (e: 'close'): void;
        (e: 'success'): void;
    }
) {
    const toast = useToast();
    const internalVisible = ref(props.visible);
    const selectedFile = ref<File | null>(null);
    const isSubmitting = ref(false);

    watch(
        () => props.visible,
        (val) => {
            internalVisible.value = val;
        }
    );

    function onHide() {
        emit('close');
        internalVisible.value = false;
        selectedFile.value = null;
    }

    function onDownloadFormat() {
        try {
            const headers = [
                [
                    'ITEM CODE', // item_code
                    'PUR.DESCRIPTION', // description
                    'ELEMENT', // element
                    'SUB ELEMENT', // sub_element
                    '1ST SUB ELEMENT', // 1st_sub_element
                    '2ND SUB ELEMENT', // 2nd_sub_element
                    'LOC 1', // location1
                    'LOC 2', // location2
                    'UNIT', // uom
                    'BUDGET QTY', // budget_qty
                    'RATE', // rate
                    'AMOUNT', // amount
                    'WASTAGE' // wastage
                ]
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(headers);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Template');

            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Budget_Template.xlsx';
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Download Failed',
                detail: 'Unable to create template file.',
                life: 3000
            });
        }
    }

    function onFileSelect(event: any) {
        const file = event.files?.[0];
        if (!file) {
            toast.add({
                severity: 'warn',
                summary: 'No File',
                detail: 'Please select a file.',
                life: 2000
            });
            return;
        }
        selectedFile.value = file;
        toast.add({
            severity: 'info',
            summary: 'File Selected',
            detail: file.name,
            life: 2000
        });
    }

    async function onSubmitUpload() {
        if (!selectedFile.value) {
            toast.add({
                severity: 'warn',
                summary: 'No File',
                detail: 'Please select a file before submitting.',
                life: 3000
            });
            return;
        }

        const projectId = JSON.parse(localStorage.getItem('selectedProject') || '{}')?.ProjectId;
        if (!projectId) {
            toast.add({
                severity: 'warn',
                summary: 'Missing Project',
                detail: 'Please select a project before importing.',
                life: 4000
            });
            return;
        }

        try {
            isSubmitting.value = true;

            const arrayBuffer = await selectedFile.value.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            const filteredData = jsonData
                .map((row) => {
                    const newRow: Record<string, any> = {};
                    Object.entries(row).forEach(([key, value]) => {
                        if (value !== null && value !== undefined && value !== '') {
                            newRow[key] = value;
                        }
                    });
                    return newRow;
                })
                .filter((row) => Object.keys(row).length > 0);

            if (filteredData.length === 0) {
                toast.add({
                    severity: 'warn',
                    summary: 'No Data',
                    detail: 'Excel contains no valid data to upload.',
                    life: 3000
                });
                return;
            }

            const newSheet = XLSX.utils.json_to_sheet(filteredData);
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Budget');

            const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
            const newFile = new File([wbout], selectedFile.value.name, {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const formData = new FormData();
            formData.append('projectId', String(projectId));
            formData.append('file', newFile);

            const response = await budgetService.createBudget(formData);

            if (response?.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Upload Successful',
                    detail: 'Budget file uploaded successfully!',
                    life: 3000
                });
                emit('success');
                onHide();
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Upload Failed',
                    detail: response?.message || 'Failed to upload file.',
                    life: 4000
                });
            }
        } catch (err: any) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: err?.response?.data?.message || 'An error occurred while uploading.',
                life: 4000
            });
        } finally {
            isSubmitting.value = false;
        }
    }

    return {
        internalVisible,
        onHide,
        onFileSelect,
        onDownloadFormat,
        onSubmitUpload,
        selectedFile,
        isSubmitting
    };
}
