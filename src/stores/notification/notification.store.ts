import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationService } from '@/services/notification.service';

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<any[]>([]);
    const unreadCount = ref(0);

    const allNotifications = ref<any[]>([]);
    const totalRecords = ref(0);
    const activeTab = ref<'all' | 'unread'>('all');
    const page = ref(1);
    const pageSize = ref(10);

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

    const fetchNotifications = async () => {
        loading.value = true;

        try {
            const res = await notificationService.getNotifications({
                page: page.value,
                pageSize: pageSize.value,
                sortBy: 'created_at',
                sortOrder: 'desc',
                ...(activeTab.value === 'unread' ? { isRead: false } : {})
            });

            allNotifications.value = res.data.notifications || [];
            totalRecords.value = res.data.total || 0;

            // sync unread count globally
            if (res.data.unreadCount !== undefined) {
                unreadCount.value = res.data.unreadCount;
            }
        } finally {
            loading.value = false;
        }
    };

    const markNotificationAsRead = async (id: number) => {
        await notificationService.markAsRead(id);

        // Update header list
        const headerItem = notifications.value.find((n) => n.id === id);
        if (headerItem) {
            headerItem.isRead = true;
            notifications.value = notifications.value.filter((n) => !n.isRead);
        }

        // Update full page list
        const pageItem = allNotifications.value.find((n) => n.id === id);
        if (pageItem) {
            pageItem.isRead = true;
        }

        unreadCount.value = Math.max(0, unreadCount.value - 1);
    };

    const markAllRead = async () => {
        await notificationService.markAllAsRead();

        notifications.value = [];
        allNotifications.value = allNotifications.value.map((n) => ({
            ...n,
            isRead: true
        }));

        unreadCount.value = 0;
    };

    const setTab = (tab: 'all' | 'unread') => {
        activeTab.value = tab;
        page.value = 1;
    };

    const setPage = (newPage: number) => {
        page.value = newPage;
    };

    return {
        // header
        notifications,
        unreadCount,
        fetchUnreadNotifications,

        // full page
        allNotifications,
        totalRecords,
        activeTab,
        page,
        pageSize,
        fetchNotifications,
        setTab,
        setPage,

        // shared
        loading,
        markNotificationAsRead,
        markAllRead
    };
});
