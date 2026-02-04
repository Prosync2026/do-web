import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

export function usePurchasingDashboard() {
    const router = useRouter();
    const store = useRequestOrderStore();

    const recentActivity = ref<
        Array<{
            id: string | number;
            requestOrderNo: string;
            status: string;
            createdAt: string;
            updatedAt?: string;
        }>
    >([]);

    const user = localStorage.getItem('user');
    let userRole = '';
    if (user) {
        try {
            userRole = JSON.parse(user).role || '';
        } catch {
            userRole = '';
        }
    }

    onMounted(() => {
        store.fetchOrders().then(() => fetchRecentActivity());
    });

    const filteredOrders = computed(() => {
        if (userRole.toLowerCase() === 'purchasing') {
            return store.orders || [];
        }
        return (store.orders || []).filter((o) => o.requestedBy === userRole);
    });

    const pendingApprovals = computed(() => filteredOrders.value.filter((o) => o.status === 'Submitted').length);
    const approvedCount = computed(() => filteredOrders.value.filter((o) => o.status === 'Approved').length);
    const rejectedCount = computed(() => filteredOrders.value.filter((o) => o.status === 'Rejected').length);
    const pendingValue = computed(() => filteredOrders.value.filter((o) => o.status === 'Submitted').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0));

    const urgentRequests = computed(() => filteredOrders.value.filter((o) => o.isUrgent && o.status === 'Submitted').length);
    const urgentValue = computed(() => {
        const urgent = filteredOrders.value.filter((o) => o.isUrgent && o.status === 'Submitted');
        if (urgent.length > 0) {
            return urgent.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        }
        return pendingValue.value;
    });

    const currentStatus = computed(() => {
        if (pendingApprovals.value > 0) return 'Submitted';
        if (approvedCount.value > 0) return 'Stable';
        return 'Idle';
    });

    async function fetchRecentActivity() {
        try {
            await store.fetchOrders();
            recentActivity.value = (store.orders || [])
                .filter((o) => o.roNumber)
                .sort((a, b) => {
                    const aTime = new Date(a.requestedAt).getTime();
                    const bTime = new Date(b.requestedAt).getTime();
                    return bTime - aTime;
                })
                .slice(0, 5)
                .map((o) => ({
                    id: o.id,
                    requestOrderNo: o.roNumber,
                    status: String(o.status || 'Unknown'),
                    createdAt: o.requestedAt,
                    updatedAt: o.deliveryDate ? (o.deliveryDate instanceof Date ? o.deliveryDate.toISOString() : String(o.deliveryDate)) : undefined
                }));
        } catch (err) {
            console.error('Failed to fetch recent activity:', err);
            recentActivity.value = [];
        }
    }

    function formatTimeAgo(dateString: string): string {
        if (!dateString) return 'Unknown time';
        const diff = Date.now() - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    function navigateToRequestOrders() {
        router.push('/request-orders');
    }

    return {
        pendingApprovals,
        approvedCount,
        rejectedCount,
        pendingValue,
        urgentRequests,
        urgentValue,
        currentStatus,
        navigateToRequestOrders,
        recentActivity,
        formatTimeAgo,
        fetchRecentActivity
    };
}
