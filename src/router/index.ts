import AppLayout from '@/layout/AppLayout.vue';
import type { PermissionCode } from '@/permissions';
import { PermissionCodes } from '@/permissions'; //for type only
import { useAuthStore } from '@/stores/auth/auth.store';
import { usePermissionStore } from '@/stores/permission/permission.store';

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '/',
                name: 'dashboard',
                component: () => import('@/views/dashboard/Dashboard.vue')
            },
            {
                path: '/request-orders',
                name: 'request-orders',
                component: () => import('@/views/request-orders/RequestOrders.vue'),
                meta: {
                    requiresAuth: true,
                    permissions: [PermissionCodes.VIEW_REQUEST_ORDER],
                    breadcrumb: [{ label: 'Request Orders', route: '/request-orders' }]
                }
            },
            {
                path: '/request-orders/create',
                name: 'create-request-orders',
                component: () => import('@/views/request-orders/components/page/CreateRequestOrders.vue'),
                meta: {
                    requiresAuth: true,
                    permissions: [PermissionCodes.CREATE_REQUEST_ORDER],
                    breadcrumb: [{ label: 'Request Orders', route: '/request-orders' }, { label: 'Create' }]
                }
            },
            {
                path: '/purchase-orders',
                name: 'purchase-orders',
                component: () => import('@/views/purchase-orders/PurchaseOrders.vue'),
                meta: {
                    breadcrumb: [{ label: 'Purchase Orders', route: '/purchase-orders' }]
                }
            },
            {
                path: '/purchase-orders/view/:poNumber',
                name: 'ViewDetailsPO',
                component: () => import('@/views/purchase-orders/components/ViewDetailsPO.vue'),
                meta: {
                    breadcrumb: [{ label: 'Purchase Orders', route: '/purchase-orders' }, { label: 'View' }]
                }
            },
            {
                path: '/budget',
                name: 'budget',
                component: () => import('@/views/budget/budgetList/Budget.vue'),
                meta: {
                    breadcrumb: [{ label: 'Budget', route: '/budget' }]
                }
            },
            {
                path: '/bcr',
                name: 'budgetChangeRequest',
                component: () => import('@/views/budget/budgetChangeRequest/BCR.vue'),
                meta: {
                    breadcrumb: [{ label: 'Budget Change Request', route: '/bcr' }]
                }
            },
            {
                path: '/bcr/create',
                name: 'budgetChangeRequest-create',
                component: () => import('@/views/budget/components/page/CreateBCR.vue'),
                meta: {
                    breadcrumb: [{ label: 'Budget Change Request', route: '/bcr' }, { label: 'Create Budget Change Request' }]
                }
            },
            {
                path: '/bcr/edit/:budgetChangeRequestId',
                name: 'budgetChangeRequest-edit',
                component: () => import('@/views/budget/components/page/EditBCR.vue'),
                meta: {
                    breadcrumb: [{ label: 'BCR', route: '/bcr' }, { label: 'Edit Budget Change Request' }]
                }
            },
            {
                path: '/bcr/view/:budgetChangeRequestId',
                name: 'budgetChangeRequest-view',
                component: () => import('@/views/budget/components/page/ViewBCR.vue'),
                meta: {
                    breadcrumb: [{ label: 'BCR', route: '/bcr' }, { label: 'View Budget Change Request' }]
                }
            },
            {
                path: '/deliveries',
                name: 'deliveries',
                component: () => import('@/views/delivery/Deliveries.vue'),
                meta: {
                    breadcrumb: [{ label: 'Deliveries', route: '/deliveries' }]
                }
            },
            {
                path: '/deliveries/createDelivery',
                name: 'deliveries-create',
                component: () => import('@/views/delivery/components/pages/createDelivery/createDelivery.vue'),
                meta: {
                    breadcrumb: [{ label: 'Deliveries', route: '/deliveries' }, { label: 'Create Delivery' }]
                }
            },
            {
                path: '/deliveries/viewDelivery/:deliveryOrderId',
                name: 'deliveries-view',
                component: () => import('@/views/delivery/components/pages/viewDelivery/ViewDelivery.vue'),
                meta: {
                    breadcrumb: [{ label: 'Deliveries', route: '/deliveries' }, { label: 'View Delivery' }]
                }
            },
            {
                path: '/companyList',
                name: 'companyList',
                component: () => import('@/views/company/CompanyList.vue'),
                meta: {
                    breadcrumb: [{ label: 'Company List', route: '/companyList' }]
                }
            },
            {
                path: '/companyDetail/:companyId',
                name: 'companyDetail',
                component: () => import('@/views/company/CompanyDetail.vue'),
                meta: {
                    breadcrumb: [{ label: 'Company List', route: '/companyList' }, { label: 'Company Detail' }]
                }
            },
            {
                path: '/projectList',
                name: 'projectList',
                component: () => import('@/views/project/projectList/ProjectList.vue'),
                meta: {
                    breadcrumb: [{ label: 'Project List', route: '/projectList' }]
                }
            },
            {
                path: '/projectDetail/:projectId',
                name: 'projectDetail',
                component: () => import('@/views/project/projectDetail/ProjectDetail.vue'),
                meta: {
                    breadcrumb: [{ label: 'Project List', route: '/projectList' }, { label: 'Project Detail' }]
                }
            }
        ]
    },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/auth/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Login', public: true }]
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const permissionStore = usePermissionStore();

    // Auth check
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next({ name: 'login' });
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
        return next({ name: 'dashboard' });
    }

    // Permission check
    const requiredPermissions = to.meta.permissions as PermissionCode[] | undefined;

    if (requiredPermissions && requiredPermissions.length > 0) {
        // Ensure permissions are loaded
        if (permissionStore.permissions.length === 0) {
            await permissionStore.fetchPermissions(authStore.user?.project_id);
        }

        const hasAccess = requiredPermissions.some((p) => permissionStore.hasPermission(p));

        if (!hasAccess) {
            return next({
                name: 'dashboard',
                query: { unauthorized: '1' }
            });
        }
    }

    next();
});

export default router;
