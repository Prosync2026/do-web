import { PhCheck } from '@phosphor-icons/vue';
import { defineComponent, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/utils/toastBus';
import { useNotificationStore } from '@/stores/notification/notification.store';
import { getRouteByDocumentType } from '@/utils/route-map.util';

export default defineComponent({
    name: 'Notifications',

    setup() {
        const router = useRouter();
        const toast = useToast();
        const notificationStore = useNotificationStore();

        //    initial load
        onMounted(() => {
            notificationStore.fetchNotifications();
        });

        //   tab & page store driven
        watch(
            () => [notificationStore.activeTab, notificationStore.page],
            () => {
                notificationStore.fetchNotifications();
            }
        );

        //    actions
        const goToDetails = async (item: any) => {
            try {
                // Mark as read
                if (!item.isRead) {
                    await notificationStore.markNotificationAsRead(item.id);

                    toast.add({
                        severity: 'success',
                        summary: 'Marked as Read',
                        life: 1500
                    });
                }

                // Get the route
                const route = getRouteByDocumentType(item.documentType);

                if (route) {
                    router.push(route);
                } else if (item.module && item.referenceId) {
                    router.push({
                        name: item.module,
                        params: { id: item.referenceId }
                    });
                }
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Unable to open notification',
                    life: 2500
                });
                console.error('Notification click failed:', error);
            }
        };

        const changeTab = (tab: 'all' | 'unread') => {
            notificationStore.setTab(tab);
        };

        const onPageChange = (event: any) => {
            notificationStore.setPage(event.page + 1);
        };

        const markAllAsRead = async () => {
            await notificationStore.markAllRead();

            toast.add({
                severity: 'success',
                summary: 'All Notifications Marked as Read',
                life: 2500
            });

            // optional: refetch if on unread tab
            notificationStore.fetchNotifications();
        };

        return {
            notificationStore,
            goToDetails,
            changeTab,
            onPageChange,
            markAllAsRead
        };
    }
});
