<script lang="ts" src="./Notifications.script.ts"></script>

<template>
    <div class="p-6 card">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Notifications</h1>

            <Button label="Mark All as Read" severity="secondary" outlined @click="markAllAsRead" ><template #icon><PhCheck class="mr-2" /></template></Button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4 mb-4 border-b pb-2">
            <Button label="All" text :class="notificationStore.activeTab === 'all' ? 'font-bold border-b-2 border-primary' : ''" @click="changeTab('all')" />

            <Button label="Unread" text :class="notificationStore.activeTab === 'unread' ? 'font-bold border-b-2 border-primary' : ''" @click="changeTab('unread')" />
        </div>

        <!-- Content -->
        <div v-if="notificationStore.loading" class="py-10 text-center">
            <ProgressSpinner />
        </div>

        <div v-else-if="notificationStore.allNotifications.length === 0" class="text-center text-gray-400 py-10">No notifications found.</div>

        <div v-else class="space-y-3">
            <div v-for="item in notificationStore.allNotifications" :key="item.id" class="p-4 rounded-lg border cursor-pointer transition hover:shadow" :class="item.isRead ? '' : 'bg-blue-50'" @click="goToDetails(item)">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-semibold">
                            {{ item.title }}
                        </div>

                        <p class="text-sm text-gray-600 mt-1">
                            {{ item.message }}
                        </p>
                    </div>

                    <div class="text-xs text-gray-500 text-right">
                        {{ item.created_at }}
                        <div v-if="!item.isRead" class="text-orange-500 font-medium">Unread</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="notificationStore.totalRecords > notificationStore.pageSize" class="mt-6 flex justify-end">
            <Paginator :rows="notificationStore.pageSize" :totalRecords="notificationStore.totalRecords" @page="onPageChange" />
        </div>
    </div>
</template>
