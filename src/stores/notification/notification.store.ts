import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationService } from '@/services/notification.service';

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<any[]>([]);
    const unreadCount = ref(0);
    const loading = ref(false);

    const fetchUnreadNotifications = async () => {
        loading.value = true;
        try {
            const res = await notificationService.getNotifications({
                isRead: false,
                page: 1,
                pageSize: 10,
                sortBy: 'created_at',
                sortOrder: 'desc'
            });

            notifications.value = res.data.notifications || [];
            unreadCount.value = res.data.unreadCount ?? notifications.value.length;
        } finally {
            loading.value = false;
        }
    };

    const markNotificationAsRead = async (id: number) => {
        await notificationService.markAsRead(id);

        const item = notifications.value.find((n) => n.id === id);
        if (item) item.isRead = true;

        notifications.value = notifications.value.filter((n) => !n.isRead);

        unreadCount.value = Math.max(0, unreadCount.value - 1);
    };

    const markAllRead = async () => {
        await notificationService.markAllAsRead();

        notifications.value = [];
        unreadCount.value = 0;
    };

    return {
        notifications,
        unreadCount,
        loading,
        fetchUnreadNotifications,
        markNotificationAsRead,
        markAllRead
    };
});
